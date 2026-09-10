import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  password: string;
  role: 'medico' | 'paciente';
}

interface Props {
  onClose: () => void;
  onSwitchToRegister: () => void;
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

export default function Login({ onClose, onSwitchToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    <div className="modal-backdrop">
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