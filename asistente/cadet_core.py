import os
import json
import sqlite3
import time
import random
import re
from datetime import datetime
from openai import OpenAI
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Load .env manually if it exists
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip() and not line.startswith("#") and "=" in line:
                key, val = line.strip().split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

class CadetUserSession:
    def __init__(self, user_id, api_key=None, model="gpt-3.5-turbo"):
        self.user_id = user_id
        
        # Try to load API key from config.json if available
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cadet_data", "config.json")
        loaded_api_key = None
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    global_config = json.load(f)
                    loaded_api_key = global_config.get("api_key")
            except:
                pass
                
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or loaded_api_key
        print(f"--- DEBUG: API Key Loaded: {'YES' if self.api_key else 'NO'} ---")
        if self.api_key:
            print(f"--- DEBUG: API Key starts with: {self.api_key[:10]}... ---")
            
        self.model = model
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        
        self.config_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cadet_data", "users", str(user_id))
        os.makedirs(self.config_dir, exist_ok=True)
        
        self.history_db = os.path.join(self.config_dir, "conversation_history.db")
        self.preferences_file = os.path.join(self.config_dir, "user_preferences.json")
        self.cache_file = os.path.join(self.config_dir, "response_cache.json")
        self.token_file = os.path.join(self.config_dir, "token.json")
        
        self.setup_database()
        self.preferences = self.load_preferences()
        self.cache = self.load_cache()

    def setup_database(self):
        with sqlite3.connect(self.history_db) as conn:
            cursor = conn.cursor()
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_input TEXT NOT NULL,
                assistant_response TEXT NOT NULL,
                session_id TEXT,
                response_source TEXT DEFAULT 'openai'
            )
            ''')
            conn.commit()

    def load_preferences(self):
        default_prefs = {
            "musica": {"generos_favoritos": [], "artistas_favoritos": []},
            "conduccion": {"velocidad_preferida": "unknown"},
            "conversacion": {"temas_favoritos": [], "nivel_detalle": "normal"},
            "opciones": {"voice_enabled": True, "calendar_enabled": False},
            "datos_personales": {}
        }
        if os.path.exists(self.preferences_file):
            with open(self.preferences_file, "r", encoding="utf-8") as f:
                try:
                    prefs = json.load(f)
                    # merge defaults
                    for k, v in default_prefs.items():
                        if k not in prefs:
                            prefs[k] = v
                    return prefs
                except:
                    pass
        return default_prefs

    def save_preferences(self, prefs=None):
        if prefs:
            self.preferences = prefs
        with open(self.preferences_file, "w", encoding="utf-8") as f:
            json.dump(self.preferences, f, indent=4, ensure_ascii=False)

    def load_cache(self):
        if os.path.exists(self.cache_file):
            with open(self.cache_file, "r", encoding="utf-8") as f:
                try:
                    return json.load(f)
                except:
                    pass
        return {}

    def save_cache(self):
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump(self.cache, f, indent=4, ensure_ascii=False)

    def _apply_preference_updates(self, updates):
        if "datos_personales" not in self.preferences:
            self.preferences["datos_personales"] = {}
            
        for update in updates:
            cat = update.get("category", "").lower()
            action = update.get("action", "")
            val = update.get("value", "").lower()
            
            if not cat or not action or not val:
                continue
                
            # Mapeo a config existente para que la UI no se rompa
            if cat in ["musica", "música", "music", "genero_musical", "género"]:
                if action == "add" and val not in self.preferences["musica"]["generos_favoritos"]:
                    self.preferences["musica"]["generos_favoritos"].append(val)
                elif action == "remove" and val in self.preferences["musica"]["generos_favoritos"]:
                    self.preferences["musica"]["generos_favoritos"].remove(val)
            elif cat in ["artista", "artista_musical", "banda", "cantante"]:
                if "artistas_favoritos" not in self.preferences["musica"]:
                    self.preferences["musica"]["artistas_favoritos"] = []
                if action == "add" and val not in self.preferences["musica"]["artistas_favoritos"]:
                    self.preferences["musica"]["artistas_favoritos"].append(val)
                elif action == "remove" and val in self.preferences["musica"]["artistas_favoritos"]:
                    self.preferences["musica"]["artistas_favoritos"].remove(val)
            elif cat in ["conduccion", "conducción", "velocidad", "driving"]:
                if action in ["set", "add"]:
                    self.preferences["conduccion"]["velocidad_preferida"] = val
            else:
                # Categorías dinámicas inventadas por la IA
                if action == "set":
                    self.preferences["datos_personales"][cat] = val
                elif action == "add":
                    if cat not in self.preferences["datos_personales"]:
                        self.preferences["datos_personales"][cat] = []
                    elif not isinstance(self.preferences["datos_personales"][cat], list):
                        self.preferences["datos_personales"][cat] = [self.preferences["datos_personales"][cat]]
                    
                    if val not in self.preferences["datos_personales"][cat]:
                        self.preferences["datos_personales"][cat].append(val)
                elif action == "remove":
                    if cat in self.preferences["datos_personales"]:
                        if isinstance(self.preferences["datos_personales"][cat], list):
                            # Try exact match
                            if val in self.preferences["datos_personales"][cat]:
                                self.preferences["datos_personales"][cat].remove(val)
                            else:
                                # Try lenient match (e.g. "base de datos" vs "bases de datos")
                                for item in list(self.preferences["datos_personales"][cat]):
                                    if val in item or item in val:
                                        self.preferences["datos_personales"][cat].remove(item)
                        else:
                            del self.preferences["datos_personales"][cat]
                            
        self.save_preferences()

    def process_message(self, text):
        text_lower = text.lower().strip()

        # Get history
        history = []
        with sqlite3.connect(self.history_db) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_input, assistant_response FROM conversations ORDER BY id DESC LIMIT 5")
            for user_msg, assistant_msg in reversed(cursor.fetchall()):
                history.append({"role": "user", "content": user_msg})
                history.append({"role": "assistant", "content": assistant_msg})

        sys_prompt = f"""Eres CADET, un asistente de conversación diseñado para acompañar a conductores.
Preferencias y datos conocidos del usuario:
{json.dumps(self.preferences, indent=2)}

INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN DE DATOS:
Debes usar la herramienta `update_user_preferences` SIEMPRE que el usuario mencione:
1. Sus gustos musicales: DEBES separar estrictamente géneros musicales (categoría: "musica") de artistas o bandas (categoría: "artista").
2. Datos demográficos: su edad, de dónde es, dónde vive (crear categorías dinámicas como "edad", "ubicacion").
3. Metas de vida u objetivos: (ej: "quiero ser millonario" -> categoría "metas").
4. Intereses profesionales o hobbies: (ej: "bases de datos", "programación", "fútbol").
5. Si el usuario indica que NO le gusta algo que actualmente está en su perfil, DEBES usar la acción 'remove' indicando exactamente la misma categoría en la que se encuentra y una palabra clave similar para eliminarlo.
Usa tu libertad para crear categorías dinámicas (ej: "edad", "metas", "hobbies", "ubicacion", "desagrados") según corresponda. Si el usuario no menciona explícitamente un dato, asume que es "unknown". No alucines información.
Responde de manera natural y conversacional, y ten en cuenta estos datos extraídos para personalizar tus respuestas."""

        messages = [{"role": "system", "content": sys_prompt}] + history + [{"role": "user", "content": text}]
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "update_user_preferences",
                    "description": "Llama a esta función SIEMPRE que el usuario comparta CUALQUIER dato sobre sí mismo: gustos musicales (separa artistas de géneros), edad, metas de vida, hobbies, profesión, conducción, etc.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "updates": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "category": {
                                            "type": "string",
                                            "description": "Categoría libre. Ej: 'musica' (solo géneros), 'artista' (para bandas/cantantes), 'edad', 'metas', 'hobbies', 'ubicacion', 'comida', 'conduccion'."
                                        },
                                        "action": {
                                            "type": "string",
                                            "enum": ["add", "remove", "set"],
                                            "description": "'add' para agregar a una lista de gustos, 'remove' para eliminar, 'set' para un valor único"
                                        },
                                        "value": {
                                            "type": "string",
                                            "description": "El valor extraído (ej. 'trap', 'pizza', 'rápida')"
                                        }
                                    },
                                    "required": ["category", "action", "value"]
                                }
                            }
                        },
                        "required": ["updates"]
                    }
                }
            }
        ]
        
        try:
            if not self.client:
                raise Exception("No API key")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=tools,
                temperature=0.7,
                max_tokens=500
            )
            
            response_msg = response.choices[0].message
            
            # Check for tool calls (preference updates)
            if response_msg.tool_calls:
                for tool_call in response_msg.tool_calls:
                    if tool_call.function.name == "update_user_preferences":
                        args = json.loads(tool_call.function.arguments)
                        self._apply_preference_updates(args.get("updates", []))
                
                # Convert response_msg to dict
                assistant_message = {
                    "role": "assistant",
                    "content": response_msg.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        } for tc in response_msg.tool_calls
                    ]
                }
                messages.append(assistant_message)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": response_msg.tool_calls[0].id,
                    "name": "update_user_preferences",
                    "content": "Preferencias actualizadas correctamente en la base de datos."
                })
                
                final_response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500
                )
                reply = final_response.choices[0].message.content
            else:
                reply = response_msg.content
                
            source = "openai"
        except Exception as e:
            print(f"--- DEBUG ERROR OPENAI: {str(e)} ---")
            reply = f"No pude conectarme al cerebro. Detalles: {str(e)}"
            source = "offline"

        # Save to DB
        with sqlite3.connect(self.history_db) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversations (timestamp, user_input, assistant_response, session_id, response_source) VALUES (?, ?, ?, ?, ?)",
                (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), text, reply, "web_session", source)
            )
            conn.commit()

        return reply
