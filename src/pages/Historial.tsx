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

  const raw = localStorage.getItem('melascan_historial');
  const all: AnalysisRecord[] = raw ? JSON.parse(raw) : [];

  const sessionRaw = localStorage.getItem('melascan_session');
  const session: Session | null = sessionRaw ? JSON.parse(sessionRaw) : null;

  const myEntries = all.filter((r) => r.doctorEmail === session?.email);
  const entries = myEntries.filter((r) => (r.patientName ?? '').toLowerCase().includes(search.toLowerCase()));

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
                  <tr key={entry.id}>
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