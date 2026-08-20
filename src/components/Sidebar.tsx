import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  photoDataUrl?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const sessionRaw = localStorage.getItem('melascan_session');
  const sessionEmail = sessionRaw ? (JSON.parse(sessionRaw) as StoredUser).email : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const currentUser = users.find((u) => u.email === sessionEmail) ?? null;

  const items = currentUser?.role === 'medico' ? NAV_MEDICO : NAV_PACIENTE;

  const handleLogout = () => {
    localStorage.removeItem('melascan_session');
    navigate('/');
  };

  const updatePhoto = (photoDataUrl: string | undefined) => {
    if (!sessionEmail) return;
    const updatedUsers = users.map((u) => (u.email === sessionEmail ? { ...u, photoDataUrl } : u));
    localStorage.setItem('melascan_users', JSON.stringify(updatedUsers));
    // Forzamos refresco de la pantalla para que se vea la foto nueva/quitada
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
          <span>{currentUser?.name ?? 'Nombre de usuario'}</span>
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