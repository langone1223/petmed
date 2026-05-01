'use client';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function PublicPetClient({ petId }) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const linkScannedPatient = async () => {
    try {
      const res = await fetch('/api/vet/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, pin: pinInput })
      });
      if (res.ok) {
        toast.success('Paciente vinculado exitosamente. Puedes cerrar esta ventana e ir a tu panel.');
        setShowPinModal(false);
        setPinInput('');
      } else {
        const err = await res.json();
        toast.error(err.error || 'PIN incorrecto o expirado');
      }
    } catch (e) {
      toast.error('Error de conexión');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#4ade80' }}>Acceso Veterinario</h4>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Has escaneado a esta mascota. ¿Quieres agregarla a tus pacientes clínicos?
        </p>
        <button onClick={() => setShowPinModal(true)} style={{ background: '#4ade80', color: 'black', padding: '10px 20px', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer' }}>
          <i className='bx bx-plus-medical'></i> Vincular como Paciente
        </button>
      </div>

      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px', borderTop: '5px solid #4ade80' }}>
            <h4 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'center' }}>Vincular Paciente</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>
              Solicita al dueño el PIN temporal de 6 dígitos generado desde su panel.
            </p>
            <input 
              type="text" 
              placeholder="Ej: 123456" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              maxLength={6}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '20px', textAlign: 'center', letterSpacing: '3px', fontWeight: 'bold', marginBottom: '15px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: '12px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button onClick={linkScannedPatient} style={{ flex: 1, padding: '12px', background: '#4ade80', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
