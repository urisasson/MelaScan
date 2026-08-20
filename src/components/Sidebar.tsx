import { Link, useNavigate, useLocation } from 'react-router-dom';

interface Session {
  name: string;
  role: 'medico' | 'paciente';
}

const NAV_MEDICO = [
  { label: 'Scaner IA', path: '/home' },
  { label: 'Historial', path: '/historial' },
  { label: 'Criterio ABCDE', path: '/abcde' },
  { label: 'Chats', path: '/chats' },
];

const NAV_PACIENTE = [
  { label: 'Mis Análisis', path: '/mis-analisis' },
  { label: 'Criterio ABCDE', path: '/abcde' },
  { label: 'Chats', path: '/chats' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const raw = localStorage.getItem('melascan_session');
  const session: Session | null = raw ? JSON.parse(raw) : null;
  const items = session?.role === 'medico' ? NAV_MEDICO : NAV_PACIENTE;

  const handleLogout = () => {
    localStorage.removeItem('melascan_session');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Logo</div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link${location.pathname === item.path ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button className="sidebar-logout-btn" onClick={handleLogout}>Cerrar sesión</button>

      <div className="sidebar-user">
        <span className="sidebar-avatar" />
        <span>{session?.name ?? 'Nombre de usuario'}</span>
      </div>
    </aside>
  );
}