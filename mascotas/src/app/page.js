'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER',
    name: '',
    surname: '',
    dni: '',
    phone: '',
    address: '',
    licenseNumber: '',
    specialty: '',
    yearsOfExperience: '',
    university: '',
    documentUrl: '',
    termsAccepted: false
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError('Credenciales inválidas');
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      // Register
      if (!formData.termsAccepted) {
        setError('Debes aceptar los términos y condiciones');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Error al registrarse');
          setLoading(false);
        } else {
          // Auto login after register
          const signInRes = await signIn('credentials', {
            redirect: false,
            email: formData.email,
            password: formData.password,
          });
          if (!signInRes?.error) {
            router.push('/dashboard');
          } else {
            setIsLogin(true);
            setLoading(false);
          }
        }
      } catch (err) {
        setError('Error de conexión');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="auth-container">
        <div className="glass-card">
          <div className="card-header">
            <h2>{isLogin ? 'Bienvenido de nuevo' : 'Crear Cuenta'}</h2>
            <p>{isLogin ? 'Por favor, ingresa tus credenciales' : 'Únete a nuestra plataforma premium'}</p>
          </div>

          <div className="tabs">
            <div className={`tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>
              Iniciar Sesión
            </div>
            <div className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>
              Registrarse
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <>
                <div className="input-group">
                  <i className='bx bx-user-circle'></i>
                  <select name="role" value={formData.role} onChange={handleChange} required>
                    <option value="USER">Dueño de Mascota</option>
                    <option value="VET">Profesional Veterinario</option>
                  </select>
                  <label>Tipo de Cuenta</label>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="input-group">
                    <i className='bx bx-user'></i>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder=" " />
                    <label>Nombre</label>
                  </div>
                  <div className="input-group">
                    <input type="text" name="surname" value={formData.surname} onChange={handleChange} required placeholder=" " style={{ paddingLeft: '15px' }} />
                    <label style={{ left: '15px' }}>Apellido</label>
                  </div>
                </div>

                <div className="input-group">
                  <i className='bx bx-id-card'></i>
                  <input type="text" name="dni" value={formData.dni} onChange={handleChange} required placeholder=" " />
                  <label>DNI</label>
                </div>

                {formData.role === 'VET' && (
                  <>
                    <div className="input-group">
                      <i className='bx bx-certification'></i>
                      <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required placeholder=" " />
                      <label>N° Matrícula</label>
                    </div>
                    <div className="input-group">
                      <i className='bx bx-star'></i>
                      <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} required placeholder=" " />
                      <label>Especialidad</label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="input-group">
                        <i className='bx bx-time'></i>
                        <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} required placeholder=" " />
                        <label>Años Exp.</label>
                      </div>
                      <div className="input-group">
                        <input type="text" name="university" value={formData.university} onChange={handleChange} required placeholder=" " style={{ paddingLeft: '15px' }} />
                        <label style={{ left: '15px' }}>Universidad</label>
                      </div>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input type="checkbox" id="terms" checked={formData.termsAccepted} onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})} />
                  <label htmlFor="terms" style={{ fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Acepto los <a href="/terms" target="_blank" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>términos y condiciones</a> de la plataforma
                  </label>
                </div>
              </>
            )}

            <div className="input-group">
              <i className='bx bx-envelope'></i>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder=" " />
              <label>Correo electrónico</label>
            </div>

            <div className="input-group">
              <i className='bx bx-lock-alt'></i>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder=" " 
              />
              <label>Contraseña</label>
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                <i className={showPassword ? 'bx bx-show' : 'bx bx-hide'}></i>
              </button>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}</span>
              {loading && <i className='bx bx-loader-alt bx-spin loader-icon'></i>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
