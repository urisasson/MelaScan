import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

interface ScanEntry {
  id: string;
  date: string;
  triage: 'bajo' | 'moderado' | 'alto';
  criteriaUsed: string[]; // subconjunto de ['A','B','C','D','E']
  riskPercentage: number;
  description: string;
}

// TODO: reemplazar por GET /historial al backend de Franco.
// Cada elemento debe tener la forma de ScanEntry de arriba.
const entries: ScanEntry[] = [];

const triageClass: Record<ScanEntry['triage'], string> = {
  bajo: 'risk-low',
  moderado: 'risk-mid',
  alto: 'risk-high',
};

const ALL_CRITERIA = ['A', 'B', 'C', 'D', 'E'];

export default function Historial() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="historial-head">
          <div>
            <h1>Historial y seguimiento</h1>
            <p>Acá podrás revisar el historial de tus análisis y hacer seguimiento para no perder el registro.</p>
          </div>
          <Link to="/home" className="btn-primary">+ Realizar otro escaneo</Link>
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
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">Todavía no hay escaneos registrados.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
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
                    <td>{entry.description}</td>
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