import { Link } from 'react-router-dom';

// Pantalla de Inicio - ruta "/"
export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <span className="eyebrow">Screening asistido por IA</span>
        <h1>Detección temprana de melanoma, más simple para vos y tu equipo médico.</h1>
        <p>
          MelaScan ayuda a los médicos a priorizar consultas dermatológicas y a los
          pacientes a hacer seguimiento de sus lunares junto a su especialista.
        </p>
        <div className="landing-actions">
          <Link to="/login" className="btn-primary">Iniciar sesión</Link>
          <Link to="/register" className="btn-secondary">Crear cuenta</Link>
        </div>
        <p className="landing-note">
          MelaScan es una herramienta de apoyo y no reemplaza el diagnóstico médico.
        </p>
      </div>
    </div>
  );
}