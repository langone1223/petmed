'use client';
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    }, false);

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Ignorar errores de escaneo temporal (cuando no hay un QR en cámara)
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px', color: 'black' }}>
        <h4 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Escanear QR del Paciente</h4>
        <div id="reader" style={{ width: '100%' }}></div>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', marginTop: '15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
