import { Link, useLocation } from 'react-router-dom';

type Role = 'medico' | 'paciente';

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
  const role = (localStorage.getItem('melascan_role') as Role) || 'paciente';
  const items = role === 'medico' ? NAV_MEDICO : NAV_PACIENTE;

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

      <div className="sidebar-user">
        <span className="sidebar-avatar" />
        <span>Nombre de usuario</span>
      </div>
    </aside>
  );
}