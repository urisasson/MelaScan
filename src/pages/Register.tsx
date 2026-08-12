import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'medico' | 'paciente'>('paciente');
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
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="auth-sub">Registrate como médico o como paciente.</p>

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
          <span>Nombre completo</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label className="field">
          <span>Email</span>
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
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-switch">¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
      </form>
    </div>
  );
}