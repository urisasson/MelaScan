import { useState } from 'react';
import Login from './Login';
import Register from './Register';

type ModalMode = 'login' | 'register' | null;
type Role = 'paciente' | 'medico';

const FEATURES = [
  { icon: '🔒', title: 'Autenticación de usuario', text: 'Registro e inicio de sesión seguro para médicos y pacientes.' },
  { icon: '🔍', title: 'Scanner con IA', text: 'Análisis automático de imágenes de lunares para estimar su nivel de riesgo.' },
  { icon: '📷', title: 'Carga de imágenes', text: 'Subí fotos de lunares en formato JPG o PNG directo desde tu dispositivo.' },
  { icon: '🚦', title: 'Resultados y triaje', text: 'Nivel de riesgo por semáforo, con recomendación de cuándo consultar a un dermatólogo.' },
  { icon: '🕓', title: 'Historial de consultas', text: 'Seguimiento en el tiempo de todos los análisis realizados.' },
];

export default function Inicio() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalRole, setModalRole] = useState<Role>('paciente');
  const [openDropdown, setOpenDropdown] = useState<'register' | null>(null);

  const openRegister = (role: Role) => {
    setModalRole(role);
    setModalMode('register');
    setOpenDropdown(null);
  };

  return (
    // Tocar en cualquier lado de la página cierra el dropdown de "Registrarse".
    <div className="landing-page" onClick={() => setOpenDropdown(null)}>
      <nav className="site-nav">
        <span className="nav-brand">MelaScan</span>

        <div className="nav-actions">
          <button
            className="btn-secondary"
            onClick={() => { setOpenDropdown(null); setModalMode('login'); }}
          >
            Iniciar Sesión
          </button>

          {/* stopPropagation acá para que abrir/usar este dropdown no dispare el cierre del onClick de arriba */}
          <div className="auth-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-primary"
              onClick={() => setOpenDropdown(openDropdown === 'register' ? null : 'register')}
            >
              Registrarse
            </button>
            {openDropdown === 'register' && (
              <div className="auth-dropdown">
                <button onClick={() => openRegister('paciente')}>Como paciente</button>
                <button onClick={() => openRegister('medico')}>Como médico</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="hero-wrap">
        <div className="hero-grid">
          <div className="hero-def">
            <h1>Detección temprana de melanoma, asistida por IA.</h1>
            <p>
              MelaScan analiza fotos de lunares y estima su nivel de riesgo, ayudando a
              médicos a priorizar consultas y a pacientes a hacer seguimiento junto a
              su especialista.
            </p>
          </div>
          <div className="hero-purpose">
            <h2>Propósito del proyecto</h2>
            <div className="purpose-item">
              <h3>El problema</h3>
              <p>El melanoma es un cáncer de piel agresivo pero tratable si se detecta a tiempo, y muchas personas tardan en consultar a un dermatólogo.</p>
            </div>
            <div className="purpose-item">
              <h3>Solución que busca MelaScan</h3>
              <p>Un análisis rápido y objetivo que ayuda a decidir con más claridad cuándo es momento de consultar.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Funcionalidades</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        MelaScan es una herramienta de apoyo y no reemplaza el diagnóstico médico.
      </footer>

      {modalMode === 'login' && (
        <Login onClose={() => setModalMode(null)} onSwitchToRegister={() => setModalMode('register')} />
      )}
      {modalMode === 'register' && (
        <Register
          initialRole={modalRole}
          onClose={() => setModalMode(null)}
          onSwitchToLogin={() => setModalMode('login')}
        />
      )}
    </div>
  );
}