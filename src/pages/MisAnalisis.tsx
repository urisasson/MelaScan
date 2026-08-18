import { useState } from 'react';
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
  patientName?: string;
}

const triageClass: Record<AnalysisRecord['triage'], string> = {
  pendiente: 'risk-pending',
  bajo: 'risk-low',
  moderado: 'risk-mid',
  alto: 'risk-high',
};

const ALL_CRITERIA = ['A', 'B', 'C', 'D', 'E'];

export default function MisAnalisis() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const raw = localStorage.getItem('melascan_historial');
  const all: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
  const analyses = all.filter((r) => r.sentToPatient);

  const selected = analyses.find((a) => a.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="shell-content">
          <button className="back-link" onClick={() => setSelectedId(null)}>
            ‹ Volver a Mis Análisis
          </button>

          <div className="scanner-grid">
            <div className="lesion-panel">
              <img src={selected.imageDataUrl} alt="Lesión analizada" className="analysis-full-image" />
            </div>

            <div className="result-panel">
              <div className="result-top">
                <span className={`risk-badge ${triageClass[selected.triage]}`}>
                  <span className="dot" />Riesgo {selected.triage}
                </span>
                <span className="prob-value">
                  Riesgo IA: {selected.riskPercentage !== null ? `${selected.riskPercentage}%` : '—'}
                </span>
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

              {selected.description && (
                <div className="result-block-section">
                  <h4>Descripción de tu médico</h4>
                  <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>{selected.description}</p>
                </div>
              )}

              <div className="disclaimer">
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
        <div className="historial-head">
          <div>
            <h1>Mis Análisis</h1>
            <p>Acá podrás revisar los análisis que tu médico te envió. Para ver más detalles, cliqueálo.</p>
          </div>
        </div>

        <div className="historial-table-wrap">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Lesión y muestra</th>
                <th>Fecha de escaneo</th>
                <th>Resultado triage</th>
                <th>Criterio ABCDE</th>
                <th>Riesgo IA</th>
                <th>Especialista</th>
              </tr>
            </thead>
            <tbody>
              {analyses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">Tu médico todavía no te envió ningún análisis.</td>
                </tr>
              ) : (
                analyses.map((entry) => (
                  <tr key={entry.id} className="clickable-row" onClick={() => setSelectedId(entry.id)}>
                    <td><img src={entry.imageDataUrl} alt="Lesión" className="historial-thumb" /></td>
                    <td>{entry.date}</td>
                    <td>
                      <span className={`risk-badge ${triageClass[entry.triage]}`}>
                        <span className="dot" />{entry.triage}
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
                    <td>Tu médico</td>
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