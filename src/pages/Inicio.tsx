import { useState } from 'react';
import Login from './Login';
import Register from './Register';

type ModalMode = 'login' | 'register' | null;
type Role = 'paciente' | 'medico';

const FEATURES = [
  { num: '01', title: 'Sistema de Autenticación', text: 'Permitirá el registro e inicio de sesión seguro y diferenciado para pacientes y médicos.' },
  { num: '02', title: 'Carga de Imágenes', text: 'Soporte para subir o capturar fotografías de lunares en formatos JPG o PNG con control de calidad.' },
  { num: '03', title: 'Inteligencia Artificial', text: 'Análisis automatizado por red neuronal, clasificando la lesión con un porcentaje de probabilidad.' },
  { num: '04', title: 'Resultados y Triaje', text: 'Semáforo visual (Verde, Amarillo y Rojo) con advertencia médica y recomendación de consulta.' },
  { num: '05', title: 'Historial de Consultas', text: 'Registro cronológico de evaluaciones guardadas para seguimiento dermatológico continuo.' },
];

const FAQS = [
  {
    q: '¿MelaScan reemplaza la consulta con un dermatólogo?',
    a: 'No. MelaScan es una herramienta de apoyo al triaje: te ayuda a priorizar cuándo consultar, pero el diagnóstico definitivo siempre lo da un profesional de la salud.',
  },
  {
    q: '¿Qué pasa si el resultado me da riesgo alto?',
    a: 'La app te va a recomendar consultar a un dermatólogo lo antes posible. El resultado es orientativo, no reemplaza una biopsia ni un diagnóstico clínico.',
  },
  {
    q: '¿Mis fotos y datos están seguros?',
    a: 'Sí, tus imágenes y análisis solo son visibles para vos y tu médico asignado.',
  },
  {
    q: '¿Necesito ser médico para usar MelaScan?',
    a: 'No. Cualquier persona puede registrarse como paciente. Los médicos tienen su propia cuenta con funciones adicionales, como el escáner y el envío de análisis.',
  },
];

function LogoMark() {
  return (
    <span className="logo-badge">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <line x1="15.2" y1="15.2" x2="21" y2="21" />
      </svg>
    </span>
  );
}

export default function Inicio() {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalRole, setModalRole] = useState<Role>('paciente');
  const [openDropdown, setOpenDropdown] = useState<'register' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openRegister = (role: Role) => {
    setModalRole(role);
    setModalMode('register');
    setOpenDropdown(null);
  };

  return (
    <div className="landing-page" onClick={() => setOpenDropdown(null)}>
      <header className="site-header">
        <nav className="site-nav">
          <div className="nav-brand">
            <LogoMark />
            MelaScan
          </div>

          <div className="nav-actions">
            <button
              className="btn-nav-login"
              onClick={() => { setOpenDropdown(null); setModalMode('login'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              Iniciar Sesión
            </button>

            <div className="auth-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
            <button
                className="btn-nav-register"
                onClick={() => setOpenDropdown(openDropdown === 'register' ? null : 'register')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="16" y1="11" x2="22" y2="11" />
                </svg>
                Registrarse
                <svg className="chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
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
      </header>

      <section className="hero-band">
        <div className="hero-inner">
          <div className="hero-grid">
            <div className="hero-def">
              <h1>Detección temprana de <span className="highlight">melanoma</span> asistida por IA.</h1>
              <p>
                Plataforma inteligente que analiza fotografías dermatológicas de lunares para estimar
                rápidamente su nivel de riesgo. Diseñada como un sistema de apoyo para agilizar el triaje
                médico y la prevención del cáncer de piel.
              </p>
            </div>

            <div className="hero-purpose">
              <h2>Propósito del Proyecto</h2>
              <div className="purpose-cards">
              <div className="purpose-card purpose-challenge">
                <h3><span className="purpose-icon">♥</span> El Desafío Clínico</h3>
                <p>
                    El melanoma es un cáncer de piel agresivo cuya supervivencia supera el 95% si se
                    detecta a tiempo. Sin embargo, la falta de controles preventivos y las largas esperas
                    dermatológicas retrasan la atención oportuna, convirtiendo la detección temprana en
                    un desafío crítico.
                  </p>
                </div>
                <div className="purpose-card purpose-solution">
                <h3><span className="purpose-icon">✓</span> La Solución MelaScan</h3>
                <p>
                    Desarrollamos una plataforma web con Inteligencia Artificial que analiza imágenes de
                    lunares en segundos. Evalúa patrones visuales complejos, calcula el nivel de riesgo y
                    genera reportes claros para agilizar el triaje y priorizar la atención médica de casos
                    sospechosos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-band">
        <div className="features-inner">
          <h2>Partes y Funcionalidades del Sistema</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.num}>
                <span className="feature-number">{f.num}</span>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-band">
        <div className="faq-inner">
          <h2>Dudas Existenciales</h2>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <div className="faq-item" key={item.q}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="faq-question-left">
                    <span className="faq-icon">¿?</span>
                    <span>{item.q}</span>
                  </span>
                  <span className="faq-chevron">{openFaq === i ? '⌄' : '›'}</span>
                </button>
                {openFaq === i && <p className="faq-answer">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">
              <LogoMark />
              MelaScan
            </div>
            <p className="footer-team">
              MelaScan • Uriel Sasson, Ivan Rajmilovich, Ezequiel Zwiebel, Franco Caruso.
            </p>
            <p className="footer-contact">Contáctanos: MelaScan@gmail.com</p>
          </div>
          <div className="footer-disclaimer-block">
            <p>MelaScan es un sistema de apoyo al diagnóstico y triaje.</p>
            <p>No emite diagnósticos definitivos ni sustituye la evaluación de un profesional de la salud.</p>
          </div>
        </div>
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