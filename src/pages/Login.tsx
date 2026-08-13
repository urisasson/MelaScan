import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  initialRole?: 'paciente' | 'medico';
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ initialRole = 'paciente', onClose, onSwitchToRegister }: Props) {
  const [role, setRole] = useState<'paciente' | 'medico'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // TODO: reemplazar por la llamada real al backend de Franco
    // const res = await fetch('http://localhost:3000/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!res.ok) { setError('Email o contraseña incorrectos'); setLoading(false); return; }
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
        <h2>Iniciar Sesión</h2>

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
            <span>Correo electrónico</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Un momento…' : 'Continuar'}
          </button>
        </form>

        <p className="auth-switch">
          ¿No tenés una cuenta?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToRegister}>
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}