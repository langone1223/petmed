'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix Leaflet's default icon path issues
const iconOpen = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iconClosed = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iconUser = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function Map() {
  const [position, setPosition] = useState(null);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Solicitando ubicación...');

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatusMsg('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        fetchVets(lat, lng);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setStatusMsg('Permiso de ubicación denegado o error al obtener la ubicación.');
        // Fallback to Buenos Aires center if denied
        const fallbackLat = -34.6037;
        const fallbackLng = -58.3816;
        setPosition([fallbackLat, fallbackLng]);
        fetchVets(fallbackLat, fallbackLng);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    const fetchVets = async (lat, lng) => {
      setStatusMsg('Buscando veterinarias en un radio de 5km...');
      try {
        const res = await fetch(`/api/vets/map?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        
        const currentHour = new Date().getHours();
        
        const formattedVets = data.elements.map(el => {
          let isOpen = false;
          let statusText = "Cerrado ahora";
          
          if (el.tags?.opening_hours) {
            const hours = el.tags.opening_hours.toLowerCase();
            if (hours.includes('24/7')) {
              isOpen = true;
              statusText = "Abierto 24hs";
            } else {
              if (currentHour >= 9 && currentHour < 20) {
                isOpen = true;
                statusText = "Abierto (Horario Comercial)";
              }
            }
          } else {
            if (currentHour >= 9 && currentHour < 20) {
              isOpen = true;
              statusText = "Probablemente Abierto";
            } else {
              statusText = "Probablemente Cerrado";
            }
          }

          return {
            id: el.id,
            name: el.tags?.name || "Veterinaria sin nombre",
            lat: el.lat || el.center?.lat,
            lng: el.lon || el.center?.lon,
            phone: el.tags?.phone || null,
            isOpen,
            statusText
          };
        });

        setVets(formattedVets);
      } catch (err) {
        console.error("Error fetching map data:", err);
      } finally {
        setLoading(false);
      }
    };
  }, []);

  if (loading || !position) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '30px', marginBottom: '10px' }}></i>
        <p>{statusMsg}</p>
      </div>
    );
  }

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
      <ChangeView center={position} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Marker for User's actual location */}
      <Marker position={position} icon={iconUser}>
        <Popup>
          <strong>Tu ubicación actual</strong>
        </Popup>
      </Marker>

      {/* Markers for Vets */}
      {vets.map(vet => (
        <Marker key={vet.id} position={[vet.lat, vet.lng]} icon={vet.isOpen ? iconOpen : iconClosed}>
          <Popup>
            <div style={{ padding: '5px' }}>
              <strong style={{ fontSize: '14px' }}>{vet.name}</strong><br/>
              <span style={{ 
                color: vet.isOpen ? '#16a34a' : '#dc2626', 
                fontWeight: 'bold',
                display: 'inline-block',
                marginTop: '5px'
              }}>
                {vet.isOpen ? '🟢' : '🔴'} {vet.statusText}
              </span>
              {vet.phone && <div style={{ marginTop: '5px', fontSize: '12px' }}>📞 {vet.phone}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
