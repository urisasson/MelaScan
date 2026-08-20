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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [assignedDoctorEmail, setAssignedDoctorEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const raw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = raw ? JSON.parse(raw) : [];
  const doctors = users.filter((u) => u.role === 'medico');

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
      setError('Elegí un médico asignado.');
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
    <div className="modal-backdrop" onClick={onClose}>
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
                <select value={assignedDoctorEmail} onChange={(e) => setAssignedDoctorEmail(e.target.value)} required>
                  <option value="" disabled>Elegí tu médico…</option>
                  {doctors.map((d) => (
                    <option key={d.email} value={d.email}>{d.name}</option>
                  ))}
                </select>
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