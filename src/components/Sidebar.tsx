import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  specialty?: string;
  photoDataUrl?: string;
}

function IconScanner() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconHistory() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

const NAV_MEDICO = [
  { label: 'Scaner IA', path: '/home', icon: <IconScanner /> },
  { label: 'Historial', path: '/historial', icon: <IconHistory /> },
  { label: 'Criterio ABCDE', path: '/abcde', icon: <IconClipboard /> },
  { label: 'Chats', path: '/chats', icon: <IconChat /> },
];

const NAV_PACIENTE = [
  { label: 'Mis Análisis', path: '/mis-analisis', icon: <IconHistory /> },
  { label: 'Criterio ABCDE', path: '/abcde', icon: <IconClipboard /> },
  { label: 'Chats', path: '/chats', icon: <IconChat /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const sessionRaw = localStorage.getItem('melascan_session');
  const sessionEmail = sessionRaw ? (JSON.parse(sessionRaw) as StoredUser).email : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const currentUser = users.find((u) => u.email === sessionEmail) ?? null;

  const items = currentUser?.role === 'medico' ? NAV_MEDICO : NAV_PACIENTE;
  const subtitle = currentUser?.role === 'medico' ? (currentUser.specialty || 'Médico') : 'Paciente';

  const handleLogout = () => {
    localStorage.removeItem('melascan_session');
    navigate('/');
  };

  const updatePhoto = (photoDataUrl: string | undefined) => {
    if (!sessionEmail) return;
    const updatedUsers = users.map((u) => (u.email === sessionEmail ? { ...u, photoDataUrl } : u));
    localStorage.setItem('melascan_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('storage'));
    navigate(location.pathname, { replace: true });
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updatePhoto(ev.target?.result as string);
      setMenuOpen(false);
    };
    reader.readAsDataURL(f);
  };

  const handleRemovePhoto = () => {
    updatePhoto(undefined);
    setMenuOpen(false);
  };

  const handleNavClick = (path: string) => {
    if (location.pathname === path) {
      window.dispatchEvent(new CustomEvent('melascan-nav-reset', { detail: { path } }));
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="MelaScan" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => handleNavClick(item.path)}
            className={`sidebar-link${location.pathname === item.path ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-user">
        <button className="sidebar-user-btn" onClick={() => setMenuOpen((o) => !o)}>
          {currentUser?.photoDataUrl ? (
            <img src={currentUser.photoDataUrl} alt="Foto de perfil" className="avatar-img" />
          ) : (
            <span className="avatar-placeholder">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </span>
          )}
          <span className="sidebar-user-text">
            <span className="sidebar-user-name">{currentUser?.name ?? 'Nombre de usuario'}</span>
            <span className="sidebar-user-subtitle">{subtitle}</span>
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="profile-menu-overlay" onClick={() => setMenuOpen(false)} />
            <div className="profile-menu">
              <label>
                Cambiar foto
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </label>
              {currentUser?.photoDataUrl && (
                <button type="button" onClick={handleRemovePhoto}>Quitar foto</button>
              )}
              <button type="button" className="danger" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}