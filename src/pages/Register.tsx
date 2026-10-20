import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  password: string;
  role: 'medico' | 'paciente';
  specialty?: string;
  dni?: string;
  assignedDoctorEmail?: string;
  assignedDoctorEmails?: string[];
}

interface Props {
  initialRole?: 'paciente' | 'medico';
  onClose: () => void;
  onSwitchToLogin: () => void;
}

// Saca tildes y pasa a minúscula, para que "pe" encuentre "Pérez"
function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ¿Alguna palabra (nombre o apellido) empieza con lo que escribiste?
function matchesWordStart(text: string, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(text).split(' ').some((word) => word.startsWith(q));
}

// Muestra el nombre completo, con en negrita solo el principio de la palabra que coincide
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

function getAssignedDoctors(u: StoredUser): string[] {
  if (u.assignedDoctorEmails) return u.assignedDoctorEmails;
  return u.assignedDoctorEmail ? [u.assignedDoctorEmail] : [];
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

  // Solo médico
  const [specialty, setSpecialty] = useState('');
  const [myPatientEmails, setMyPatientEmails] = useState<string[]>([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  // Solo paciente
  const [dni, setDni] = useState('');

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const raw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = raw ? JSON.parse(raw) : [];
  const patients = users.filter((u) => u.role === 'paciente').sort((a, b) => a.name.localeCompare(b.name));

  const chosenPatients = myPatientEmails
    .map((patientEmail) => patients.find((p) => p.email === patientEmail))
    .filter((p): p is StoredUser => !!p);

  // Solo se ofrecen los pacientes que todavía no elegiste
  const filteredPatients = patients.filter(
    (p) => !myPatientEmails.includes(p.email) && matchesWordStart(p.name, patientQuery)
  );

  const openDropdown = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setShowPatientDropdown(true);
  };

  const closeDropdownSoon = () => {
    blurTimeoutRef.current = window.setTimeout(() => setShowPatientDropdown(false), 150);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: reemplazar todo esto por POST /api/auth/register al backend de Franco.
    // Por ahora las cuentas se guardan en localStorage, sin encriptar la contraseña.

    if (users.some((u) => u.email === email)) {
      setError('Ya existe una cuenta con ese email.');
      return;
    }

    if (role === 'paciente' && !/^\d{8}$/.test(dni)) {
      setError('El DNI tiene que tener 8 números.');
      return;
    }

    const newUser: StoredUser =
      role === 'medico'
        ? { name, email, password, role, specialty }
        : { name, email, password, role, dni, assignedDoctorEmails: [] };

    // Si es médico, los pacientes que eligió quedan asignados a él (y les aparece el chat)
    const updatedUsers =
      role === 'medico'
        ? users.map((u) => {
            if (!myPatientEmails.includes(u.email)) return u;
            const assigned = getAssignedDoctors(u);
            return assigned.includes(email) ? u : { ...u, assignedDoctorEmails: [...assigned, email] };
          })
        : users;

    localStorage.setItem('melascan_users', JSON.stringify([...updatedUsers, newUser]));
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
            <>
              <label className="field">
                <span>Especialidad</span>
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                />
              </label>

              <div className="field">
                <span>Tus pacientes</span>
                {patients.length === 0 ? (
                  <p className="form-hint">Todavía no hay pacientes registrados. Podés agregarlos más adelante.</p>
                ) : (
                  <div className="searchable-select">
                    <div className="chips-input-box" onClick={() => patientInputRef.current?.focus()}>
                      {chosenPatients.map((p) => (
                        <span className="doctor-chip" key={p.email}>
                          {p.name}
                          <button
                            type="button"
                            className="chip-remove"
                            aria-label={`Quitar a ${p.name}`}
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setMyPatientEmails((prev) => prev.filter((x) => x !== p.email));
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <input
                        ref={patientInputRef}
                        value={patientQuery}
                        onChange={(e) => { setPatientQuery(e.target.value); openDropdown(); }}
                        onFocus={openDropdown}
                        onBlur={closeDropdownSoon}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        placeholder={chosenPatients.length === 0 ? 'Buscar paciente por nombre…' : ''}
                      />
                    </div>
                    {showPatientDropdown && (
                      <div className="searchable-dropdown">
                        {filteredPatients.length === 0 ? (
                          <div className="searchable-empty">Sin resultados</div>
                        ) : (
                          filteredPatients.map((p) => (
                            <button
                              key={p.email}
                              type="button"
                              onMouseDown={(ev) => {
                                ev.preventDefault();
                                setMyPatientEmails((prev) => [...prev, p.email]);
                                setPatientQuery('');
                              }}
                            >
                              <HighlightMatch text={p.name} query={patientQuery} />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <label className="field">
              <span>DNI</span>
              <input
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                inputMode="numeric"
                minLength={8}
                maxLength={8}
                required
              />
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