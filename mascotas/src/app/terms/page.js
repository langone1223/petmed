import fs from 'fs';
import path from 'path';

export default function TermsPage() {
  const filePath = path.join(process.cwd(), 'terms.txt');
  let termsContent = 'Términos y condiciones no encontrados.';
  
  try {
    if (fs.existsSync(filePath)) {
      termsContent = fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error('Error reading terms file:', err);
  }

  return (
    <div className="flex justify-center items-center min-h-screen" style={{ padding: '20px' }}>
      <div className="glass-card" style={{ maxWidth: '800px', width: '100%', padding: '40px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--primary-color)' }}>Términos y Condiciones</h1>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-color)', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
          {termsContent}
        </div>
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a href="/" style={{ background: 'var(--primary-color)', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
            Volver
          </a>
        </div>
      </div>
    </div>
  );
}
