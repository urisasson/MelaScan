import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
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
  doctorEmail: string;
  doctorName?: string;
  patientEmail?: string;
  patientName?: string;
  sentTo?: { email: string; name: string }[];
}

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  assignedDoctorEmail?: string;
  assignedDoctorEmails?: string[];
}

interface Session {
  name: string;
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

const ABCDE_CRITERIA = [
  { letter: 'A', title: 'Asimetría' },
  { letter: 'B', title: 'Bordes' },
  { letter: 'C', title: 'Color' },
  { letter: 'D', title: 'Diámetro' },
  { letter: 'E', title: 'Evolución' },
];

function IconCamera() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionSaved, setDescriptionSaved] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);

  const [patientQuery, setPatientQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ email: string; name: string } | null>(null);
  const [choosing, setChoosing] = useState(false); // true = buscando otro paciente con "Cambiar"

  const [patientSaved, setPatientSaved] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [locked, setLocked] = useState(false); // true = ya se envió (no se puede volver a enviar ni cambiar)

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionRaw = localStorage.getItem('melascan_session');
  const session: Session | null = sessionRaw ? JSON.parse(sessionRaw) : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];

  const allPatients = users.filter((u) => u.role === 'paciente').sort((a, b) => a.name.localeCompare(b.name));

  const filteredPatients = allPatients.filter((p) => matchesWordStart(p.name, patientQuery));

  // Deja la pantalla como recién entrada (sin foto ni resultado)
  const resetScanner = () => {
    setFile(null);
    setPreview(null);
    setDragging(false);
    setAnalyzing(false);
    setHasResult(false);
    setShowTips(false);
    setDescription('');
    setDescriptionSaved(false);
    setRecordId(null);
    setPatientQuery('');
    setShowPatientDropdown(false);
    setSelectedPatient(null);
    setPatientSaved(false);
    setConfirmingSend(false);
    setLocked(false);
    setChoosing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Tocar "Scaner IA" en el menú estando ya acá: vuelve al inicio del escáner
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path === '/home') resetScanner();
    };
    window.addEventListener('melascan-nav-reset', handler);
    return () => window.removeEventListener('melascan-nav-reset', handler);
  }, []);

  const loadFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setHasResult(false);
    setRecordId(null);
    setDescription('');
    setDescriptionSaved(false);
    setPatientQuery('');
    setShowPatientDropdown(false);
    setSelectedPatient(null);
    setPatientSaved(false);
    setConfirmingSend(false);
    setLocked(false);
    setChoosing(false);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => loadFile(e.target.files?.[0]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!file || !preview || !session) return;
    setAnalyzing(true);

    // TODO: reemplazar por la llamada real a la API de IA (FastAPI) de Ezequiel
    // const formData = new FormData();
    // formData.append('image', file);
    // const res = await fetch('http://localhost:8000/analizar', { method: 'POST', body: formData });
    // const data = await res.json();
    // Cuando eso exista, el registro de abajo va a usar data.triage,
    // data.riskPercentage y data.criteriaUsed en vez de los valores "pendiente".

    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];

    const newRecord: AnalysisRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('es-AR'),
      imageDataUrl: preview,
      triage: 'pendiente',
      riskPercentage: null,
      criteriaUsed: [],
      description: '',
      sentToPatient: false,
      doctorEmail: session.email,
      doctorName: session.name,
    };

    historial.unshift(newRecord);
    localStorage.setItem('melascan_historial', JSON.stringify(historial));

    setRecordId(newRecord.id);
    setAnalyzing(false);
    setHasResult(true);
  };

  const handleSaveDescription = () => {
    if (!recordId) return;
    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    const updated = historial.map((r) => (r.id === recordId ? { ...r, description } : r));
    localStorage.setItem('melascan_historial', JSON.stringify(updated));
    setDescriptionSaved(true);
  };

  const handleSavePatient = () => {
    if (!recordId || !selectedPatient) return;
    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    const updated = historial.map((r) =>
      r.id === recordId ? { ...r, patientEmail: selectedPatient.email, patientName: selectedPatient.name } : r
    );
    localStorage.setItem('melascan_historial', JSON.stringify(updated));
    setPatientSaved(true);
  };

  // Enviar: se suma el paciente a la lista de envíos (no cambia el paciente guardado en la tabla)
  const handleConfirmSend = () => {
    if (!recordId || !selectedPatient || !session) return;

    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    const updated = historial.map((r) => {
      if (r.id !== recordId) return r;
      const prevSent = r.sentTo ?? [];
      const alreadySent = prevSent.some((s) => s.email === selectedPatient.email);
      return {
        ...r,
        sentToPatient: true,
        sentTo: alreadySent ? prevSent : [...prevSent, { email: selectedPatient.email, name: selectedPatient.name }],
      };
    });
    localStorage.setItem('melascan_historial', JSON.stringify(updated));

    // El paciente queda asignado a este médico y le aparece el chat
    const usersNowRaw = localStorage.getItem('melascan_users');
    const allUsers: StoredUser[] = usersNowRaw ? JSON.parse(usersNowRaw) : [];
    const updatedUsers = allUsers.map((u) => {
      if (u.email !== selectedPatient.email) return u;
      const assigned = u.assignedDoctorEmails ?? (u.assignedDoctorEmail ? [u.assignedDoctorEmail] : []);
      return assigned.includes(session.email) ? u : { ...u, assignedDoctorEmails: [...assigned, session.email] };
    });
    localStorage.setItem('melascan_users', JSON.stringify(updatedUsers));
    localStorage.removeItem(`melascan_hidden_${session.email}__${selectedPatient.email}_${selectedPatient.email}`);
    window.dispatchEvent(new Event('storage'));

    setLocked(true);
    setConfirmingSend(false);
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="scanner-grid-v2">
          <div className="scan-card">
            <div className="scan-card-head">
              <IconCamera />
              <h3>Análisis Fotográfico</h3>
            </div>

            <label htmlFor="fileInput" style={{ display: 'block', height: 200 }}>
              <div
                className={`dropzone-v2${dragging ? ' drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {preview ? (
                  <img src={preview} alt="Vista previa del lunar" />
                ) : (
                  <>
                    <div className="dz-text">Arrastre la fotografía o haga clic aquí</div>
                    <div className="dz-sub">Revise las recomendaciones de imagen</div>
                    <span className="btn-secondary dz-select-btn"><IconFolder /> Seleccionar archivo</span>
                  </>
                )}
              </div>
            </label>
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            <button
              className="btn-primary scan-analyze-btn"
              disabled={!file || analyzing || hasResult}
              onClick={handleAnalyze}
            >
              {analyzing ? 'Analizando…' : hasResult ? 'Analizar lunar' : 'Analizar lunar'}
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
            {!hasResult ? (
              <div className="result-empty">
                <h3>Resultado de diagnóstico</h3>
                <p>Suba una imagen o arrástrela en el seleccionador de la izquierda para que sea analizada y ver los resultados.</p>
              </div>
            ) : (
              <>
                {/* Recuadro grande: resultado triage + riesgo IA */}
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
                      <button className="btn-primary btn-sm" onClick={handleSaveDescription} disabled={descriptionSaved}>Guardar</button>
                  </div>
                </div>

                <div className="result-section">
                  <div className="result-section-head">
                    <div className="scan-section-title"><IconSend /> Enviar análisis a tu paciente</div>
                    {/* Una vez enviado ya no se puede cambiar el paciente */}
                    {selectedPatient && !confirmingSend && (
                      choosing ? (
                        <button type="button" className="link-btn" onClick={() => setChoosing(false)}>
                          Cancelar
                        </button>
                      ) : (
                        <button type="button" className="link-btn" onClick={() => { setChoosing(true); setPatientQuery(''); }}>
                          Cambiar
                        </button>
                      )
                    )}
                  </div>

                  {allPatients.length === 0 ? (
                    <p className="form-hint">Todavía no hay pacientes registrados en el sistema.</p>
                  ) : confirmingSend && selectedPatient ? (
                    <div className="confirm-send-box">
                      <p>¿Enviar este análisis a <strong>{selectedPatient.name}</strong>?</p>
                      <div className="confirm-send-actions">
                        <button className="btn-secondary" onClick={() => setConfirmingSend(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleConfirmSend}>Confirmar envío</button>
                      </div>
                    </div>
                    ) : !selectedPatient || choosing ? (
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
                                onMouseDown={() => {
                                  setSelectedPatient({ email: p.email, name: p.name });
                                  setPatientQuery(p.name);
                                  setShowPatientDropdown(false);
                                  setPatientSaved(false);
                                  setLocked(false);
                                  setChoosing(false);
                                }}
                              >
                                <HighlightMatch text={p.name} query={patientQuery} />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="patient-line">
                      <span>Paciente elegido: <strong>{selectedPatient.name}</strong></span>
                      <div className="patient-line-actions">
                        {locked ? (
                          <span className="status-done">Enviado ✓</span>
                        ) : (
                          <button className="btn-send" onClick={() => setConfirmingSend(true)}>Enviar</button>
                        )}
                        {patientSaved ? (
                          <span className="status-done">Guardado ✓</span>
                        ) : (
                          <button className="btn-save-outline" onClick={handleSavePatient}>Guardar</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="disclaimer" style={{ marginTop: 6 }}>
                  Este resultado es orientativo y no reemplaza el diagnóstico médico ni la biopsia.
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}