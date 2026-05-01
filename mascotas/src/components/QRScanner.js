'use client';
import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
                onScan(decodedText);
              }).catch(console.error);
            }
          },
          () => {} // ignore scan errors
        );
      } catch (err) {
        setErrorMsg("Error al iniciar cámara: Dale permisos de cámara a tu navegador.");
        console.error(err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px', color: 'black' }}>
        <h4 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Escanear QR del Paciente</h4>
        {errorMsg && <p style={{ color: 'red', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>{errorMsg}</p>}
        <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', marginTop: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
