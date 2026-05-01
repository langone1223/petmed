import re

with open('src/app/dashboard/DashboardClient.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import toast
content = content.replace("import { QRCodeSVG } from 'qrcode.react';", "import { QRCodeSVG } from 'qrcode.react';\nimport toast, { Toaster } from 'react-hot-toast';")

# 2. Add Toaster
content = content.replace("export default function DashboardClient({ user }) {", "export default function DashboardClient({ user }) {\n  const ToasterComponent = <Toaster position='top-right' />;")
content = content.replace("<div className=\"dashboard-container\">", "{ToasterComponent}\n    <div className=\"dashboard-container\">")

# 3. Replace alert() with toast()
content = content.replace("alert('Ficha Médica Clínica guardada exitosamente con firma digital.');", "toast.success('Ficha Médica Clínica guardada exitosamente con firma digital.');")
content = content.replace("alert('Turno solicitado. El veterinario deberá confirmarlo.');", "toast.success('Turno solicitado. El veterinario deberá confirmarlo.');")
content = content.replace("alert('Plantilla guardada');", "toast.success('Plantilla guardada');")
content = content.replace("return alert('Completa los campos obligatorios');", "return toast.error('Completa los campos obligatorios');")
content = content.replace("alert('Reporte enviado al historial clínico.');", "toast.success('Reporte enviado al historial clínico.');")
content = content.replace("alert(\"🚨 MODO EMERGENCIA ACTIVADO: Se notificaría a las clínicas más cercanas.\");", "toast.error(\"🚨 MODO EMERGENCIA ACTIVADO: Se notificaría a las clínicas más cercanas.\");")

# 4. Modify link-patient fetch
old_link = """await fetch('/api/vet/link-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ petId: pet.id }) });
                            alert('Paciente guardado en tu lista de Mis Pacientes Atendidos.');"""
new_link = """const pin = prompt('Ingrese el PIN de acceso de 6 dígitos provisto por el dueño:');
                            if (!pin) return;
                            const res = await fetch('/api/vet/link-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ petId: pet.id, pin }) });
                            if (res.ok) {
                              toast.success('Paciente guardado en tu lista de Mis Pacientes Atendidos.');
                            } else {
                              const err = await res.json();
                              toast.error(err.message || 'Error al validar el PIN');
                              return;
                            }"""
content = content.replace(old_link, new_link)

with open('src/app/dashboard/DashboardClient.js', 'w', encoding='utf-8') as f:
    f.write(content)
