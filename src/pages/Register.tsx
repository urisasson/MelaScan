import { useState } from 'react';
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

export default function Register({ initialRole = 'paciente', onClose, onSwitchToLogin }: Props) {
  const [role, setRole] = useState<'paciente' | 'medico'>(initialRole);

  // Nombre: una variable por rol, igual que especialidad/médico asignado,
  // así al cambiar de rol no se mezcla lo que escribiste en el otro.
  const [nameMedico, setNameMedico] = useState('');
  const [namePaciente, setNamePaciente] = useState('');
  const name = role === 'medico' ? nameMedico : namePaciente;
  const setName = role === 'medico' ? setNameMedico : setNamePaciente;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [specialty, setSpecialty] = useState('');

  const [assignedDoctorEmail, setAssignedDoctorEmail] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const [error, setError] = useState('');
  const navigate = useNavigate();

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
          <label className="field">
            <span>Soy</span>
            <div className="role-toggle">
              <button type="button" className={role === 'paciente' ? 'active' : ''} onClick={() => setRole('paciente')}>
                Como Paciente
              </button>
              <button type="button" className={role === 'medico' ? 'active' : ''} onClick={() => setRole('medico')}>
                Como Médico
              </button>
            </div>
          </label>

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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {role === 'medico' ? (
            <label className="field">
              <span>Especialidad</span>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Dermatología clínica" />
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

          <button type="submit" className="btn-primary auth-submit" disabled={role === 'paciente' && doctors.length === 0}>
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