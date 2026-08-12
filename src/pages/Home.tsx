import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const loadFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setHasResult(false);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    loadFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);

    // TODO: reemplazar por la llamada real a la API de IA (FastAPI) de Ezequiel
    // const formData = new FormData();
    // formData.append('image', file);
    // const res = await fetch('http://localhost:8000/analizar', { method: 'POST', body: formData });
    // const data = await res.json();
    // acá se van a usar los datos reales: data.risk, data.probability, data.triage, data.criteria

    setAnalyzing(false);
    setHasResult(true);
  };

  return (
    <div className="page">
      <div className="page-head">
        <span className="eyebrow">Scanner</span>
        <h1>Subí una foto del lunar</h1>
        <p>Cuanto mejor sea la foto, más confiable el análisis.</p>
      </div>

      <div className="analyze-panel">
        <div>
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
                  <div className="dz-icon">+</div>
                  <div className="dz-text">Arrastrá tu imagen o tocá para elegir</div>
                  <div className="dz-sub">JPG o PNG · máx. 10MB</div>
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
        </div>

        <div>
          <div className="guidelines">
            <div className="guideline"><span className="dot" />Usá luz natural, evitá sombras duras.</div>
            <div className="guideline"><span className="dot" />Enfocá bien y evitá el movimiento.</div>
            <div className="guideline"><span className="dot" />Incluí una referencia de escala si es posible.</div>
          </div>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!file || analyzing}
            onClick={handleAnalyze}
          >
            {analyzing ? 'Analizando…' : 'Analizar lunar'}
          </button>
        </div>
      </div>

      {hasResult && (
        <div className="result-block">
          <div className="result-grid">
            <div className="result-thumb">
              {preview && <img src={preview} alt="Lunar analizado" />}
            </div>
            <div>
              <span className="risk-badge risk-pending">
                <span className="dot" />
                Riesgo —
              </span>
              <span className="prob-value">Probabilidad estimada: —%</span>

              <div className="result-cards">
                <div className="result-card">
                  <div className="label">Triage sugerido</div>
                  <div className="value">—</div>
                </div>
                <div className="result-card">
                  <div className="label">Criterios detectados</div>
                  <div className="value">—</div>
                </div>
              </div>

              <div className="disclaimer">
                Este panel muestra la estructura del resultado. Los valores reales van a
                aparecer acá una vez que conectemos la API de IA.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}