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
  description: string;
  sentToPatient: boolean;
  doctorEmail?: string;
  doctorName?: string;
  patientEmail?: string;
  patientName?: string;
  sentTo?: SentEntry[];
}

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  assignedDoctorEmail?: string;
  assignedDoctorEmails?: string[];
}

interface Session {
  email: string;
  role: 'medico' | 'paciente';
}

const ALL_CRITERIA: string[] = ['A', 'B', 'C', 'D', 'E'];

const ABCDE_CRITERIA = [
  { letter: 'A', title: 'Asimetría' },
  { letter: 'B', title: 'Bordes' },
  { letter: 'C', title: 'Color' },
  { letter: 'D', title: 'Diámetro' },
  { letter: 'E', title: 'Evolución' },
];

// A quiénes se les envió el análisis (soporta análisis viejos, que guardaban un solo paciente)
function getSentTo(r: AnalysisRecord): SentEntry[] {
  if (r.sentTo) return r.sentTo;
  return r.sentToPatient && r.patientEmail ? [{ email: r.patientEmail, name: r.patientName ?? '' }] : [];
}

function readHistorial(): AnalysisRecord[] {
  const raw = localStorage.getItem('melascan_historial');
  return raw ? JSON.parse(raw) : [];
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconSearch({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
function IconCamera() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
    >
      <polyline points="6 9 12 15 18 9" />
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
function IconFileText() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// Detalle de un análisis: misma pantalla que el resultado de Scaner IA
function AnalysisDetail({ recordId, onBack }: { recordId: string; onBack: () => void }) {
  const record = readHistorial().find((r) => r.id === recordId);

  const [description, setDescription] = useState(record?.description ?? '');
  const [, setDescriptionSaved] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [chosenPatient, setChosenPatient] = useState<SentEntry | null>(null);
  // Lo que hiciste con el paciente recién elegido (arranca en cero, como uno nuevo)
  const [chosenSaved, setChosenSaved] = useState(false);
  const [chosenSent, setChosenSent] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [, setTick] = useState(0);

  if (!record) return null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const allPatients = users.filter((u) => u.role === 'paciente').sort((a, b) => a.name.localeCompare(b.name));
  const filteredPatients = allPatients.filter((p) => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().split(' ').some((word) => word.startsWith(q));
  });

  const sentTo = getSentTo(record);
  const savedPatient: SentEntry | null = record.patientEmail
    ? { email: record.patientEmail, name: record.patientName ?? '' }
    : null;
  const lastSent = sentTo.length > 0 ? sentTo[sentTo.length - 1] : null;

  // Paciente que se muestra: el que elegiste con "Cambiar", o el guardado, o el último al que se envió
  const shownPatient = chosenPatient ?? savedPatient ?? lastSent;

  // Si lo elegiste con "Cambiar" (aunque sea el mismo), se trata como uno nuevo
  const isSaved = chosenPatient
    ? chosenSaved
    : !!shownPatient && savedPatient?.email === shownPatient.email;
  const isSent = chosenPatient
    ? chosenSent
    : !!shownPatient && sentTo.some((s) => s.email === shownPatient.email);

  const updateRecord = (changes: Partial<AnalysisRecord>) => {
    const updated = readHistorial().map((r) => (r.id === recordId ? { ...r, ...changes } : r));
    localStorage.setItem('melascan_historial', JSON.stringify(updated));
    setTick((n) => n + 1);
  };

  const handleSaveDescription = () => {
    updateRecord({ description });
    setDescriptionSaved(true);
  };

  const handleChoosePatient = (p: StoredUser) => {
    setChosenPatient({ email: p.email, name: p.name });
    setChosenSaved(false);
    setChosenSent(false);
    setChoosing(false);
    setPatientQuery('');
    setShowPatientDropdown(false);
  };

  // Guardar: este paciente pasa a ser el que se ve en la tabla del Historial
  const handleSavePatient = () => {
    if (!shownPatient) return;
    updateRecord({ patientEmail: shownPatient.email, patientName: shownPatient.name });
    setChosenSaved(true);
  };

  // Enviar: se suma a la lista de pacientes que recibieron el análisis
  const handleConfirmSend = () => {
    if (!shownPatient) return;
    if (!sentTo.some((s) => s.email === shownPatient.email)) {
      updateRecord({ sentToPatient: true, sentTo: [...sentTo, shownPatient] });
    }

    // El paciente queda asignado a este médico y le aparece el chat
    const doctorEmail = record.doctorEmail;
    if (doctorEmail) {
      const updatedUsers = users.map((u) => {
        if (u.email !== shownPatient.email) return u;
        const assigned = u.assignedDoctorEmails ?? (u.assignedDoctorEmail ? [u.assignedDoctorEmail] : []);
        return assigned.includes(doctorEmail) ? u : { ...u, assignedDoctorEmails: [...assigned, doctorEmail] };
      });
      localStorage.setItem('melascan_users', JSON.stringify(updatedUsers));
      localStorage.removeItem(`melascan_hidden_${doctorEmail}__${shownPatient.email}_${shownPatient.email}`);
      window.dispatchEvent(new Event('storage'));
    }

    setChosenSent(true);
    setConfirmingSend(false);
  };

  return (
    <>
      <button className="back-link" onClick={onBack}>
        <IconArrowLeft /> Volver a Historial
      </button>

      <div className="scanner-grid-v2">
        <div className="scan-card">
          <div className="scan-card-head">
            <IconCamera />
            <h3>Análisis Fotográfico</h3>
          </div>

          <div style={{ height: 200 }}>
            <div className="dropzone-v2" style={{ cursor: 'default' }}>
              <img src={record.imageDataUrl} alt="Lesión analizada" />
            </div>
          </div>

          <button className="btn-primary scan-analyze-btn" disabled>
            Análisis guardado ✓
          </button>

          <button className="collapsible-toggle-v2" onClick={() => setShowTips((s) => !s)}>
            <IconInfo /> Recomendaciones para la fotografía
            <span className="collapsible-chevron"><IconChevron open={showTips} /></span>
          </button>
          {showTips && (
            <div className="guidelines">
              <div className="guideline"><span className="dot" />Usá luz natural, evitá sombras duras.</div>
              <div className="guideline"><span className="dot" />Enfocá bien y evitá el movimiento.</div>
              <div className="guideline"><span className="dot" />Incluí una referencia de escala si es posible.</div>
              <div className="guideline"><span className="dot" />Sacá la foto de frente, a 10–15 cm.</div>
            </div>
          )}
        </div>

        <div className="scan-card">
          {/* Recuadro grande: resultado triage + riesgo IA */}
          <div className="result-hero">
            <span className="result-hero-icon"><IconSearch size={20} /></span>
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

          <div className="result-section">
            <div className="result-section-head">
              <div className="scan-section-title"><IconFileText /> Descripción</div>
            </div>
            <div className="inline-form-row">
              <input
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDescriptionSaved(false); }}
                placeholder="Escriba sus anotaciones sobre el análisis"
              />
                <button className="btn-primary btn-sm" onClick={handleSaveDescription}>Guardar</button>
            </div>
          </div>

          <div className="result-section">
            <div className="result-section-head">
              <div className="scan-section-title"><IconSend /> Enviar análisis a tu paciente</div>
              {shownPatient && !confirmingSend && (
                choosing ? (
                  <button type="button" className="link-btn" onClick={() => setChoosing(false)}>Cancelar</button>
                ) : (
                  <button type="button" className="link-btn" onClick={() => setChoosing(true)}>Cambiar</button>
                )
              )}
            </div>

            {allPatients.length === 0 ? (
              <p className="form-hint">Todavía no hay pacientes registrados en el sistema.</p>
            ) : confirmingSend && shownPatient ? (
              <div className="confirm-send-box">
                <p>¿Enviar este análisis a <strong>{shownPatient.name}</strong>?</p>
                <div className="confirm-send-actions">
                  <button className="btn-secondary" onClick={() => setConfirmingSend(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleConfirmSend}>Confirmar envío</button>
                </div>
              </div>
            ) : shownPatient && !choosing ? (
              <div className="patient-line">
                <span>Paciente elegido: <strong>{shownPatient.name}</strong></span>
                <div className="patient-line-actions">
                  {isSent ? (
                    <span className="status-done">Enviado ✓</span>
                  ) : (
                    <button className="btn-send" onClick={() => setConfirmingSend(true)}>Enviar</button>
                  )}
                  {isSaved ? (
                    <span className="status-done">Guardado ✓</span>
                  ) : (
                    <button className="btn-save-outline" onClick={handleSavePatient}>Guardar</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="searchable-select">
                <input
                  value={patientQuery}
                  onChange={(e) => { setPatientQuery(e.target.value); setShowPatientDropdown(true); }}
                  onFocus={() => setShowPatientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                  placeholder="Escriba el nombre de su paciente"
                />
                {showPatientDropdown && (
                  <div className="searchable-dropdown">
                    {filteredPatients.length === 0 ? (
                      <div className="searchable-empty">Sin resultados</div>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.email}
                          type="button"
                          onMouseDown={(ev) => { ev.preventDefault(); handleChoosePatient(p); }}
                        >
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="disclaimer" style={{ marginTop: 6 }}>
            Este resultado es orientativo y no reemplaza el diagnóstico médico ni la biopsia.
          </div>
        </div>
      </div>
    </>
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

  const session = guardSession;
  const myEntries = readHistorial().filter((r) => r.doctorEmail === session.email);
  const entries = myEntries.filter((r) => (r.patientName ?? '').toLowerCase().includes(search.toLowerCase()));
  const selected = myEntries.find((e) => e.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="shell">
        <Sidebar />
        <main className="shell-content">
          <AnalysisDetail key={selected.id} recordId={selected.id} onBack={() => setSelectedId(null)} />
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