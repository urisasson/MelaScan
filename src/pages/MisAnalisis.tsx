import { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface AnalysisEntry {
  id: string;
  date: string;
  triage: 'bajo' | 'moderado' | 'alto';
  criteriaUsed: string[]; // subconjunto de ['A','B','C','D','E']
  riskPercentage: number;
  doctorName: string;
  imageUrl?: string;
}

// TODO: reemplazar por GET /mis-analisis al backend de Franco
// (los análisis que el médico compartió con este paciente)
const analyses: AnalysisEntry[] = [];

const triageClass: Record<AnalysisEntry['triage'], string> = {
  bajo: 'risk-low',
  moderado: 'risk-mid',
  alto: 'risk-high',
};

const ALL_CRITERIA = ['A', 'B', 'C', 'D', 'E'];

export default function MisAnalisis() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = analyses.find((a) => a.id === selectedId) ?? null;

  // Vista de detalle: se queda en la misma pantalla, no navega a otra ruta
  if (selected) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="shell-content">
          <button className="back-link" onClick={() => setSelectedId(null)}>
            ‹ Análisis de {selected.doctorName}
          </button>

          <div className="scanner-grid">
            <div className="lesion-panel">
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt="Lesión analizada" className="analysis-full-image" />
              ) : (
                <div className="analysis-full-image-placeholder" />
              )}
            </div>

            <div className="result-panel">
              <div className="result-top">
                <span className={`risk-badge ${triageClass[selected.triage]}`}>
                  <span className="dot" />Riesgo {selected.triage}
                </span>
                <span className="prob-value">Riesgo IA: {selected.riskPercentage}%</span>
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

  // Vista de lista
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="historial-head">
          <div>
            <h1>Mis Análisis</h1>
            <p>Acá podrás revisar los análisis que tu médico te envió. Para ver más detalles del análisis, cliqueálo.</p>
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
                    <td><div className="historial-thumb" /></td>
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
                    <td>{entry.riskPercentage}%</td>
                    <td>{entry.doctorName}</td>
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