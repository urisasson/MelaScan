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
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onClose, onSwitchToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: reemplazar por POST /api/auth/login al backend de Franco
    const raw = localStorage.getItem('melascan_users');
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];
    const user = users.find((u) => u.email === email);

    if (!user) {
      setError('No encontramos una cuenta con ese email.');
      return;
    }
    if (user.password !== password) {
      setError('Contraseña incorrecta.');
      return;
    }

    localStorage.setItem('melascan_session', JSON.stringify(user));
    navigate(user.role === 'medico' ? '/home' : '/mis-analisis');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary auth-submit">Continuar</button>
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