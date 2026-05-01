import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PublicPetClient from "./PublicPetClient";

export default async function PublicPetPage({ params }) {
  const resolvedParams = await params;
  const petId = parseInt(resolvedParams.id);

  if (isNaN(petId)) {
    return notFound();
  }

  const session = await getServerSession(authOptions);
  const isVet = session?.user?.role === 'VET';

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      owner: {
        select: {
          name: true,
          surname: true,
          phone: true,
        }
      }
    }
  });

  if (!pet) {
    return notFound();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* HEADER */}
      <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#4ade80' }}>PetMed</div>
        <a href="/" style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          Iniciar Sesión / Registrarse
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '30px', borderTop: '5px solid #ef4444' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <i className='bx bxs-ambulance' style={{ fontSize: '48px', color: '#ef4444' }}></i>
            <h2 style={{ margin: '10px 0 5px 0', color: 'white' }}>Ficha de Emergencia</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Si encontraste a esta mascota, por favor contacta al dueño inmediatamente.</p>
          </div>

        {isVet && (
          <div style={{ marginBottom: '20px' }}>
            <PublicPetClient petId={pet.id} />
          </div>
        )}

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#3b82f6', textAlign: 'center' }}>{pet.name}</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '15px', marginTop: '15px' }}>
            <div><strong style={{color: 'var(--text-muted)'}}>Especie:</strong> {pet.species}</div>
            <div><strong style={{color: 'var(--text-muted)'}}>Raza:</strong> {pet.breed || '-'}</div>
            <div><strong style={{color: 'var(--text-muted)'}}>Sexo:</strong> {pet.sex || '-'}</div>
            <div><strong style={{color: 'var(--text-muted)'}}>Nacimiento:</strong> {pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : '-'}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Datos Críticos de Salud</h4>
          <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Alergias:</strong> {pet.knownAllergies || 'Ninguna conocida'}</div>
            <div><strong>Condiciones Previas:</strong> {pet.pastDiseases || 'Ninguna conocida'}</div>
            <div><strong>Medicación Actual:</strong> {pet.currentMedication || 'Ninguna'}</div>
            <div><strong>Estado Clínico:</strong> <span style={{ padding: '2px 8px', borderRadius: '12px', background: pet.healthStatus === 'SALUDABLE' ? 'rgba(74, 222, 128, 0.2)' : pet.healthStatus === 'EN_TRATAMIENTO' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: pet.healthStatus === 'SALUDABLE' ? '#4ade80' : pet.healthStatus === 'EN_TRATAMIENTO' ? '#facc15' : '#ef4444', fontWeight: 'bold' }}>{pet.healthStatus}</span></div>
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Datos del Dueño</h4>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>{pet.owner.name} {pet.owner.surname}</div>
          <a href={`tel:${pet.owner.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#4ade80', color: 'black', padding: '10px 20px', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
            <i className='bx bxs-phone-call'></i> Llamar al Dueño: {pet.owner.phone || 'No registrado'}
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
