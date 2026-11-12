export const IA_URL = 'https://proyectos-tic.ort.edu.ar/melascan/ia/analizar';
export const IA_API_KEY = 'dIiL_nAvDl79W4rxLVLjTVu2-CrPJLkC2ovKUFgvG_I';


const ESCALA = 10;
const MODERADO_DESDE = 30;

export type Triage = 'pendiente' | 'bajo' | 'moderado' | 'alto';
type Letra = 'A' | 'B' | 'C' | 'D' | 'E';
export type AbcdeTexts = Record<Letra, string>;

// Lo que devuelve la IA (POST /analizar)
interface IaResultado {
  riesgo_pct: number;
  umbral_alerta_pct: number;
  supera_umbral: boolean;
  imagen_con_contorno?: string;
  abcde: {
    evaluable: boolean;
    motivo?: string;
    A?: { cumple: boolean; asimetria: number };
    B?: { cumple: boolean; irregularidad: number; solidez: number };
    C?: { cumple: boolean; variabilidad_color: number };
    D?: { porcentaje_ancho_imagen: number; nota: string };
    E: string;
  };
}

// Lo que guardamos en cada análisis
export interface ResultadoGuardado {
  triage: Triage;
  riskPercentage: number;
  criteriaUsed: string[];
  abcdeTexts: AbcdeTexts;
  actions: string[];
  contornoDataUrl?: string;
}

const TRIAGE_INFO: Record<Exclude<Triage, 'pendiente'>, { pill: string; titulo: string; subtitulo: string }> = {
  bajo: {
    pill: 'RIESGO BAJO',
    titulo: 'Lesión de bajo riesgo',
    subtitulo: 'Riesgo bajo. Mantener controles dermatológicos rutinarios anuales.',
  },
  moderado: {
    pill: 'RIESGO MODERADO',
    titulo: 'Lesión atípica',
    subtitulo: 'Riesgo moderado. Se sugiere consulta dermatológica en menos de 14 días.',
  },
  alto: {
    pill: 'RIESGO ALTO',
    titulo: 'Lesión sospechosa',
    subtitulo: 'Riesgo alto. Se recomienda consultar a un dermatólogo a la brevedad.',
  },
};

const ACCIONES: Record<Exclude<Triage, 'pendiente'>, string[]> = {
  bajo: [
    'Mantener controles dermatológicos de rutina una vez al año.',
    'Observar el lunar y consultar si cambia de forma, tamaño o color.',
    'Usar protector solar y evitar la exposición solar prolongada.',
  ],
  moderado: [
    'La red neuronal detectó características atípicas en la lesión.',
    'Se aconseja evaluación mediante dermatoscopía presencial.',
    'Evitar la exposición solar directa sobre la zona hasta la consulta.',
  ],
  alto: [
    'Consultar a un dermatólogo a la brevedad.',
    'Evaluar la necesidad de una biopsia según criterio médico.',
    'No manipular la lesión y protegerla del sol hasta la consulta.',
  ],
};

const LETRAS: { letter: Letra; title: string }[] = [
  { letter: 'A', title: 'Asimetría' },
  { letter: 'B', title: 'Bordes' },
  { letter: 'C', title: 'Color' },
  { letter: 'D', title: 'Diámetro' },
  { letter: 'E', title: 'Evolución' },
];

// Manda la foto a la IA y devuelve su respuesta (o un error con un mensaje claro)
export async function analizarImagen(file: File): Promise<IaResultado> {
  const form = new FormData();
  form.append('imagen', file);

  let res: Response;
  try {
    res = await fetch(IA_URL, { method: 'POST', headers: { 'X-API-Key': IA_API_KEY }, body: form });
  } catch {
    throw new Error('No se pudo conectar con la IA. Revisá tu conexión o que la IA esté encendida.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.mensaje ?? `La IA respondió con un error (${res.status}).`);
  }
  return data as IaResultado;
}

// Convierte la respuesta de la IA en lo que mostramos y guardamos
export function interpretar(r: IaResultado): ResultadoGuardado {
  const riesgo = Math.min(100, Math.round(r.riesgo_pct * ESCALA * 10) / 10);
  const umbral = Math.min(100, r.umbral_alerta_pct * ESCALA);

  const triage: Triage =
    r.supera_umbral || riesgo >= umbral ? 'alto' : riesgo >= MODERADO_DESDE ? 'moderado' : 'bajo';

  const a = r.abcde;
  const evaluable = a.evaluable && !!a.A && !!a.B && !!a.C && !!a.D;

  // E: según el riesgo (más de 50% = propenso a evolucionar)
  const propenso = riesgo > 50;
  const eTexto = propenso ? 'Propenso a evolucionar' : 'Sin signos de evolución';

  const abcdeTexts: AbcdeTexts = evaluable
    ? {
        A: a.A!.cumple ? 'Asimetría marcada' : 'Simétrico',
        B: a.B!.cumple ? 'Bordes irregulares' : 'Bordes regulares',
        C: a.C!.cumple ? 'Varios tonos' : 'Color homogéneo',
        D: `${a.D!.porcentaje_ancho_imagen}% del ancho de la foto`,
        E: eTexto,
      }
    : { A: 'No evaluable', B: 'No evaluable', C: 'No evaluable', D: 'No evaluable', E: eTexto };

  // En riesgo Bajo no se marca nada en rojo, para que no contradiga el resultado general
  let criteriaUsed: string[] = [];
  if (triage !== 'bajo') {
    if (evaluable) criteriaUsed = (['A', 'B', 'C'] as const).filter((k) => a[k]?.cumple);
    if (propenso) criteriaUsed = [...criteriaUsed, 'E'];
  }

    // Foto con el contorno verde que dibuja la IA (solo si pudo detectar el lunar)
    const contornoDataUrl =
    evaluable && r.imagen_con_contorno ? `data:image/png;base64,${r.imagen_con_contorno}` : undefined;

  return { triage, riskPercentage: riesgo, criteriaUsed, abcdeTexts, actions: ACCIONES[triage], contornoDataUrl };
}

// Achica la foto antes de guardarla (para que no se llene localStorage)
export function comprimirImagen(dataUrl: string, max = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function formatRisk(r: number | null | undefined): string {
  return r === null || r === undefined ? '—' : `${r.toFixed(1)}%`;
}

function TriageIcon({ triage }: { triage: Triage }) {
  const common = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  if (triage === 'bajo') return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>;
  if (triage === 'moderado') {
    return (
      <svg {...common}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (triage === 'alto') {
    return (
      <svg {...common}>
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg {...common} strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// Recuadro grande del resultado (verde / amarillo / rojo según el triage)
export function ResultHero({ triage, risk }: { triage: Triage; risk: number | null }) {
  const info = triage === 'pendiente' ? null : TRIAGE_INFO[triage];
  return (
    <div className={`result-hero triage-${triage}`}>
      <span className="result-hero-icon"><TriageIcon triage={triage} /></span>
      <div className="result-hero-main">
        <span className="result-risk-pill">{info ? info.pill : 'RIESGO —'}</span>
        <h4>{info ? info.titulo : '—'}</h4>
        <p>{info ? info.subtitulo : '—'}</p>
      </div>
      <div className="result-hero-risk">
        <span>Riesgo IA</span>
        <strong>{risk === null ? '—%' : formatRisk(risk)}</strong>
      </div>
    </div>
  );
}

// Las 5 tarjetas ABCDE (las que dan positivo se marcan en rojo suave)
// Las 5 tarjetas ABCDE (las que dan positivo se marcan en rojo suave)
export function AbcdeGrid({ texts, used }: { texts?: AbcdeTexts; used: string[] }) {
  const noEvaluable = texts?.A === 'No evaluable';
  return (
    <>
      <div className="abcde-detail-grid">
        {LETRAS.map((c) => (
          <div className={`abcde-detail-card${used.includes(c.letter) ? ' used' : ''}`} key={c.letter}>
            <span className="abcde-detail-letter">{c.letter} - {c.title}</span>
            <span className="abcde-detail-desc">{texts ? texts[c.letter] : '—'}</span>
          </div>
        ))}
      </div>
      {noEvaluable && (
        <p className="abcde-note">
          La IA no pudo delimitar bien el lunar en esta foto, por eso no evaluó A, B, C y D.
          El riesgo IA sí es válido.
        </p>
      )}
    </>
  );
}

export function AccionesList({ actions }: { actions?: string[] }) {
  const list = actions && actions.length > 0 ? actions : ['—', '—', '—'];
  return (
    <ul className="actions-checklist">
      {list.map((a, i) => <li key={i}>{a}</li>)}
    </ul>
  );
}

// Pastilla de color para las tablas
export function TriagePill({ triage }: { triage: Triage }) {
  const label: Record<Triage, string> = {
    bajo: 'Bajo Riesgo', moderado: 'Moderado', alto: 'Alto Riesgo', pendiente: '— Riesgo',
  };
  return <span className={`triage-pill triage-${triage}`}>{label[triage]}</span>;
}

// Letras ABCDE de las tablas (las que dan positivo, marcadas)
export function CriteriaDots({ used }: { used: string[] }) {
  return (
    <div className="criteria-dots">
      {LETRAS.map((c) => (
        <span key={c.letter} className={`criteria-dot${used.includes(c.letter) ? ' used' : ''}`}>{c.letter}</span>
      ))}
    </div>
  );
}