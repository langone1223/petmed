'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Modal
  const [showDataModal, setShowDataModal] = useState(false);
  
  // Check auth
  useEffect(() => {
    const savedToken = localStorage.getItem('cadet_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserData(savedToken);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUserData = async (authToken) => {
    try {
      const res = await fetch('http://localhost:8000/api/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setVoiceEnabled(data.preferences?.opciones?.voice_enabled ?? true);
        fetchHistory(authToken);
      } else {
        logout();
      }
    } catch (e) {
      logout();
    }
  };

  const fetchHistory = async (authToken) => {
    const res = await fetch('http://localhost:8000/api/chat/history', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.history || []);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      
      if (isLogin) {
        localStorage.setItem('cadet_token', data.access_token);
        setToken(data.access_token);
        fetchUserData(data.access_token);
      } else {
        // Auto-login after registration
        const loginRes = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.detail || 'Login failed after registration');
        
        localStorage.setItem('cadet_token', loginData.access_token);
        setToken(loginData.access_token);
        fetchUserData(loginData.access_token);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('cadet_token');
    setToken(null);
    setUser(null);
    setMessages([]);
  };

  const speak = (text) => {
    if (!voiceEnabled) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = async () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    if (token) {
      await fetch('http://localhost:8000/api/preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ voice_enabled: newState })
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'cadet', text: data.response }]);
        if (data.voice_enabled) {
          speak(data.response);
        }
        // Refresh user preferences silently to catch learning
        fetchUserData(token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="glass-panel auth-card">
          <h1>CADET</h1>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Usuario" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" style={{width: '100%'}}>
              {isLogin ? 'Ingresar' : 'Registrarse'}
            </button>
            {authError && <div className="error-msg">{authError}</div>}
          </form>
          <div className="auth-toggle">
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <span onClick={() => {setIsLogin(!isLogin); setAuthError('');}}>
              {isLogin ? 'Regístrate aquí' : 'Ingresa aquí'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="glass-panel sidebar">
        <div className="sidebar-header">
          <h2>CADET Panel</h2>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px'}}>
            Piloto: {user?.username}
          </div>
        </div>
        
        <div className="preferences-section">
          <div className="pref-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Voz del Asistente</h3>
            <label className="switch">
              <input type="checkbox" checked={voiceEnabled} onChange={toggleVoice} />
              <span className="slider"></span>
            </label>
          </div>
          
          <button className="btn-secondary" style={{width: '100%', marginBottom: '1.5rem', fontSize: '0.85rem'}} onClick={() => setShowDataModal(true)}>
            Ver todos mis datos
          </button>
          
          {user?.preferences && (
            <>
              <div className="pref-item">
                <h3>Géneros Musicales</h3>
                <div className="tag-list">
                  {user.preferences.musica?.generos_favoritos?.length > 0 
                    ? user.preferences.musica.generos_favoritos.map(g => <span key={g} className="tag">{g}</span>)
                    : <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Sin definir</span>
                  }
                </div>
              </div>
              <div className="pref-item">
                <h3>Artistas Favoritos</h3>
                <div className="tag-list">
                  {user.preferences.musica?.artistas_favoritos?.length > 0 
                    ? user.preferences.musica.artistas_favoritos.map(a => <span key={a} className="tag" style={{background: 'rgba(167, 139, 250, 0.2)', color: '#d8b4fe'}}>{a}</span>)
                    : <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Sin definir</span>
                  }
                </div>
              </div>
              <div className="pref-item">
                <h3>Conducción</h3>
                <div className="tag-list">
                  {user.preferences.conduccion?.velocidad_preferida && user.preferences.conduccion.velocidad_preferida !== 'unknown'
                    ? <span className="tag">{user.preferences.conduccion.velocidad_preferida}</span>
                    : <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Sin definir</span>
                  }
                </div>
              </div>
            </>
          )}
        </div>
        
        <button className="btn-secondary" onClick={logout} style={{marginTop: 'auto'}}>
          Cerrar Sesión
        </button>
      </div>

      {/* Main Chat */}
      <div className="glass-panel chat-main">
        <div className="chat-header">
          <h3 style={{fontWeight: 500}}>Conversación Activa</h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'}}>
            <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981'}}></div>
            Asistente en línea
          </div>
        </div>
        
        <div className="messages-container">
          {messages.length === 0 && (
            <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem'}}>
              No hay mensajes anteriores. ¡Saluda a Cadet!
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.sender === 'user' ? 'msg-user' : 'msg-cadet'}`}>
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="message msg-cadet" style={{opacity: 0.7}}>
              ...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-area">
          <form className="input-form" onSubmit={sendMessage}>
            <input 
              type="text" 
              placeholder="Habla con Cadet..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Enviar
            </button>
          </form>
        </div>
      </div>

      {/* Data Modal */}
      {showDataModal && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDataModal(false)}>×</button>
            <h2 style={{color: 'var(--accent-color)', marginBottom: '1rem'}}>Base de Datos del Piloto</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
              Estos son todos los datos y preferencias que CADET ha aprendido sobre ti:
            </p>
            <div className="json-view">
              {JSON.stringify(user?.preferences, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
