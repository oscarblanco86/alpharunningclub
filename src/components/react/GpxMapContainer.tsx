import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import 'leaflet/dist/leaflet.css';

// Ajusta el mapa a los límites de la ruta
function RecenterMap({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [positions, map]);
  return null;
}

// Controlador externo para mover el mapa al punto del hover suavemente
function PanToPoint({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.panTo(center, { animate: true, duration: 0.2 });
    }
  }, [center, map]);
  return null;
}

export function GpxMapContainer({ gpxUrl }) {
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [chartData, setChartData] = useState<{ distance: number; elevation: number }[]>([]);
  const [metrics, setMetrics] = useState({ distance: 0, elevationPos: 0 });
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  
  // ESTADO CLAVE: Guarda el índice del punto sobre el que el usuario está haciendo hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(gpxUrl)
      .then(res => {
        if (!res.ok) throw new Error(`No se encontró el archivo GPX.`);
        return res.text();
      })
      .then(xmlText => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");
        const trackPoints = xml.querySelectorAll("trkpt");
        
        if (trackPoints.length === 0) throw new Error("GPX sin puntos válidos.");

        const points: [number, number][] = [];
        const dataForChart: { distance: number; elevation: number }[] = [];
        let totalDistance = 0;
        let elevationGain = 0;
        let lastEle = null;

        const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371e3;
          const phi1 = (lat1 * Math.PI) / 180;
          const phi2 = (lat2 * Math.PI) / 180;
          const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
          const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
          const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        trackPoints.forEach((pt, index) => {
          const lat = parseFloat(pt.getAttribute("lat") || "0");
          const lon = parseFloat(pt.getAttribute("lon") || "0");
          points.push([lat, lon]);

          let currentEle = 0;
          const eleNode = pt.querySelector("ele");
          if (eleNode && eleNode.textContent) {
            currentEle = parseFloat(eleNode.textContent);
            if (lastEle !== null && currentEle > lastEle) {
              elevationGain += (currentEle - lastEle);
            }
            lastEle = currentEle;
          }

          if (index > 0) {
            const prevPt = trackPoints[index - 1];
            const prevLat = parseFloat(prevPt.getAttribute("lat") || "0");
            const prevLon = parseFloat(prevPt.getAttribute("lon") || "0");
            totalDistance += calcDist(prevLat, prevLon, lat, lon);
          }

          // Guardamos los datos para la gráfica reduciendo densidad para mejor rendimiento
          if (index % 2 === 0 || index === trackPoints.length - 1) {
            dataForChart.push({
              distance: parseFloat((totalDistance / 1000).toFixed(2)),
              elevation: Math.round(currentEle)
            });
          }
        });

        setCoordinates(points);
        setChartData(dataForChart);
        setMetrics({ distance: totalDistance / 1000, elevationPos: elevationGain });
        setLoading(false);
      })
      .catch(err => {
        setErrorLog(err.message);
        setLoading(false);
      });
  }, [gpxUrl]);

  if (errorLog) return <div className="text-red-500">Error: {errorLog}</div>;
  if (loading) return <div className="text-center text-zinc-400">Cargando telemetría...</div>;

  // Encontrar la coordenada exacta mapeando el índice de la gráfica al arreglo original
  const getHoveredCoordinate = () => {
    if (hoveredIndex === null || !coordinates.length) return null;
    // Mapeo proporcional por si reducimos densidad de la gráfica
    const targetIdx = Math.floor((hoveredIndex / chartData.length) * coordinates.length);
    return coordinates[Math.min(targetIdx, coordinates.length - 1)];
  };

  const currentHoveredPoint = getHoveredCoordinate();

  return (
    <div className="space-y-6">
      {/* Tarjetas de Datos Técnicos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-100 dark:bg-white/5 p-4 rounded-xl text-center">
          <span className="text-xs text-zinc-400 block uppercase tracking-wider font-bold">Distancia Total</span>
          <span className="text-2xl font-black text-black dark:text-white">{metrics.distance.toFixed(2)} KM</span>
        </div>
        <div className="bg-zinc-100 dark:bg-white/5 p-4 rounded-xl text-center">
          <span className="text-xs text-zinc-400 block uppercase tracking-wider font-bold">Ganancia Altura</span>
          <span className="text-2xl font-black text-green-500">+{metrics.elevationPos.toFixed(0)} m</span>
        </div>
      </div>

      {/* 1. El Mapa Contenedor */}
      <div className="h-[350px] rounded-xl overflow-hidden z-10 relative border border-zinc-200 dark:border-white/10">
        {coordinates.length > 0 && (
          <MapContainer center={coordinates[0]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
            />
            <Polyline positions={coordinates} color="#22c55e" weight={4} opacity={0.8} />
            <RecenterMap positions={coordinates} />
            
            {/* Si el usuario hace hover en la gráfica, pintamos el marcador de posición en el mapa */}
            {currentHoveredPoint && (
              <>
                <CircleMarker 
                  center={currentHoveredPoint} 
                  radius={8}
                  pathOptions={{ fillColor: '#22c55e', color: '#ffffff', weight: 2, fillOpacity: 1 }}
                />
                <PanToPoint center={currentHoveredPoint} />
              </>
            )}
          </MapContainer>
        )}
      </div>

      {/* 2. Gráfica de Planimetría (Altimetría) Interactiva */}
      <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-white/10">
        <h4 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Perfil de Altimetría</h4>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData}
              onMouseMove={(e) => {
                if (e && e.activeTooltipIndex !== undefined) {
                  setHoveredIndex(e.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <XAxis dataKey="distance" stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}k`} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}m`} />
              <Tooltip 
                contentStyle={{ background: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [`${value} msnm`, 'Altitud']}
                labelFormatter={(label) => `Progreso: ${label} KM`}
              />
              <defs>
                <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="elevation" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorEle)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}