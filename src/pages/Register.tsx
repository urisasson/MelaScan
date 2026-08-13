import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // TODO: reemplazar por la llamada real al backend de Franco
    // const res = await fetch('http://localhost:3000/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, email, password, role, specialty, assignedDoctor }),
    // });
    // if (!res.ok) { setError('No se pudo crear la cuenta'); setLoading(false); return; }
    // const data = await res.json();
    // localStorage.setItem('melascan_token', data.token);

    localStorage.setItem('melascan_role', role);
    setLoading(false);
    navigate('/home');
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
              <input value={assignedDoctor} onChange={(e) => setAssignedDoctor(e.target.value)} placeholder="Ej: Dra. Sofía Molina" />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Un momento…' : 'Continuar'}
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