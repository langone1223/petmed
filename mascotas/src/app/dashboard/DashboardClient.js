'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const PetGPSMap = dynamic(() => import('@/components/PetGPSMap'), { ssr: false });
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

export default function DashboardClient({ user }) {
  const ToasterComponent = <Toaster position='top-right' />;
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    surname: user.surname || '',
    dni: user.dni || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    socialMedia: user.socialMedia || '',
    workplacePhotos: user.workplacePhotos || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // VET search and patients
  const [vetTab, setVetTab] = useState('search'); // 'search' or 'patients'
  const [myPatients, setMyPatients] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // Clinical Medical Record Form (VET ONLY)
  const [recordData, setRecordData] = useState({ 
    temperature: '', heartRate: '', respiratoryRate: '', realWeight: '', generalStatus: '', physicalExam: '',
    presumptiveDiagnosis: '', confirmedDiagnosis: '', medicationDetails: '', professionalIndications: '',
    vaccineType: '', vaccineDate: '', nextDose: '', dewormingProduct: '', dewormingDate: '', dewormingType: '',
    diagnosedDiseases: '', performedSurgeries: '', patientEvolution: '', labResults: '', xRays: '', ultrasounds: ''
  });

  // Add / Edit Pet Form (OWNER ONLY)
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);
  const [petData, setPetData] = useState({ 
    name: '', species: 'Perro', breed: '', birthDate: '', sex: '', color: '', photoUrl: '', microchip: '',
    pastDiseases: '', surgeries: '', knownAllergies: '', currentMedication: '', diet: '',
    currentSymptoms: '', symptomsSince: '', behaviorChanges: ''
  });

  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({ title: '', presumptiveDiagnosis: '', confirmedDiagnosis: '', medicationDetails: '', professionalIndications: '' });

  const [appointments, setAppointments] = useState([]);
  const [ownerTab, setOwnerTab] = useState('pets'); // pets, appointments
  const [appointmentForm, setAppointmentForm] = useState({ vetId: '', petId: '', date: '', reason: '' });
  const [generatedPin, setGeneratedPin] = useState(null);
  const [accessHistory, setAccessHistory] = useState([]);
  const [linkedVets, setLinkedVets] = useState([]);

  useEffect(() => {
    if (user.role !== 'VET' && appointmentForm.petId) {
      fetch(`/api/pets/linked-vets?petId=${appointmentForm.petId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) setLinkedVets(data);
          else setLinkedVets([]);
        })
        .catch(() => setLinkedVets([]));
    } else {
      setLinkedVets([]);
    }
  }, [appointmentForm.petId, user.role]);

  const fetchVetPatients = async () => {
    try {
      const res = await fetch('/api/vet/patients');
      if (res.ok) {
        const data = await res.json();
        setMyPatients(data.patients);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/vet/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generatePin = async (petId) => {
    try {
      const res = await fetch('/api/pets/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPin(data);
        toast.success('Código temporal generado');
      } else {
        toast.error(data.error || 'Error al generar código');
      }
    } catch (e) {
      toast.error('Error de conexión al generar el PIN');
    }
  };

  const fetchAccessHistory = async (petId) => {
    try {
      const res = await fetch(`/api/pets/access-history?petId=${petId}`);
      if (res.ok) {
        const data = await res.json();
        setAccessHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user.role === 'VET') {
      fetchVetPatients();
      fetchTemplates();
    }
    fetchAppointments(); // Both Owner and Vet can have appointments
  }, [user.role]);

  useEffect(() => {
    if (selectedPet && user.role !== 'VET') {
      fetchAccessHistory(selectedPet.id);
      setGeneratedPin(null);
    }
  }, [selectedPet, user.role]);

  const [scannedPetId, setScannedPetId] = useState(null);
  const [pinInput, setPinInput] = useState('');

  const handleScan = (decodedText) => {
    try {
      const url = new URL(decodedText);
      const parts = url.pathname.split('/');
      const petIdFromUrl = parts[parts.length - 1];
      
      if (petIdFromUrl && !isNaN(petIdFromUrl)) {
        setShowScanner(false);
        setScannedPetId(petIdFromUrl);
      } else {
        toast.error('QR no válido para PetMed');
      }
    } catch (e) {
      toast.error('Formato QR no reconocido');
    }
  };

  const linkScannedPatient = async () => {
    try {
      const res = await fetch('/api/vet/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: scannedPetId, pin: pinInput })
      });
      if (res.ok) {
        toast.success('Paciente vinculado exitosamente');
        setScannedPetId(null);
        setPinInput('');
        fetchVetPatients();
        setVetTab('patients');
      } else {
        const err = await res.json();
        toast.error(err.error || 'PIN incorrecto o expirado');
      }
    } catch (e) {
      toast.error('Error de conexión');
    }
  };

  const handleExportPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('timeline-to-export');
    
    // Hide buttons temporarily for clean export
    const buttons = element.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');

    // Force light mode colors for PDF readability
    const originalBackground = element.style.background;
    const originalColor = element.style.color;
    element.style.background = '#ffffff';
    element.style.color = '#000000';
    
    // Also fix all child elements text color to be visible on white
    const textElements = element.querySelectorAll('span, div, h5, p');
    const originalStyles = [];
    textElements.forEach(el => {
      originalStyles.push({ el, color: el.style.color, bg: el.style.background });
      if (window.getComputedStyle(el).color === 'rgb(255, 255, 255)') {
        el.style.color = '#000000';
      }
      if (el.style.background.includes('rgba(255, 255, 255, 0.1)')) {
        el.style.background = '#f1f5f9';
      }
    });

    const opt = {
      margin:       10,
      filename:     `Ficha_Medica_${selectedPet?.name || 'Mascota'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();

    // Restore original styles
    element.style.background = originalBackground;
    element.style.color = originalColor;
    originalStyles.forEach(({ el, color, bg }) => {
      el.style.color = color;
      el.style.background = bg;
    });
    buttons.forEach(btn => btn.style.display = '');
  };

  const [showQR, setShowQR] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  const isProfileIncomplete = !user.name || !user.surname || !user.dni || !user.address;

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const renderValidationBadge = (pet, fieldName, labelName) => {
    if (pet[fieldName]) {
      const dateText = pet.validatedAt ? getRelativeTime(pet.validatedAt) : '';
      const vetName = pet.validatedBy ? `por Dr. ${pet.validatedBy.name} ${pet.validatedBy.surname} (MP ${pet.validatedBy.licenseNumber || 'N/A'})` : '';
      return (
        <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', display: 'inline-block', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
          🟢 Validado {vetName} 📅 {dateText}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', display: 'inline-block', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
        🟡 Sin Validar
      </span>
    );
  };

  const renderUnifiedTimeline = (pet) => {
    const medicalRecords = pet.medicalRecords || [];
    const ownerReports = pet.ownerReports || [];

    // Map into unified events
    const events = [
      ...medicalRecords.map(r => ({ ...r, type: 'VET_CONSULTATION', timestamp: new Date(r.date) })),
      ...ownerReports.map(r => ({ ...r, type: 'OWNER_REPORT', timestamp: new Date(r.createdAt) }))
    ];

    if (events.length === 0) {
      return <p style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '10px 0' }}>No hay historial registrado.</p>;
    }

    // Sort descending
    events.sort((a, b) => b.timestamp - a.timestamp);

    const publicUrl = `${window.location.origin}/public/pet/${pet.id}`;

    return (
      <div id="timeline-to-export">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowQR(!showQR)} style={{ background: 'var(--card-bg)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className='bx bx-qr'></i> {showQR ? 'Ocultar QR' : 'Generar QR de Emergencia'}
          </button>
          <button onClick={handleExportPDF} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className='bx bxs-file-pdf'></i> Exportar PDF
          </button>
        </div>

        {showQR && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <QRCodeSVG value={publicUrl} size={150} level={"H"} />
            <p style={{ color: 'black', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>Escanea este código en caso de emergencia para acceder a la ficha pública.</p>
            <a href={publicUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>Abrir Enlace Directo</a>
          </div>
        )}

        <div className="timeline" style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {events.map((ev, idx) => {
          if (ev.type === 'OWNER_REPORT') {
            return (
              <div key={`owner-${ev.id}`} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-27px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: '#eab308', boxShadow: '0 0 0 4px rgba(234, 179, 8, 0.2)' }}></div>
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', borderLeft: '4px solid #eab308' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#eab308', fontWeight: 'bold' }}>
                      🟡 REPORTE DEL DUEÑO - [{getRelativeTime(ev.createdAt)}]
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.timestamp.toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-color)' }}>
                    <div><strong style={{color: '#facc15'}}>Síntomas:</strong> {ev.symptoms}</div>
                    {ev.symptomsSince && <div><strong>Desde:</strong> {ev.symptomsSince}</div>}
                    {ev.behaviorChanges && <div><strong>Comportamiento:</strong> {ev.behaviorChanges}</div>}
                  </div>
                </div>
              </div>
            );
          }

          // Vet Consultation
          return (
            <div key={`vet-${ev.id}`} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-27px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 4px rgba(74, 222, 128, 0.2)' }}></div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.1)', borderLeft: '4px solid #4ade80' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold' }}>
                    🟢 CONSULTA VETERINARIA - [{getRelativeTime(ev.date)}]
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.timestamp.toLocaleDateString()}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#facc15', fontWeight: 'bold' }}>🧾 Diagnóstico:</span> <span style={{ color: 'var(--text-color)' }}>{ev.confirmedDiagnosis || 'Consulta de rutina'}</span></div>
                  <div><span style={{ color: '#3b82f6', fontWeight: 'bold' }}>🩺 Examen:</span> <span style={{ color: 'var(--text-color)' }}>{ev.physicalExam || '-'}</span></div>
                  {ev.medicationDetails && <div><span style={{ color: '#ec4899', fontWeight: 'bold' }}>💊 Tratamiento:</span> <span style={{ color: 'var(--text-color)' }}>{ev.medicationDetails}</span></div>}
                  {ev.professionalIndications && <div><span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>📋 Indicaciones:</span> <span style={{ color: 'var(--text-color)' }}>{ev.professionalIndications}</span></div>}
                  <div><span style={{ color: '#10b981', fontWeight: 'bold' }}>⚖️ Peso:</span> <span style={{ color: 'var(--text-color)' }}>{ev.realWeight ? `${ev.realWeight} kg` : '-'}</span></div>
                </div>

                {ev.vet && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>👨‍⚕️ Firmado por:</span> Dr. {ev.vet.name} {ev.vet.surname} (MP {ev.vet.licenseNumber})
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    setIsSaving(true);
    await fetch('/api/user/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setIsSaving(false);
    window.location.reload(); 
  };

  const getInitials = () => {
    if (user.name && user.surname) return `${user.name[0]}${user.surname[0]}`.toUpperCase();
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleSearch = async () => {
    setSearchError('');
    setSearchedUser(null);
    setSelectedPet(null);
    try {
      const res = await fetch(`/api/vet/search?userId=${searchId}`);
      if (res.ok) {
        const data = await res.json();
        setSearchedUser(data.user);
      } else {
        setSearchError('Usuario no encontrado. Verifica el ID numérico.');
      }
    } catch (err) {
      setSearchError('Error al buscar');
    }
  };

  const submitMedicalRecord = async (e) => {
    e.preventDefault();
    if (isSubmittingRecord) return;
    setIsSubmittingRecord(true);
    try {
      await fetch('/api/records/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedPet.id, ...recordData })
      });
      toast.success('Ficha Médica Clínica guardada exitosamente con firma digital.');
      fetchVetPatients();
      setSelectedPet(null);
      setRecordData({ temperature: '', realWeight: '', heartRate: '', respiratoryRate: '', physicalExam: '', presumptiveDiagnosis: '', confirmedDiagnosis: '', medicationDetails: '', professionalIndications: '' });
    } catch (e) {
      toast.error('Error al guardar la ficha clínica');
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  const handleAddPet = async (e) => {
    e.preventDefault();
    if (editingPetId) {
      const pet = user.pets.find(p => p.id === editingPetId);
      const hasValidations = pet.breedValidated || pet.birthDateValidated || pet.microchipValidated || pet.allergiesValidated;
      
      if (hasValidations) {
        const confirmed = window.confirm('⚠️ Modificar estos datos eliminará las validaciones clínicas actuales relacionadas. ¿Deseas continuar?');
        if (!confirmed) return;
      }
      
      await fetch('/api/pets/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPetId, ...petData })
      });
    } else {
      await fetch('/api/pets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
      });
    }
    window.location.reload();
  };

  const handleEditClick = (pet) => {
    setEditingPetId(pet.id);
    setPetData({
      name: pet.name || '', species: pet.species || 'Perro', breed: pet.breed || '', birthDate: pet.birthDate ? pet.birthDate.split('T')[0] : '', 
      sex: pet.sex || '', color: pet.color || '', photoUrl: pet.photoUrl || '', microchip: pet.microchip || '',
      pastDiseases: pet.pastDiseases || '', surgeries: pet.surgeries || '', knownAllergies: pet.knownAllergies || '', 
      currentMedication: pet.currentMedication || '', diet: pet.diet || '',
      currentSymptoms: pet.currentSymptoms || '', symptomsSince: pet.symptomsSince || '', behaviorChanges: pet.behaviorChanges || ''
    });
    setShowAddPet(true);
    setSelectedPet(null);
  };

  const handleValidatePetField = async (petId, field) => {
    await fetch('/api/pets/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petId, field })
    });
    handleSearch();
  };

  return (
    <>
      {ToasterComponent}
      <div className="dashboard-container">
        <div className="topbar">
        <div className="logo">PetMed</div>
        <div className="profile-menu">
          <div className="profile-avatar" onClick={() => setShowProfile(!showProfile)}>
            {getInitials()}
            {isProfileIncomplete && <span className="incomplete-badge">!</span>}
          </div>

          {showProfile && (
            <div className="glass-card profile-dropdown" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: '15px' }}>Datos Personales</h3>
              
              {user.role === 'VET' && !user.isVerified && (
                <div style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' }}>
                  <i className='bx bx-info-circle'></i> Tu matrícula está pendiente de verificación por un administrador.
                </div>
              )}

              <div className="profile-field">
                <label>ID de Usuario (Compartir)</label>
                <input type="text" value={user.id} readOnly style={{ opacity: 0.7, fontWeight: 'bold', color: 'var(--primary-color)' }} />
              </div>
              <div className="profile-field"><label>Nombre</label><input type="text" name="name" value={formData.name} onChange={handleProfileChange} /></div>
              <div className="profile-field"><label>Apellido</label><input type="text" name="surname" value={formData.surname} onChange={handleProfileChange} /></div>
              <div className="profile-field"><label>DNI</label><input type="text" name="dni" value={formData.dni} onChange={handleProfileChange} /></div>
              <div className="profile-field"><label>Teléfono</label><input type="text" name="phone" value={formData.phone} onChange={handleProfileChange} /></div>
              <div className="profile-field"><label>Domicilio</label><input type="text" name="address" value={formData.address} onChange={handleProfileChange} /></div>
              
              {user.role === 'VET' && (
                <>
                  <div className="profile-field"><label>Bio / Presentación</label><textarea name="bio" value={formData.bio} onChange={handleProfileChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', resize: 'none' }} /></div>
                  <div className="profile-field"><label>Redes Sociales (URL)</label><input type="text" name="socialMedia" value={formData.socialMedia} onChange={handleProfileChange} /></div>
                  <div className="profile-field"><label>Fotos del Consultorio (URL)</label><input type="text" name="workplacePhotos" value={formData.workplacePhotos} onChange={handleProfileChange} /></div>
                </>
              )}

              <button onClick={saveProfile} className="submit-btn" style={{ padding: '10px', fontSize: '14px' }} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button onClick={() => signOut()} className="logout-btn">Cerrar Sesión</button>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="glass-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {user.role === 'VET' ? (
            <div>
              <h4 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <i className='bx bxs-dashboard'></i> Dashboard Inteligente
              </h4>
              
              {/* Intelligent Stats Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pacientes Totales</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{myPatients.length}</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>En Tratamiento / Críticos</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                    {myPatients.filter(p => p.healthStatus === 'CRITICO' || p.healthStatus === 'EN_TRATAMIENTO').length}
                  </div>
                </div>
              </div>

              {/* Alerts Panel */}
              {myPatients.filter(p => p.healthStatus === 'CRITICO').length > 0 && (
                <div style={{ marginBottom: '25px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', borderRadius: '12px' }}>
                  <h6 style={{ color: '#ef4444', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className='bx bxs-bell-ring'></i> Alertas Clínicas (Pacientes Críticos)
                  </h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myPatients.filter(p => p.healthStatus === 'CRITICO').map(p => (
                      <div key={p.id} onClick={() => { setVetTab('patients'); setSelectedPet(p); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                        <div>
                          <strong>{p.name}</strong> <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({p.species})</span>
                        </div>
                        <span style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Ver Ficha</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <button onClick={() => { setVetTab('patients'); setSelectedPet(null); }} style={{ background: vetTab === 'patients' ? 'rgba(74, 222, 128, 0.2)' : 'none', color: vetTab === 'patients' ? '#4ade80' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <i className='bx bx-list-ul'></i> Mis Pacientes Atendidos
                </button>
                <button onClick={() => { setVetTab('templates'); setSelectedPet(null); }} style={{ background: vetTab === 'templates' ? 'rgba(168, 85, 247, 0.2)' : 'none', color: vetTab === 'templates' ? '#a855f7' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <i className='bx bx-file'></i> Plantillas Clínicas
                </button>
                <button onClick={() => { setVetTab('appointments'); setSelectedPet(null); }} style={{ background: vetTab === 'appointments' ? 'rgba(236, 72, 153, 0.2)' : 'none', color: vetTab === 'appointments' ? '#ec4899' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <i className='bx bx-calendar'></i> Agenda de Turnos
                </button>
              </div>


              {showScanner && (
                <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
              )}

              {scannedPetId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
                  <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px', borderTop: '5px solid #4ade80' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: 'white', textAlign: 'center' }}>Vincular Paciente</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>
                      Mascota escaneada (ID: {scannedPetId}). Solicita al dueño el PIN de seguridad de 6 dígitos generado desde su panel para incorporarlo a tus pacientes.
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
                      <button onClick={() => setScannedPetId(null)} style={{ flex: 1, padding: '12px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Cancelar
                      </button>
                      <button onClick={linkScannedPatient} style={{ flex: 1, padding: '12px', background: '#4ade80', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Vincular
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {vetTab === 'patients' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h5 style={{ margin: 0, color: '#3b82f6' }}>Añadir Nuevo Paciente</h5>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setShowScanner(true)} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <i className='bx bx-qr-scan' style={{ fontSize: '18px' }}></i> Escanear QR
                      </button>
                    </div>
                  </div>

                  {myPatients.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Aún no has registrado atenciones clínicas en ninguna mascota.</p>
                  ) : (
                    myPatients.map(pet => (
                      <div key={pet.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #4ade80' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h5 style={{ margin: '0 0 5px 0', color: '#4ade80' }}>{pet.name} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({pet.species} - {pet.breed || 'Sin raza'})</span></h5>
                            <div style={{ fontSize: '13px', color: 'var(--text-color)', marginBottom: '5px' }}>
                              <strong>Dueño:</strong> {pet.owner?.name} {pet.owner?.surname}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '15px' }}>
                              <span><i className='bx bx-phone'></i> {pet.owner?.phone || 'No registrado'}</span>
                              <span><i className='bx bx-envelope'></i> {pet.owner?.email}</span>
                            </div>
                          </div>
                          <button onClick={() => { setSelectedPet(pet); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            Ver Ficha Clínica
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {vetTab === 'templates' && (
                <div>
                  <h5 style={{ color: '#a855f7', marginBottom: '15px' }}><i className='bx bx-plus-circle'></i> Crear Nueva Plantilla</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px' }}>
                    <input placeholder="Título (Ej. Consulta General, Vacunación)" value={templateForm.title} onChange={e => setTemplateForm({...templateForm, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                    <textarea placeholder="Diagnóstico Presuntivo" value={templateForm.presumptiveDiagnosis} onChange={e => setTemplateForm({...templateForm, presumptiveDiagnosis: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', resize: 'none' }} />
                    <textarea placeholder="Diagnóstico Confirmado" value={templateForm.confirmedDiagnosis} onChange={e => setTemplateForm({...templateForm, confirmedDiagnosis: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', resize: 'none' }} />
                    <textarea placeholder="Medicación (con dosis)" value={templateForm.medicationDetails} onChange={e => setTemplateForm({...templateForm, medicationDetails: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', resize: 'none' }} />
                    <textarea placeholder="Indicaciones para el Dueño" value={templateForm.professionalIndications} onChange={e => setTemplateForm({...templateForm, professionalIndications: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', resize: 'none' }} />
                    
                    <button onClick={async () => {
                      if (!templateForm.title) return alert('El título es obligatorio.');
                      const res = await fetch('/api/vet/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templateForm) });
                      if (res.ok) {
                        alert('Plantilla guardada con éxito.');
                        setTemplateForm({ title: '', presumptiveDiagnosis: '', confirmedDiagnosis: '', medicationDetails: '', professionalIndications: '' });
                        fetchTemplates();
                      }
                    }} className="submit-btn" style={{ padding: '10px', background: '#a855f7' }}>Guardar Plantilla</button>
                  </div>

                  <h5 style={{ color: '#a855f7', marginTop: '30px', marginBottom: '15px' }}><i className='bx bx-library'></i> Mis Plantillas Guardadas</h5>
                  {templates.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Aún no has creado ninguna plantilla.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {templates.map(t => (
                        <div key={t.id} style={{ background: 'rgba(168, 85, 247, 0.1)', borderLeft: '4px solid #a855f7', padding: '15px', borderRadius: '8px' }}>
                          <strong style={{ display: 'block', color: '#a855f7', marginBottom: '5px' }}>{t.title}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-color)' }}>
                            {t.presumptiveDiagnosis && <div>• <strong>Presuntivo:</strong> {t.presumptiveDiagnosis}</div>}
                            {t.medicationDetails && <div>• <strong>Medicación:</strong> {t.medicationDetails}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {vetTab === 'appointments' && (
                <div>
                  <h5 style={{ color: '#ec4899', marginBottom: '15px' }}><i className='bx bx-calendar'></i> Agenda de Turnos</h5>
                  {appointments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No tienes turnos agendados o pendientes.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {appointments.map(app => (
                        <div key={app.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', borderLeft: `4px solid ${app.status === 'PENDING' ? '#facc15' : app.status === 'CONFIRMED' ? '#4ade80' : '#ef4444'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Mascota: {app.pet.name} ({app.pet.species})</strong>
                              <div style={{ fontSize: '13px', color: 'var(--text-color)' }}><strong>Dueño:</strong> {app.owner.name} {app.owner.surname}</div>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><i className='bx bx-time'></i> {new Date(app.date).toLocaleString()}</div>
                              {app.reason && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px' }}><strong>Motivo:</strong> {app.reason}</div>}
                              {app.notes && <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '5px' }}><strong>Tus notas:</strong> {app.notes}</div>}
                            </div>
                            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', background: app.status === 'PENDING' ? 'rgba(234, 179, 8, 0.2)' : app.status === 'CONFIRMED' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: app.status === 'PENDING' ? '#facc15' : app.status === 'CONFIRMED' ? '#4ade80' : '#ef4444' }}>
                              {app.status === 'PENDING' ? 'Pendiente' : app.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
                            </span>
                          </div>
                          
                          {app.status === 'PENDING' && (
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                              <button onClick={async () => {
                                const notes = prompt('¿Alguna indicación para la cita? (Ej: Traer ayuno)');
                                await fetch('/api/appointments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appointmentId: app.id, status: 'CONFIRMED', notes: notes || '' }) });
                                fetchAppointments();
                              }} style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', border: '1px solid #4ade80', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                Confirmar Turno
                              </button>
                              <button onClick={async () => {
                                const notes = prompt('Motivo del rechazo/cancelación:');
                                await fetch('/api/appointments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appointmentId: app.id, status: 'CANCELLED', notes: notes || '' }) });
                                fetchAppointments();
                              }} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              


                  {selectedPet && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                      
                      {/* 1. PERFIL FIJO DEL ANIMAL */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', marginBottom: '20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h5 style={{ margin: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className='bx bxs-id-card'></i> Perfil Fijo del Paciente
                          </h5>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {user.role === 'VET' && (
                              <select 
                                value={selectedPet.healthStatus} 
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  await fetch('/api/vet/pets/status', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ petId: selectedPet.id, healthStatus: newStatus })
                                  });
                                  const updatedPet = { ...selectedPet, healthStatus: newStatus };
                                  setSelectedPet(updatedPet);
                                  // Find and update in appropriate list
                                  if (vetTab === 'patients') {
                                    setMyPatients(myPatients.map(p => p.id === selectedPet.id ? updatedPet : p));
                                  } else {
                                    setSearchedUser({...searchedUser, pets: searchedUser.pets.map(p => p.id === selectedPet.id ? updatedPet : p)});
                                  }
                                }}
                                style={{ background: selectedPet.healthStatus === 'SALUDABLE' ? 'rgba(74, 222, 128, 0.2)' : selectedPet.healthStatus === 'EN_TRATAMIENTO' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: selectedPet.healthStatus === 'SALUDABLE' ? '#4ade80' : selectedPet.healthStatus === 'EN_TRATAMIENTO' ? '#facc15' : '#ef4444', border: '1px solid currentColor', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                <option value="SALUDABLE" style={{ color: 'black' }}>🟢 Saludable</option>
                                <option value="EN_TRATAMIENTO" style={{ color: 'black' }}>🟡 En Tratamiento</option>
                                <option value="CRITICO" style={{ color: 'black' }}>🔴 Crítico</option>
                              </select>
                            )}
                            {user.role !== 'VET' && (
                              <span style={{ background: selectedPet.healthStatus === 'SALUDABLE' ? 'rgba(74, 222, 128, 0.2)' : selectedPet.healthStatus === 'EN_TRATAMIENTO' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: selectedPet.healthStatus === 'SALUDABLE' ? '#4ade80' : selectedPet.healthStatus === 'EN_TRATAMIENTO' ? '#facc15' : '#ef4444', border: '1px solid currentColor', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>
                                {selectedPet.healthStatus === 'SALUDABLE' ? '🟢 Saludable' : selectedPet.healthStatus === 'EN_TRATAMIENTO' ? '🟡 En Tratamiento' : '🔴 Crítico'}
                              </span>
                            )}
                            {user.role !== 'VET' && (
                              <button onClick={() => handleEditClick(selectedPet)} style={{ background: 'none', border: '1px solid #3b82f6', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className='bx bx-edit-alt'></i> Editar
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '14px' }}><strong>Nombre:</strong> {selectedPet.name}</div>
                            <div style={{ fontSize: '14px' }}>
                              <strong>Raza:</strong> {selectedPet.breed || '-'}
                              <div style={{ marginTop: '4px' }}>{renderValidationBadge(selectedPet, 'breedValidated', 'Raza')}</div>
                              {!selectedPet.breedValidated && user.role === 'VET' && <button onClick={() => handleValidatePetField(selectedPet.id, 'breedValidated')} style={{ background:'none', border:'1px solid #4ade80', color:'#4ade80', cursor:'pointer', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', width: 'fit-content', marginTop: '5px' }}><i className='bx bx-check-circle'></i> Validar</button>}
                            </div>
                            <div style={{ fontSize: '14px' }}><strong>Sexo:</strong> {selectedPet.sex || '-'}</div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '14px' }}>
                              <strong>Nacimiento / Edad:</strong> {selectedPet.birthDate ? new Date(selectedPet.birthDate).toLocaleDateString() : '-'}
                              <div style={{ marginTop: '4px' }}>{renderValidationBadge(selectedPet, 'birthDateValidated', 'Nacimiento')}</div>
                              {!selectedPet.birthDateValidated && user.role === 'VET' && <button onClick={() => handleValidatePetField(selectedPet.id, 'birthDateValidated')} style={{ background:'none', border:'1px solid #4ade80', color:'#4ade80', cursor:'pointer', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', width: 'fit-content', marginTop: '5px' }}><i className='bx bx-check-circle'></i> Validar</button>}
                            </div>
                            <div style={{ fontSize: '14px' }}>
                              <strong>Microchip:</strong> {selectedPet.microchip || 'No declarado'}
                              <div style={{ marginTop: '4px' }}>{renderValidationBadge(selectedPet, 'microchipValidated', 'Microchip')}</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                          <div style={{ fontSize: '14px' }}>
                            <strong style={{ color: '#ef4444' }}>⚠️ Alergias Importantes:</strong> {selectedPet.knownAllergies || 'Ninguna declarada'}
                            <span style={{ marginLeft: '10px' }}>{renderValidationBadge(selectedPet, 'allergiesValidated', 'Alergias')}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. RESUMEN CLÍNICO AUTOMÁTICO */}
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', marginBottom: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                        <h6 style={{ margin: '0 0 10px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className='bx bx-brain'></i> Resumen Clínico Automático
                        </h6>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
                          {selectedPet.medicalRecords?.length > 0 ? (() => {
                            // Find the latest valid record
                            const sorted = [...selectedPet.medicalRecords].sort((a,b) => new Date(b.date) - new Date(a.date));
                            const latest = sorted[0];
                            // Find last known weight across all records
                            const lastWeightRec = sorted.find(r => r.realWeight);
                            return (
                              <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <span><strong>Último diagnóstico:</strong> {latest.confirmedDiagnosis || '-'}</span>
                                  <span><strong>Última consulta:</strong> {getRelativeTime(latest.date)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <span><strong>Estado actual:</strong> {latest.generalStatus || '-'}</span>
                                  <span><strong>Último peso registrado:</strong> {lastWeightRec ? `${lastWeightRec.realWeight} kg` : '-'}</span>
                                </div>
                              </>
                            );
                          })() : (
                            <p style={{ color: 'var(--text-muted)', margin: 0, gridColumn: 'span 2' }}>Aún no hay registros clínicos generados por un profesional.</p>
                          )}
                        </div>
                      </div>

                      <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><i className='bx bx-shield-plus' style={{ color: '#4ade80' }}></i> Evaluación Clínica Profesional</span>
                        {templates.length > 0 && (
                          <select 
                            onChange={(e) => {
                              const t = templates.find(temp => temp.id === parseInt(e.target.value));
                              if (t) {
                                setRecordData({
                                  ...recordData,
                                  presumptiveDiagnosis: t.presumptiveDiagnosis || '',
                                  confirmedDiagnosis: t.confirmedDiagnosis || '',
                                  medicationDetails: t.medicationDetails || '',
                                  professionalIndications: t.professionalIndications || ''
                                });
                              }
                            }}
                            style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}
                          >
                            <option value="">Cargar Plantilla...</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                          </select>
                        )}
                      </h5>
                      
                      <form onSubmit={submitMedicalRecord} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white' }} placeholder="Temperatura (°C)" value={recordData.temperature} onChange={e => setRecordData({...recordData, temperature: e.target.value})} />
                          <input className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white' }} placeholder="Peso REAL (kg)" value={recordData.realWeight} onChange={e => setRecordData({...recordData, realWeight: e.target.value})} />
                          <input className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white' }} placeholder="Frecuencia Cardíaca" value={recordData.heartRate} onChange={e => setRecordData({...recordData, heartRate: e.target.value})} />
                          <input className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white' }} placeholder="Frecuencia Respiratoria" value={recordData.respiratoryRate} onChange={e => setRecordData({...recordData, respiratoryRate: e.target.value})} />
                        </div>
                        
                        <textarea className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white', minHeight: '60px', resize: 'none' }} placeholder="Examen Físico Completo" value={recordData.physicalExam} onChange={e => setRecordData({...recordData, physicalExam: e.target.value})} />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white' }} placeholder="Diagnóstico Presuntivo" value={recordData.presumptiveDiagnosis} onChange={e => setRecordData({...recordData, presumptiveDiagnosis: e.target.value})} />
                          <input className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white', borderLeft: '3px solid #4ade80' }} placeholder="Diagnóstico Confirmado" required value={recordData.confirmedDiagnosis} onChange={e => setRecordData({...recordData, confirmedDiagnosis: e.target.value})} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <textarea className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white', minHeight: '60px', resize: 'none' }} placeholder="Medicación (Dosis Exacta)" value={recordData.medicationDetails} onChange={e => setRecordData({...recordData, medicationDetails: e.target.value})} />
                          <textarea className="submit-btn" style={{ background: 'var(--input-bg)', textAlign: 'left', border: '1px solid var(--border-color)', color: 'white', minHeight: '60px', resize: 'none' }} placeholder="Indicaciones (Reposo, Dieta, etc.)" value={recordData.professionalIndications} onChange={e => setRecordData({...recordData, professionalIndications: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px' }}>
                          <i className='bx bx-check-shield' style={{ color: '#4ade80', fontSize: '24px' }}></i>
                          <div style={{ fontSize: '12px' }}>
                            <strong style={{ color: '#4ade80' }}>Firma Digital</strong>
                            <p>Al guardar esta ficha, la información quedará sellada bajo tu matrícula profesional ({user.licenseNumber}).</p>
                          </div>
                        </div>

                        <button type="submit" disabled={isSubmittingRecord} className="submit-btn" style={{ padding: '10px', background: isSubmittingRecord ? '#64748b' : 'linear-gradient(135deg, #10b981, #059669)', cursor: isSubmittingRecord ? 'not-allowed' : 'pointer', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px' }}>
                          {isSubmittingRecord ? 'Guardando...' : '🩺 Guardar y Firmar Ficha Clínica'}
                        </button>
                      </form>

                      <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <h5><i className='bx bx-history'></i> Historial Clínico Unificado</h5>
                        {renderUnifiedTimeline(selectedPet)}
                      </div>
                    </div>
                  )}

            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <button onClick={() => { setOwnerTab('pets'); setSelectedPet(null); }} style={{ background: ownerTab === 'pets' ? 'rgba(59, 130, 246, 0.2)' : 'none', color: ownerTab === 'pets' ? '#3b82f6' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <i className='bx bxs-dog'></i> Mis Mascotas
                </button>
                <button onClick={() => { setOwnerTab('appointments'); setSelectedPet(null); }} style={{ background: ownerTab === 'appointments' ? 'rgba(236, 72, 153, 0.2)' : 'none', color: ownerTab === 'appointments' ? '#ec4899' : 'var(--text-muted)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <i className='bx bx-calendar'></i> Mis Turnos
                </button>
              </div>

              {ownerTab === 'pets' && (
                <div>
                  <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span>Mis Mascotas</span>
                    {user.phone ? (
                      <button onClick={() => setShowAddPet(!showAddPet)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}>+ Agregar</button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                        ⚠️ Agrega tu teléfono en el perfil para registrar mascotas
                      </span>
                    )}
                  </div>

                  {showAddPet && (
                    <form onSubmit={handleAddPet} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
                      <h6 style={{ color: 'var(--primary-color)' }}>Datos Básicos</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input required placeholder="Nombre" value={petData.name} onChange={e => setPetData({...petData, name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input required placeholder="Especie (Ej. Perro)" value={petData.species} onChange={e => setPetData({...petData, species: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input placeholder="Raza" value={petData.breed} onChange={e => setPetData({...petData, breed: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input type="date" placeholder="Fecha de Nacimiento" value={petData.birthDate} onChange={e => setPetData({...petData, birthDate: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                      </div>

                      <h6 style={{ color: 'var(--primary-color)', marginTop: '10px' }}>Historial Declarado</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input placeholder="Enfermedades pasadas" value={petData.pastDiseases} onChange={e => setPetData({...petData, pastDiseases: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input placeholder="Alergias conocidas" value={petData.knownAllergies} onChange={e => setPetData({...petData, knownAllergies: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input placeholder="Medicación actual" value={petData.currentMedication} onChange={e => setPetData({...petData, currentMedication: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input placeholder="Alimentación" value={petData.diet} onChange={e => setPetData({...petData, diet: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                      </div>

                      <button type="submit" className="submit-btn" style={{ padding: '10px', marginTop: '10px' }}>Guardar Mascota</button>
                    </form>
                  )}

              {user.pets && user.pets.length > 0 ? (
                <div className="pet-list">
                  {user.pets.map(pet => (
                    <div key={pet.id} className="pet-item" onClick={() => setSelectedPet(selectedPet?.id === pet.id ? null : pet)}>
                      <div>
                        <strong>{pet.name}</strong>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: pet.breedValidated ? 'rgba(74, 222, 128, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: pet.breedValidated ? '#4ade80' : '#facc15' }}>
                            {pet.breedValidated ? '🟢 Raza Validada' : '🟡 Raza Sin Validar'}
                          </span>
                        </div>
                      </div>
                      <i className={selectedPet?.id === pet.id ? 'bx bx-chevron-down' : 'bx bx-chevron-right'} style={{ fontSize: '24px' }}></i>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Aún no tienes mascotas registradas.</p>
              )}

              {selectedPet && user.role !== 'VET' && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  
                  {/* Seguridad Clínica: Generar PIN temporal */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '15px', marginBottom: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                    <h6 style={{ margin: '0 0 10px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className='bx bx-lock-alt'></i> Compartir Ficha con Veterinario
                    </h6>
                    <p style={{ fontSize: '13px', color: 'var(--text-color)', marginBottom: '10px' }}>
                      Genera un código temporal (válido por 10 minutos) para que tu veterinario pueda acceder a la ficha de {selectedPet.name} e incorporar nuevas historias clínicas.
                    </p>
                    <button onClick={() => generatePin(selectedPet.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Generar PIN de 6 Dígitos
                    </button>
                    {generatedPin && (
                      <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', letterSpacing: '5px', fontWeight: 'bold', color: '#4ade80' }}>
                          {generatedPin.pin}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                          Válido hasta: {new Date(generatedPin.expiresAt).toLocaleTimeString()}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <h6 style={{ color: 'black', marginBottom: '10px' }}>Código QR de la Mascota</h6>
                      <QRCodeSVG value={`${window.location.origin}/public/pet/${selectedPet.id}`} size={150} />
                      <p style={{ color: '#666', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>Cualquiera puede escanear este código para ver los datos de emergencia de la mascota.</p>
                    </div>
                  </div>

                  {/* Historial de Accesos (Auditoría) */}
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '15px', marginBottom: '20px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                    <h6 style={{ margin: '0 0 10px 0', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className='bx bx-history'></i> Últimos Accesos Veterinarios
                    </h6>
                    {accessHistory.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No hay accesos registrados recientemente.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                        {accessHistory.map(log => (
                          <li key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'var(--text-color)' }}><i className='bx bx-user-circle'></i> {log.vetName}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Form to submit an Owner Report */}
                  <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '15px', marginBottom: '20px', borderRadius: '8px', borderLeft: '4px solid #eab308' }}>
                    <h6 style={{ margin: '0 0 10px 0', color: '#facc15', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className='bx bx-error-circle'></i> Reportar Urgencia o Síntoma
                    </h6>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch('/api/pets/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          petId: selectedPet.id,
                          symptoms: petData.currentSymptoms || '',
                          symptomsSince: petData.symptomsSince || '',
                          behaviorChanges: petData.behaviorChanges || ''
                        })
                      });
                      toast.success('Reporte enviado al historial clínico.');
                      window.location.reload();
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <textarea required placeholder="¿Qué síntomas presenta?" value={petData.currentSymptoms} onChange={e => setPetData({...petData, currentSymptoms: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white', resize: 'none' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input placeholder="¿Desde cuándo?" value={petData.symptomsSince} onChange={e => setPetData({...petData, symptomsSince: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                        <input placeholder="¿Cambios en su comportamiento?" value={petData.behaviorChanges} onChange={e => setPetData({...petData, behaviorChanges: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                      </div>
                      <button type="submit" className="submit-btn" style={{ background: '#eab308', color: 'black', padding: '10px', fontWeight: 'bold' }}>Guardar Reporte en el Historial</button>
                    </form>
                  </div>

                  <h5>Historial Médico Unificado de {selectedPet.name}</h5>
                  {renderUnifiedTimeline(selectedPet)}
                  
                  {/* GPS Tracker Simulation */}
                  <div style={{ marginTop: '20px' }}>
                    <h5 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className='bx bx-current-location' style={{ color: '#3b82f6' }}></i> GPS del Collar
                    </h5>
                    <PetGPSMap petName={selectedPet.name} />
                  </div>
                </div>
              )}
              </div>
            )}
              {ownerTab === 'appointments' && (
                <div>
                  <h5 style={{ color: '#ec4899', marginBottom: '15px' }}><i className='bx bx-calendar-plus'></i> Solicitar Nuevo Turno</h5>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      <select value={appointmentForm.petId} onChange={e => setAppointmentForm({...appointmentForm, petId: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }}>
                        <option value="">Selecciona tu mascota...</option>
                        {user.pets?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      
                      <select 
                        value={appointmentForm.vetId} 
                        onChange={e => setAppointmentForm({...appointmentForm, vetId: e.target.value})} 
                        style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }}
                        disabled={!appointmentForm.petId}
                      >
                        <option value="">{appointmentForm.petId ? 'Selecciona un veterinario de cabecera...' : 'Primero selecciona una mascota...'}</option>
                        {linkedVets.map(v => <option key={v.id} value={v.id}>Dr. {v.name} {v.surname} (MP: {v.licenseNumber || '-'})</option>)}
                      </select>
                      
                      {appointmentForm.petId && linkedVets.length === 0 && (
                        <div style={{ fontSize: '12px', color: '#facc15', background: 'rgba(234, 179, 8, 0.1)', padding: '10px', borderRadius: '8px' }}>
                          ⚠️ Esta mascota no tiene veterinarios vinculados. El veterinario debe escanear el QR y agregarla a sus pacientes primero.
                        </div>
                      )}

                      <input type="datetime-local" value={appointmentForm.date} onChange={e => setAppointmentForm({...appointmentForm, date: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                      <input placeholder="Motivo del turno (Ej. Vacunación, Dolor de estómago)" value={appointmentForm.reason} onChange={e => setAppointmentForm({...appointmentForm, reason: e.target.value})} style={{ padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'white' }} />
                      <button onClick={async () => {
                        if (!appointmentForm.petId || !appointmentForm.vetId || !appointmentForm.date) return toast.error('Completa los campos obligatorios');
                        const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appointmentForm) });
                        if (res.ok) {
                          toast.success('Turno solicitado. El veterinario deberá confirmarlo.');
                          setAppointmentForm({ vetId: '', petId: '', date: '', reason: '' });
                          fetchAppointments();
                        }
                      }} className="submit-btn" style={{ background: '#ec4899' }}>Solicitar Turno</button>
                    </div>
                  </div>

                  <h5 style={{ color: '#ec4899', marginBottom: '15px' }}><i className='bx bx-history'></i> Mi Historial de Turnos</h5>
                  {appointments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No tienes turnos agendados.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {appointments.map(app => (
                        <div key={app.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', borderLeft: `4px solid ${app.status === 'PENDING' ? '#facc15' : app.status === 'CONFIRMED' ? '#4ade80' : '#ef4444'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: 'white', display: 'block', marginBottom: '5px' }}>{app.pet.name} con Dr/a. {app.vet.surname}</strong>
                              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><i className='bx bx-time'></i> {new Date(app.date).toLocaleString()}</div>
                              {app.reason && <div style={{ fontSize: '13px', color: 'var(--text-color)', marginTop: '5px' }}><strong>Motivo:</strong> {app.reason}</div>}
                              {app.notes && <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '5px' }}><strong>Notas del Vet:</strong> {app.notes}</div>}
                            </div>
                            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', background: app.status === 'PENDING' ? 'rgba(234, 179, 8, 0.2)' : app.status === 'CONFIRMED' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: app.status === 'PENDING' ? '#facc15' : app.status === 'CONFIRMED' ? '#4ade80' : '#ef4444' }}>
                              {app.status === 'PENDING' ? 'Pendiente' : app.status === 'CONFIRMED' ? 'Confirmado' : 'Rechazado/Cancelado'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {user.role !== 'VET' && (
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => alert("🚨 MODO EMERGENCIA ACTIVADO: Se notificaría a las veterinarias de la zona (Función real en desarrollo). \n\nPor favor, dirígete a la clínica más cercana en el mapa a continuación y llama por teléfono inmediatamente.")} style={{ background: '#ef4444', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}>
              <i className='bx bxs-ambulance' style={{ fontSize: '24px' }}></i>
              MI MASCOTA ESTÁ EN EMERGENCIA
            </button>
            
            <div className="card-title" style={{ marginBottom: '15px' }}><i className='bx bx-map'></i> Veterinarias Cercanas (Abiertas 24hs)</div>
            <div className="map-container" style={{ flex: 1, minHeight: '300px' }}>
              <Map />
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
