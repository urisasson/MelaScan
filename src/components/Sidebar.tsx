import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Scaner IA', path: '/home' },
  { label: 'Historial', path: '/historial' },
  { label: 'Criterio ABCDE', path: '/abcde' },
  { label: 'Chats', path: '/chats' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Logo</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
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