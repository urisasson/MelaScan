import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'medico' | 'paciente'>('medico');
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
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>
        <p className="auth-sub">Accedé a tu cuenta de MelaScan.</p>

        <label className="field">
          <span>Soy</span>
          <div className="role-toggle">
            <button type="button" className={role === 'medico' ? 'active' : ''} onClick={() => setRole('medico')}>
              Médico
            </button>
            <button type="button" className={role === 'paciente' ? 'active' : ''} onClick={() => setRole('paciente')}>
              Paciente
            </button>
          </div>
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="auth-switch">¿No tenés cuenta? <Link to="/register">Registrate</Link></p>
      </form>
    </div>
  );
}