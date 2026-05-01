# CADET Web App

CADET es un asistente de conversación interactivo impulsado por Inteligencia Artificial (OpenAI), diseñado con una interfaz moderna y un backend robusto capaz de extraer, clasificar y aprender tus preferencias (metas, edades, música, intereses) de forma dinámica.

## Requisitos Previos

- Python 3.8 o superior
- [Node.js](https://nodejs.org/) (incluye npm)
- Una API Key válida de OpenAI

---

## ⚙️ Instalación y Configuración

### 1. Configurar la API Key de OpenAI
En la raíz de la carpeta `asistente`, crea un archivo llamado **`.env`** e inserta tu llave de la siguiente forma:
```env
OPENAI_API_KEY=sk-proj-aqui_va_tu_llave_completa
```

### 2. Dependencias del Backend (Python)
Abre una terminal en la carpeta `asistente` e instala las librerías necesarias:
```bash
pip install fastapi uvicorn pydantic pyjwt bcrypt python-multipart openai python-dotenv
```

### 3. Dependencias del Frontend (Next.js)
Navega a la carpeta `frontend` e instala los paquetes de Node:
```bash
cd frontend
npm install
```

---

## 🚀 Cómo Ejecutar el Proyecto

Para usar la aplicación web, debes correr el servidor Backend y el servidor Frontend al mismo tiempo en dos terminales separadas.

### Paso 1: Iniciar el Backend
Abre tu primera terminal en la carpeta **`asistente`** y ejecuta:
```bash
uvicorn backend_app:app --reload
```
*(El "cerebro" y la base de datos empezarán a correr en http://localhost:8000)*

### Paso 2: Iniciar el Frontend
Abre tu segunda terminal, ingresa a la carpeta **`frontend`** y ejecuta:
```bash
npm run dev
```
*(La interfaz gráfica se levantará en http://localhost:3000)*

---

## 🎮 Uso de la Aplicación

1. Abre tu navegador favorito y ve a **http://localhost:3000**.
2. Escribe un nombre de usuario y contraseña para **Registrarte**. Una vez registrado, el sistema iniciará sesión automáticamente.
3. Comienza a conversar con CADET.
4. **Prueba la Inteligencia**: Cuéntale datos sobre ti (ej: *"tengo 15 años y quiero aprender sobre bases de datos"*). CADET extraerá esa información silenciosamente.
5. Puedes hacer clic en **Ver todos mis datos** en el panel lateral para inspeccionar en tiempo real todo lo que la IA ha aprendido sobre ti.
