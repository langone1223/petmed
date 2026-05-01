'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Icons
const iconDog = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616430.png', // Dog paw icon
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const iconBase = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 16);
  return null;
}

export default function PetGPSMap({ petName }) {
  const [basePosition, setBasePosition] = useState(null);
  const [petPath, setPetPath] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [isSimulationMode, setIsSimulationMode] = useState(false); // Toggle state

  // Generate a realistic random path based on a starting point
  const generatePath = (lat, lng, steps = 10) => {
    let currentLat = lat;
    let currentLng = lng;
    const path = [[currentLat, currentLng]];
    
    for (let i = 0; i < steps; i++) {
      // Move dog randomly within ~10-20 meters
      currentLat += (Math.random() - 0.5) * 0.0005;
      currentLng += (Math.random() - 0.5) * 0.0005;
      path.push([currentLat, currentLng]);
    }
    return path;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setBasePosition([lat, lng]);
        
        // Generate path
        const path = generatePath(lat, lng, 8);
        setPetPath(path);
        
        setLastUpdate('Hace un momento');
      },
      (err) => {
        console.error("GPS error:", err);
        // Fallback
        const lat = -34.6037;
        const lng = -58.3816;
        setBasePosition([lat, lng]);
        setPetPath(generatePath(lat, lng, 8));
        setLastUpdate('Hace un momento');
      }
    );
  }, []);

  // Simulation mode effect
  useEffect(() => {
    let interval;
    if (isSimulationMode && basePosition && petPath.length > 0) {
      interval = setInterval(() => {
        setPetPath(prevPath => {
          const lastPos = prevPath[prevPath.length - 1];
          const newPos = [
            lastPos[0] + (Math.random() - 0.5) * 0.0002,
            lastPos[1] + (Math.random() - 0.5) * 0.0002
          ];
          const newPath = [...prevPath, newPos];
          if (newPath.length > 15) newPath.shift(); // Keep path length manageable
          return newPath;
        });
        setLastUpdate('Ahora (Simulación en vivo)');
        setIsConnected(Math.random() > 0.1); // 10% chance to drop connection
      }, 3000); // Move every 3 seconds
    }
    
    return () => clearInterval(interval);
  }, [isSimulationMode, basePosition]);

  if (!basePosition) {
    return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bx-loader-alt bx-spin'></i> Conectando al collar...</div>;
  }

  const currentPetPos = petPath[petPath.length - 1];

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* HUD overlay */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', color: 'white', fontSize: '12px', backdropFilter: 'blur(5px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: isConnected ? '#4ade80' : '#ef4444' }}></span>
          <strong>Señal GPS:</strong> {isConnected ? 'Fuerte' : 'Desconectado'}
        </div>
        <div><strong>Última actualización:</strong> {lastUpdate}</div>
        
        {/* Toggle Switch */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <input type="checkbox" className="sr-only" style={{ opacity: 0, width: 0, height: 0 }} checked={isSimulationMode} onChange={() => setIsSimulationMode(!isSimulationMode)} />
              <div style={{ width: '36px', height: '20px', background: isSimulationMode ? '#3b82f6' : '#4b5563', borderRadius: '20px', transition: 'background-color 0.2s' }}></div>
              <div style={{ position: 'absolute', top: '2px', left: isSimulationMode ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }}></div>
            </div>
            <span style={{ marginLeft: '8px', fontSize: '11px', color: isSimulationMode ? '#60a5fa' : 'white' }}>Modo Simulación VIVO</span>
          </label>
        </div>
      </div>

      <MapContainer center={currentPetPos} zoom={16} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={currentPetPos} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Owner Position */}
        <Marker position={basePosition} icon={iconBase}>
          <Popup>Tu celular</Popup>
        </Marker>

        {/* Pet Position */}
        {isConnected && (
          <Marker position={currentPetPos} icon={iconDog}>
            <Popup>
              <strong>{petName}</strong><br/>
              Ubicación actual
            </Popup>
          </Marker>
        )}

        {/* Pet Trail */}
        <Polyline positions={petPath} color="gray" weight={3} dashArray="5, 10" opacity={0.6} />
      </MapContainer>
    </div>
  );
}
