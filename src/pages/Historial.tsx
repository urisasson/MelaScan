import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface AnalysisRecord {
  id: string;
  date: string;
  imageDataUrl: string;
  triage: 'pendiente' | 'bajo' | 'moderado' | 'alto';
  riskPercentage: number | null;
  criteriaUsed: string[];
  description: string;
  sentToPatient: boolean;
  doctorEmail?: string;
  patientName?: string;
}

interface Session {
  email: string;
  role: 'medico' | 'paciente';
}

const ALL_CRITERIA: string[] = ['A', 'B', 'C', 'D', 'E'];

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Historial() {
  const guardSessionRaw = localStorage.getItem('melascan_session');
  const guardSession: Session | null = guardSessionRaw ? JSON.parse(guardSessionRaw) : null;
  if (!guardSession || guardSession.role !== 'medico') {
    return <Navigate to="/" replace />;
  }

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path === '/historial') setSelectedId(null);
    };
    window.addEventListener('melascan-nav-reset', handler);
    return () => window.removeEventListener('melascan-nav-reset', handler);
  }, []);

  const raw = localStorage.getItem('melascan_historial');
  const all: AnalysisRecord[] = raw ? JSON.parse(raw) : [];

  const session = guardSession;

  const myEntries = all.filter((r) => r.doctorEmail === session.email);
  const entries = myEntries.filter((r) => (r.patientName ?? '').toLowerCase().includes(search.toLowerCase()));
  const selected = myEntries.find((e) => e.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="shell-content">
          <button className="back-link" onClick={() => setSelectedId(null)}>
            ‹ Volver al Historial
          </button>

          <div className="scanner-grid-v2">
            <div className="scan-card">
              <img src={selected.imageDataUrl} alt="Lesión analizada" className="analysis-full-image" />
            </div>

            <div className="scan-card">
              <div className="result-top-badge-row">
                <span className="result-risk-pill">RIESGO —</span>
                <span className="result-percentage">Riesgo IA<strong>—%</strong></span>
              </div>

              <div className="scan-section-title">Paciente</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{selected.patientName ?? '—'}</p>

              <div className="scan-section-title">Clasificación a partir del criterio ABCDE</div>
              <div className="abcde-detail-grid">
                {ALL_CRITERIA.map((letter) => (
                  <div className="abcde-detail-card" key={letter}>
                    <span className="abcde-detail-letter">{letter}</span>
                    <span className="abcde-detail-desc">—</span>
                  </div>
                ))}
              </div>

              <div className="scan-section-title">Acciones recomendadas</div>
              <ul className="actions-checklist">
                <li>—</li>
                <li>—</li>
                <li>—</li>
              </ul>

              <div className="scan-section-title">Descripción</div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.description || '—'}</p>

              <div className="disclaimer" style={{ marginTop: 16 }}>
                Este resultado es orientativo y no reemplaza el diagnóstico médico ni la biopsia.
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
              <h1>Historial y Seguimiento Temporal</h1>
              <p>Revise sus análisis más recientes y busque el de cualquier paciente.</p>
            </div>
            <a href="/home" className="btn-primary">
              <IconPlus /> Nuevo Escaneo
            </a>
          </div>
        </div>

        <label className="search-bar">
          <IconSearch />
          <input
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            placeholder="Buscar por el nombre del paciente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="historial-table-wrap">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Lesión</th>
                <th>Paciente</th>
                <th>Fecha de escaneo</th>
                <th>Resultado triage</th>
                <th>Criterio ABCDE</th>
                <th>Riesgo IA</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    {myEntries.length === 0 ? 'Todavía no hay escaneos registrados.' : 'No se encontraron análisis con ese paciente.'}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="clickable-row" onClick={() => setSelectedId(entry.id)}>
                    <td><img src={entry.imageDataUrl} alt="Lesión" className="historial-thumb" /></td>
                    <td>{entry.patientName ?? '—'}</td>
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
                    <td className="descripcion-cell">{entry.description || '—'}</td>
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