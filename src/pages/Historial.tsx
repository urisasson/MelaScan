import { useState } from 'react';
import { Link } from 'react-router-dom';
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
}

const triageClass: Record<AnalysisRecord['triage'], string> = {
  pendiente: 'risk-pending',
  bajo: 'risk-low',
  moderado: 'risk-mid',
  alto: 'risk-high',
};

const ALL_CRITERIA = ['A', 'B', 'C', 'D', 'E'];

export default function Historial() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const raw = localStorage.getItem('melascan_historial');
  const all: AnalysisRecord[] = raw ? JSON.parse(raw) : [];

  const sessionRaw = localStorage.getItem('melascan_session');
  const session: Session | null = sessionRaw ? JSON.parse(sessionRaw) : null;

  const myEntries = all.filter((r) => r.doctorEmail === session?.email);
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

          <div className="scanner-grid">
            <div className="lesion-panel">
              <img src={selected.imageDataUrl} alt="Lesión analizada" className="analysis-full-image" />
            </div>

            <div className="result-panel">
              <div className="result-top">
                <span className={`risk-badge ${triageClass[selected.triage]}`}>
                  <span className="dot" />
                  {selected.triage === 'pendiente' ? '—' : `Riesgo ${selected.triage}`}
                </span>
                <span className="prob-value">
                  Riesgo IA: {selected.riskPercentage !== null ? `${selected.riskPercentage}%` : '—'}
                </span>
              </div>

              <div className="result-block-section">
                <h4>Paciente</h4>
                <p style={{ fontSize: 13.5 }}>{selected.patientName ?? 'Sin paciente asignado'}</p>
              </div>

              <div className="result-block-section">
                <h4>Clasificación a partir del criterio ABCDE</h4>
                <div className="abcde-mini-grid">
                  {ALL_CRITERIA.map((c) => (
                    <div
                      className={`abcde-mini-card${selected.criteriaUsed.includes(c) ? ' used' : ''}`}
                      key={c}
                    >
                      <span className="abcde-mini-letter">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-block-section">
                <h4>Acciones recomendadas</h4>
                <ol className="actions-list">
                  <li>—</li>
                  <li>—</li>
                  <li>—</li>
                </ol>
              </div>

              <div className="result-block-section">
                <h4>Descripción</h4>
                <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>{selected.description || 'Sin descripción cargada.'}</p>
              </div>

              <div className="disclaimer">
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
        <div className="historial-head">
          <div>
            <h1>Historial y seguimiento</h1>
            <p>Acá podrás revisar el historial de tus análisis y hacer seguimiento para no perder el registro. Cliqueá una fila para ver el detalle completo.</p>
          </div>
          <Link to="/home" className="btn-primary">+ Realizar otro escaneo</Link>
        </div>

        <input
          className="search-bar"
          placeholder="Buscar por nombre de paciente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="historial-table-wrap">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Lesión y muestra</th>
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
                    <td>
                      <span className={`risk-badge ${triageClass[entry.triage]}`}>
                        <span className="dot" />
                        {entry.triage === 'pendiente' ? '—' : entry.triage}
                      </span>
                    </td>
                    <td>
                      <div className="criteria-dots">
                        {ALL_CRITERIA.map((c) => (
                          <span key={c} className={`criteria-dot${entry.criteriaUsed.includes(c) ? ' used' : ''}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{entry.riskPercentage !== null ? `${entry.riskPercentage}%` : '—'}</td>
                    <td>{entry.description || '—'}</td>
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