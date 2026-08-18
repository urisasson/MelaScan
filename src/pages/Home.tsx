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
  patientName?: string;
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
  const [patientId, setPatientId] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

  const loadFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setHasResult(false);
    setRecordId(null);
    setDescription('');
    setDescriptionSaved(false);
    setPatientId('');
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
    if (!file || !preview) return;
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

  const handleSendToPatient = () => {
    if (!recordId || !patientId.trim()) return;
    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    const updated = historial.map((r) =>
      r.id === recordId ? { ...r, sentToPatient: true, patientName: patientId.trim() } : r
    );
    localStorage.setItem('melascan_historial', JSON.stringify(updated));
    setSentTo(patientId.trim());
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
                  <span className="risk-badge risk-pending"><span className="dot" />Riesgo pendiente</span>
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
                      placeholder="Ej: Lunar en brazo derecho, paciente Juan Pérez"
                    />
                    <button className="btn-secondary" onClick={handleSaveDescription}>Guardar</button>
                  </div>
                  {descriptionSaved && <span className="sent-confirm">Guardado en el historial ✓</span>}
                </div>

                <div className="result-block-section">
                  <h4>Enviar análisis a un paciente</h4>
                  <div className="inline-form-row">
                    <input
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="Nombre del paciente"
                    />
                    <button className="btn-primary" onClick={handleSendToPatient}>Enviar</button>
                  </div>
                  {sentTo && <span className="sent-confirm">Enviado a {sentTo} ✓</span>}
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