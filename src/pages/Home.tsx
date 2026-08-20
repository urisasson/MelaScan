import { useState } from 'react';
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
}

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
}

interface Session {
  name: string;
  email: string;
}

const ABCDE_CRITERIA = [
  { letter: 'A', title: 'Asimetría' },
  { letter: 'B', title: 'Bordes' },
  { letter: 'C', title: 'Color' },
  { letter: 'D', title: 'Diámetro' },
  { letter: 'E', title: 'Evolución' },
];

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

  // Paciente elegido en el buscador (todavía no implica ni guardado ni envío)
  const [patientQuery, setPatientQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ email: string; name: string } | null>(null);

  const [patientSaved, setPatientSaved] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [locked, setLocked] = useState(false); // true solo después de confirmar el ENVÍO
  const [sentTo, setSentTo] = useState<string | null>(null);

  const sessionRaw = localStorage.getItem('melascan_session');
  const session: Session | null = sessionRaw ? JSON.parse(sessionRaw) : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];

  // El médico puede elegir a CUALQUIER paciente registrado, sin importar si está asignado a él.
  const allPatients = users.filter((u) => u.role === 'paciente').sort((a, b) => a.name.localeCompare(b.name));

  const filteredPatients = allPatients.filter((p) => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().split(' ').some((word) => word.startsWith(q));
  });

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
    setSentTo(null);
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

  // Solo guarda el nombre del paciente en el historial. NO lo envía.
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

  // Envía de verdad el análisis al paciente (esto sí lo hace aparecer en Mis Análisis del paciente).
  const handleConfirmSend = () => {
    if (!recordId || !selectedPatient) return;
    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    const updated = historial.map((r) =>
      r.id === recordId
        ? { ...r, patientEmail: selectedPatient.email, patientName: selectedPatient.name, sentToPatient: true }
        : r
    );
    localStorage.setItem('melascan_historial', JSON.stringify(updated));
    setLocked(true);
    setConfirmingSend(false);
    setSentTo(selectedPatient.name);
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="scanner-grid">
          <div className="lesion-panel">
            <div className="panel-header">
              <span>Análisis de imagen de la Lesión</span>
              <span className="format-badge">JPG/PNG</span>
            </div>

            <label htmlFor="fileInput">
              <div
                className={`dropzone${dragging ? ' drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {preview ? (
                  <img src={preview} alt="Vista previa del lunar" />
                ) : (
                  <>
                    <div className="dz-text">Arrastre la imagen o súbala aquí</div>
                    <div className="dz-sub">Revise las recomendaciones de imagen</div>
                    <span className="btn-secondary dz-select-btn">Seleccionar archivo</span>
                  </>
                )}
              </div>
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
              disabled={!file || analyzing || hasResult}
              onClick={handleAnalyze}
            >
              {analyzing ? 'Analizando…' : hasResult ? 'Análisis guardado ✓' : 'Analizar lunar'}
            </button>

            <button className="collapsible-toggle" onClick={() => setShowTips((s) => !s)}>
              Recomendaciones para la imagen {showTips ? '▲' : '▼'}
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

          <div className="result-panel">
            {!hasResult ? (
              <div className="result-empty">
                <h3>Resultado de diagnóstico</h3>
                <p>Suba una imagen o arrástrela en el seleccionador de la izquierda para que sea analizada y ver los resultados.</p>
              </div>
            ) : (
              <>
                <div className="result-top">
                  <span className="risk-badge risk-pending"><span className="dot" />Riesgo —</span>
                  <span className="prob-value">Riesgo IA: —%</span>
                </div>

                <div className="result-block-section">
                  <h4>Clasificación a partir del criterio ABCDE</h4>
                  <div className="abcde-mini-grid">
                    {ABCDE_CRITERIA.map((c) => (
                      <div className="abcde-mini-card" key={c.letter}>
                        <span className="abcde-mini-letter">{c.letter}</span>
                        <span className="abcde-mini-title">{c.title}</span>
                        <span className="abcde-mini-value">—</span>
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
                  <div className="inline-form-row">
                    <input
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setDescriptionSaved(false); }}
                      placeholder="Ej: Lunar en brazo derecho"
                    />
                    <button className="btn-secondary" onClick={handleSaveDescription}>Guardar</button>
                  </div>
                  {descriptionSaved && <span className="sent-confirm">Guardado en el historial ✓</span>}
                </div>

                <div className="result-block-section">
                  <h4>Paciente</h4>

                  {allPatients.length === 0 ? (
                    <p className="form-hint">Todavía no hay pacientes registrados en el sistema.</p>
                  ) : locked ? (
                    <span className="sent-confirm">Enviado a {sentTo} ✓</span>
                  ) : confirmingSend && selectedPatient ? (
                    <div className="confirm-send-box">
                      <p>¿Enviar este análisis a <strong>{selectedPatient.name}</strong>?</p>
                      <div className="confirm-send-actions">
                        <button className="btn-secondary" onClick={() => setConfirmingSend(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleConfirmSend}>Confirmar envío</button>
                      </div>
                    </div>
                  ) : !selectedPatient ? (
                    <div className="searchable-select">
                      <input
                        value={patientQuery}
                        onChange={(e) => setPatientQuery(e.target.value)}
                        onFocus={() => setShowPatientDropdown(true)}
                        onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                        placeholder="Elegí un paciente…"
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
                                }}
                              >
                                {p.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="selected-patient-row">
                        <span>Paciente elegido: <strong>{selectedPatient.name}</strong></span>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => { setSelectedPatient(null); setPatientQuery(''); setPatientSaved(false); }}
                        >
                          Cambiar
                        </button>
                      </div>
                      <div className="patient-actions-row">
                        <button className="btn-secondary" onClick={handleSavePatient}>Guardar</button>
                        <button className="btn-primary" onClick={() => setConfirmingSend(true)}>Enviar</button>
                      </div>
                      {patientSaved && <span className="sent-confirm">Guardado en el historial ✓</span>}
                    </div>
                  )}
                </div>

                <div className="disclaimer">
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