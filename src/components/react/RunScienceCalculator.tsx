import { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Fórmulas de dominio público:
// - FC máx estimada: 220 - edad (Haskell & Fox)
// - Zonas de FC: método Karvonen, FC objetivo = FCR * % + FC reposo, con FCR = FC máx - FC reposo
// - Predicción de tiempos: fórmula de Riegel, T2 = T1 * (D2 / D1) ^ 1.06

const RIEGEL = 1.06;

const DISTANCIAS = [
  { label: '10K', km: 10 },
  { label: '15K', km: 15 },
  { label: '10 mi', km: 16.0934 },
  { label: '21K', km: 21.0975 },
  { label: '30K', km: 30 },
  { label: '42K', km: 42.195 },
];

function formatPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '--:--';
  const total = Math.round(secPerKm);
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatTime(totalSec: number): string {
  const t = Math.round(totalSec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = (t % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`;
}

type Punto = { label: string; km: number; tiempo: number; ritmo: number };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Punto }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-zinc-900">
      <p className="font-semibold text-zinc-900 dark:text-white">{p.label}</p>
      <p className="text-zinc-600 dark:text-zinc-300">Tiempo: {formatTime(p.tiempo)}</p>
      <p className="text-zinc-600 dark:text-zinc-300">Ritmo: {formatPace(p.ritmo)} min/km</p>
    </div>
  );
}

// Aparición suave al montar (@starting-style) + transiciones por defecto de Tailwind
const enter = 'transition-all duration-500 ease-out starting:opacity-0 starting:translate-y-2';
const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-zinc-900 transition-colors duration-200 focus:border-green-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';
const labelClass = 'mb-1 block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-300';
const cardClass = `${enter} rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900`;
const tileClass =
  'rounded-lg bg-white p-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-950';

export function RunScienceCalculator() {
  const [edad, setEdad] = useState(35);
  const [fcReposo, setFcReposo] = useState(60);
  const [min5k, setMin5k] = useState(25);
  const [seg5k, setSeg5k] = useState(0);

  const fc = useMemo(() => {
    const fcMax = 220 - edad;
    const valido = edad >= 10 && edad <= 90 && fcReposo >= 30 && fcReposo < fcMax;
    if (!valido) return null;
    const fcr = fcMax - fcReposo;
    const at = (p: number) => Math.round(fcr * p + fcReposo);
    return {
      fcMax,
      base: [at(0.6), at(0.75)],
      tempo: [at(0.76), at(0.85)],
      umbral: at(0.86),
    };
  }, [edad, fcReposo]);

  const ritmos = useMemo(() => {
    const t5k = min5k * 60 + seg5k;
    if (!(t5k >= 12 * 60 && t5k <= 60 * 60)) return null;
    const pace5k = t5k / 5;
    const predecir = (km: number) => t5k * Math.pow(km / 5, RIEGEL);
    const predicciones: Punto[] = DISTANCIAS.map((d) => {
      const tiempo = predecir(d.km);
      return { ...d, tiempo, ritmo: tiempo / d.km };
    });
    return {
      suave: [pace5k + 60, pace5k + 90],
      tempo: predecir(21.0975) / 21.0975,
      series: pace5k,
      predicciones,
      grafica: [{ label: '5K', km: 5, tiempo: t5k, ritmo: pace5k }, ...predicciones],
    };
  }, [min5k, seg5k]);

  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(e.target.value === '' ? 0 : Number(e.target.value));

  return (
    <div className={`${enter} mx-auto max-w-4xl rounded-2xl border border-green-500/30 bg-white p-6 text-zinc-900 shadow-2xl dark:bg-black dark:text-white`}>
      <div className="mb-6 text-center">
        <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-green-500">
          <span aria-hidden="true">⚡</span> Zonas & Desempeño
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Descubre tus zonas de pulso, ritmos de entrenamiento y tiempos estimados a partir de tu último 5K.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="edad" className={labelClass}>Edad (años)</label>
          <input id="edad" type="number" min={10} max={90} value={edad || ''} onChange={num(setEdad)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="fcReposo" className={labelClass}>FC en reposo (ppm)</label>
          <input id="fcReposo" type="number" min={30} max={100} placeholder="Ej: 60" value={fcReposo || ''} onChange={num(setFcReposo)} className={inputClass} />
        </div>
        <div>
          <span className={labelClass}>Último 5K (min : seg)</span>
          <div className="flex items-center gap-1">
            <input aria-label="Minutos del 5K" type="number" min={12} max={60} placeholder="25" value={min5k || ''} onChange={num(setMin5k)} className={inputClass} />
            <span className="text-zinc-400">:</span>
            <input aria-label="Segundos del 5K" type="number" min={0} max={59} placeholder="00" value={seg5k || ''} onChange={num(setSeg5k)} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Predicciones de carrera */}
        <div className={cardClass}>
          <h3 className="mb-1 text-lg font-bold text-green-500">🏁 Predicción de tiempos de carrera</h3>
          {ritmos ? (
            <>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                Estimados con la fórmula de Riegel a partir de tu 5K. Suponen entrenamiento específico para cada distancia.
              </p>
              <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-3">
                {ritmos.predicciones.map((p) => (
                  <div key={p.label} className={`${tileClass} border-t-4 border-green-500 p-4`}>
                    <span className="block text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{p.label}</span>
                    <span className="block text-3xl font-black tabular-nums tracking-tight sm:text-4xl">{formatTime(p.tiempo)}</span>
                    <span className="mt-1 block text-sm tabular-nums text-zinc-500 dark:text-zinc-400">{formatPace(p.ritmo)} min/km</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">Ritmo estimado por distancia (min/km)</h4>
                <div className="h-64 text-zinc-400 dark:text-zinc-500">
                  <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 256 }}>
                    <LineChart data={ritmos.grafica} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="currentColor" strokeOpacity={0.25} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: 'currentColor', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="ritmo"
                        domain={['dataMin - 10', 'dataMax + 10']}
                        tickFormatter={(v: number) => formatPace(v)}
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.4 }} />
                      <Line
                        type="monotone"
                        dataKey="ritmo"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ingresa un tiempo de 5K entre 12 y 60 minutos.</p>
          )}
        </div>

        {/* Zonas de frecuencia cardíaca */}
        <div className={cardClass}>
          <h3 className="mb-1 text-sm font-semibold text-green-500">📊 Tus zonas de frecuencia cardíaca (Karvonen)</h3>
          {fc ? (
            <>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">FC máxima estimada: {fc.fcMax} ppm</p>
              <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                <div className={`${tileClass} border-l-4 border-blue-400`}>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Zona 1-2 · Base / Suave</span>
                  <span className="text-lg font-bold">{fc.base[0]} – {fc.base[1]} ppm</span>
                  <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">Puedes mantener una conversación fluida.</span>
                </div>
                <div className={`${tileClass} border-l-4 border-green-500`}>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Zona 3 · Tempo / Control</span>
                  <span className="text-lg font-bold">{fc.tempo[0]} – {fc.tempo[1]} ppm</span>
                  <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">Solo frases cortas. Esfuerzo moderado y constante.</span>
                </div>
                <div className={`${tileClass} border-l-4 border-red-500`}>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">Zona 4-5 · Umbral / Series</span>
                  <span className="text-lg font-bold">{fc.umbral}+ ppm</span>
                  <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">Casi no puedes hablar. Exigencia alta para ganar velocidad.</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ingresa una edad entre 10 y 90 años y una FC en reposo válida (30 ppm o más).</p>
          )}
        </div>

        {/* Ritmos de entrenamiento */}
        {ritmos && (
          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-semibold text-green-500">⏱️ Ritmos sugeridos de entrenamiento (min/km)</h3>
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              <div className={tileClass}>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Rodaje suave / Regenerativo</span>
                <span className="text-xl font-bold tabular-nums text-blue-500">{formatPace(ritmos.suave[0])} – {formatPace(ritmos.suave[1])}</span>
                <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">Ritmo conversacional: hablas sin ahogarte.</span>
              </div>
              <div className={tileClass}>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Ritmo de carrera / Umbral</span>
                <span className="text-xl font-bold tabular-nums text-green-500">{formatPace(ritmos.tempo)}</span>
                <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">"Cómodamente duro": sostenible 20-40 min.</span>
              </div>
              <div className={tileClass}>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Intervalos / Potencia</span>
                <span className="text-xl font-bold tabular-nums text-red-500">{formatPace(ritmos.series)}</span>
                <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">Series cortas (400 m – 1 km) con recuperación.</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-zinc-400">
          Estimaciones orientativas basadas en fórmulas públicas (Karvonen, Riegel). Consulta a un profesional de la salud antes de iniciar un plan exigente.
        </p>
      </div>
    </div>
  );
}
