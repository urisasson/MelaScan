import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface SentEntry {
  email: string;
  name: string;
}

interface AnalysisRecord {
  id: string;
  date: string;
  imageDataUrl: string;
  triage: 'pendiente' | 'bajo' | 'moderado' | 'alto';
  riskPercentage: number | null;
  criteriaUsed: string[];
  sentToPatient: boolean;
  doctorName?: string;
  patientEmail?: string;
  patientName?: string;
  sentTo?: SentEntry[];
}

interface Session {
  email: string;
  role: 'medico' | 'paciente';
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function matchesWordStart(text: string, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(text).split(' ').some((word) => word.startsWith(q));
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = normalize(query.trim());
  if (!q) return <>{text}</>;
  const t = normalize(text);
  let idx = -1;
  for (let i = 0; i < t.length; i++) {
    if ((i === 0 || t[i - 1] === ' ') && t.startsWith(q, i)) { idx = i; break; }
  }
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="search-hit">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

const ALL_CRITERIA: string[] = ['A', 'B', 'C', 'D', 'E'];
const ABCDE_CRITERIA = [
  { letter: 'A', title: 'Asimetría' },
  { letter: 'B', title: 'Bordes' },
  { letter: 'C', title: 'Color' },
  { letter: 'D', title: 'Diámetro' },
  { letter: 'E', title: 'Evolución' },
];

function getSentTo(r: AnalysisRecord): SentEntry[] {
  if (r.sentTo) return r.sentTo;
  return r.sentToPatient && r.patientEmail ? [{ email: r.patientEmail, name: r.patientName ?? '' }] : [];
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconCheckSquare() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export default function MisAnalisis() {
  const guardSessionRaw = localStorage.getItem('melascan_session');
  const guardSession: Session | null = guardSessionRaw ? JSON.parse(guardSessionRaw) : null;
  if (!guardSession || guardSession.role !== 'paciente') {
    return <Navigate to="/" replace />;
  }

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path === '/mis-analisis') setSelectedId(null);
    };
    window.addEventListener('melascan-nav-reset', handler);
    return () => window.removeEventListener('melascan-nav-reset', handler);
  }, []);

  const raw = localStorage.getItem('melascan_historial');
  const all: AnalysisRecord[] = raw ? JSON.parse(raw) : [];

  const session = guardSession;

  const myAnalyses = all.filter((r) => getSentTo(r).some((s) => s.email === session.email));
  const entries = myAnalyses.filter((r) => matchesWordStart(r.doctorName ?? '', search));  const selected = myAnalyses.find((a) => a.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="shell-content">
          <button className="back-link" onClick={() => setSelectedId(null)}>
            <IconArrowLeft /> Volver a Mis Análisis
          </button>

          <div className="scanner-grid-v2">
            <div className="scan-card">
              <img src={selected.imageDataUrl} alt="Lesión analizada" className="analysis-full-image" />
            </div>

            <div className="scan-card">
              <div className="result-hero">
                <span className="result-hero-icon"><IconSearch /></span>
                <div className="result-hero-main">
                  <span className="result-risk-pill">RIESGO —</span>
                  <h4>—</h4>
                  <p>—</p>
                </div>
                <div className="result-hero-risk">
                  <span>Riesgo IA</span>
                  <strong>—%</strong>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-head">
                  <div className="scan-section-title"><IconUser /> Especialista</div>
                </div>
                <p style={{ fontSize: 13, color: '#14181A' }}>{selected.doctorName ?? '—'}</p>
              </div>

              <div className="result-section">
                <div className="result-section-head">
                  <div className="scan-section-title"><IconGrid /> Clasificación a partir del criterio ABCDE</div>
                </div>
                <div className="abcde-detail-grid">
                  {ABCDE_CRITERIA.map((c) => (
                    <div className="abcde-detail-card" key={c.letter}>
                      <span className="abcde-detail-letter">{c.letter} - {c.title}</span>
                      <span className="abcde-detail-desc">—</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-head">
                  <div className="scan-section-title"><IconCheckSquare /> Acciones Recomendadas</div>
                </div>
                <ul className="actions-checklist">
                  <li>—</li>
                  <li>—</li>
                  <li>—</li>
                </ul>
              </div>

              <div className="disclaimer" style={{ marginTop: 6 }}>
                Este resultado es orientativo y no reemplaza el diagnóstico médico ni la biopsia.
                Ante cualquier duda, consultá con tu médico.
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="historial-page-card">
          <div className="historial-head">
            <div>
              <h1>Mis Análisis</h1>
              <p style={{ maxWidth: 'none' }}>Revisá los análisis que te enviaron tus médicos. Tocá uno para ver el detalle completo.</p>
            </div>
          </div>
        </div>

        <label className="search-bar">
          <IconSearch />
          <input
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            placeholder="Buscar por el nombre del médico…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="historial-table-wrap">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Lesión</th>
                <th>Especialista</th>
                <th>Fecha de escaneo</th>
                <th>Resultado triage</th>
                <th>Criterio ABCDE</th>
                <th>Riesgo IA</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    {myAnalyses.length === 0
                      ? 'Todavía no te enviaron ningún análisis.'
                      : 'No se encontraron análisis de ese médico.'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="clickable-row" onClick={() => setSelectedId(entry.id)}>
                    <td><img src={entry.imageDataUrl} alt="Lesión" className="historial-thumb" /></td>
                    <td>{entry.doctorName ? <HighlightMatch text={entry.doctorName} query={search} /> : '—'}</td>
                    <td>{entry.date}</td>
                    <td><span className="triage-pill">— Riesgo</span></td>
                    <td>
                      <div className="criteria-dots">
                        {ALL_CRITERIA.map((letter) => (
                          <span key={letter} className="criteria-dot">{letter}</span>
                        ))}
                      </div>
                    </td>
                    <td>—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}