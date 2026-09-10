import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  password: string;
  role: 'medico' | 'paciente';
  specialty?: string;
  assignedDoctorEmail?: string;
}

interface Props {
  initialRole?: 'paciente' | 'medico';
  onClose: () => void;
  onSwitchToLogin: () => void;
}

function PatientIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M12 13.5c-5 0-8.5 2.7-8.5 6.5 0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2 0-3.8-3.5-6.5-8.5-6.5z" />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M12 13.5c-5 0-8.5 2.7-8.5 6.5 0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2 0-3.8-3.5-6.5-8.5-6.5z" />
      <path
        d="M9 14.3c0 1.6 1.1 2.7 3 2.7s3-1.1 3-2.7"
        fill="none"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="9" cy="14.3" r="1.1" fill="white" />
      <circle cx="15" cy="14.3" r="1.1" fill="white" />
      <circle cx="12" cy="18.7" r="1.5" fill="white" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Register({ initialRole = 'paciente', onClose, onSwitchToLogin }: Props) {
  const [role, setRole] = useState<'paciente' | 'medico'>(initialRole);

  const [nameMedico, setNameMedico] = useState('');
  const [namePaciente, setNamePaciente] = useState('');
  const name = role === 'medico' ? nameMedico : namePaciente;
  const setName = role === 'medico' ? setNameMedico : setNamePaciente;

  const [emailMedico, setEmailMedico] = useState('');
  const [emailPaciente, setEmailPaciente] = useState('');
  const email = role === 'medico' ? emailMedico : emailPaciente;
  const setEmail = role === 'medico' ? setEmailMedico : setEmailPaciente;

  const [passwordMedico, setPasswordMedico] = useState('');
  const [passwordPaciente, setPasswordPaciente] = useState('');
  const password = role === 'medico' ? passwordMedico : passwordPaciente;
  const setPassword = role === 'medico' ? setPasswordMedico : setPasswordPaciente;
  const [showPassword, setShowPassword] = useState(false);

  const [specialty, setSpecialty] = useState('');

  const [assignedDoctorEmail, setAssignedDoctorEmail] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const raw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = raw ? JSON.parse(raw) : [];
  const doctors = users.filter((u) => u.role === 'medico').sort((a, b) => a.name.localeCompare(b.name));

  const filteredDoctors = doctors.filter((d) => {
    const q = doctorQuery.trim().toLowerCase();
    if (!q) return true;
    return d.name.toLowerCase().split(' ').some((word) => word.startsWith(q));
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: reemplazar todo esto por POST /api/auth/register al backend de Franco.
    // Por ahora las cuentas se guardan en localStorage, sin encriptar la contraseña.

    if (users.some((u) => u.email === email)) {
      setError('Ya existe una cuenta con ese email.');
      return;
    }

    if (role === 'paciente' && !assignedDoctorEmail) {
      setError('Elegí un médico asignado de la lista.');
      return;
    }

    const newUser: StoredUser = {
      name,
      email,
      password,
      role,
      specialty: role === 'medico' ? specialty : undefined,
      assignedDoctorEmail: role === 'paciente' ? assignedDoctorEmail : undefined,
    };

    localStorage.setItem('melascan_users', JSON.stringify([...users, newUser]));
    localStorage.setItem('melascan_session', JSON.stringify(newUser));

    navigate(role === 'medico' ? '/home' : '/mis-analisis');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2>Registrarse</h2>

        <form onSubmit={handleSubmit}>
          <div className="role-toggle">
            <button type="button" className={role === 'paciente' ? 'active' : ''} onClick={() => setRole('paciente')}>
              <PatientIcon />
              Paciente
            </button>
            <button type="button" className={role === 'medico' ? 'active' : ''} onClick={() => setRole('medico')}>
              <DoctorIcon />
              Médico
            </button>
          </div>

          <label className="field">
            <span>Nombre completo</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)} aria-label="Mostrar contraseña">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          {role === 'medico' ? (
            <label className="field">
              <span>Especialidad</span>
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
              />
            </label>
          ) : (
            <label className="field">
              <span>Médico asignado</span>
              {doctors.length === 0 ? (
                <p className="form-hint">Todavía no hay médicos registrados. Pedile a tu médico que se registre primero.</p>
              ) : (
                <div className="searchable-select">
                  <input
                    value={doctorQuery}
                    onChange={(e) => { setDoctorQuery(e.target.value); setAssignedDoctorEmail(''); }}
                    onFocus={() => setShowDoctorDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDoctorDropdown(false), 150)}
                    placeholder="Buscar médico por nombre…"
                  />
                  {showDoctorDropdown && (
                    <div className="searchable-dropdown">
                      {filteredDoctors.length === 0 ? (
                        <div className="searchable-empty">Sin resultados</div>
                      ) : (
                        filteredDoctors.map((d) => (
                          <button
                            key={d.email}
                            type="button"
                            onMouseDown={() => {
                              setAssignedDoctorEmail(d.email);
                              setDoctorQuery(d.name);
                              setShowDoctorDropdown(false);
                            }}
                          >
                            {d.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary auth-submit">
            Continuar
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tenés una cuenta?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToLogin}>
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
}