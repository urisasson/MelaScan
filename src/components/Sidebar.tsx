import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  specialty?: string;
  photoDataUrl?: string;
  assignedDoctorEmail?: string;
  assignedDoctorEmails?: string[];
}

// Soporta cuentas viejas (un solo médico) y nuevas (varios médicos)
function getAssignedDoctors(u: StoredUser): string[] {
  if (u.assignedDoctorEmails) return u.assignedDoctorEmails;
  return u.assignedDoctorEmail ? [u.assignedDoctorEmail] : [];
}

// ¿Hay algún chat visible con mensajes sin leer?
function hasUnreadChats(me: StoredUser): boolean {
  const prefix = 'melascan_chat_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix) || key.startsWith(prefix + 'lastread_')) continue;

    const id = key.slice(prefix.length);
    const sep = id.indexOf('__');
    if (sep === -1) continue;
    const doctorEmail = id.slice(0, sep);
    const patientEmail = id.slice(sep + 2);
    const isMine = me.role === 'medico' ? doctorEmail === me.email : patientEmail === me.email;
    if (!isMine) continue;
    if (localStorage.getItem(`melascan_hidden_${id}_${me.email}`) === '1') continue;

    const messages: { senderRole: string; timestamp?: number }[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    const clearedRaw = localStorage.getItem(`melascan_cleared_${id}_${me.email}`);
    const clearedAt = clearedRaw ? parseInt(clearedRaw, 10) : 0;
    const lastReadRaw = localStorage.getItem(`${prefix}lastread_${id}_${me.email}`);
    const lastReadCount = lastReadRaw ? parseInt(lastReadRaw, 10) : 0;

    const unread = messages
      .slice(lastReadCount)
      .filter((m) => m.senderRole !== me.role && (!clearedAt || (m.timestamp ?? 0) > clearedAt)).length;
    if (unread > 0) return true;
  }
  return false;
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

// Ventana "Editar médicos" (solo pacientes). Los cambios se aplican recién al tocar "Guardar".
function EditDoctorsModal({
  patientEmail,
  onClose,
  onSaved,
}: {
  patientEmail: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const me = users.find((u) => u.email === patientEmail);
  const initialEmails = me ? getAssignedDoctors(me) : [];

  const [draftEmails, setDraftEmails] = useState<string[]>(initialEmails);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!me) return null;

  const doctors = users.filter((u) => u.role === 'medico');
  const chosenDoctors = draftEmails
    .map((email) => doctors.find((d) => d.email === email))
    .filter((d): d is StoredUser => !!d);

  // No se ofrecen los médicos que ya están en la lista
  const availableDoctors = doctors
    .filter((d) => !draftEmails.includes(d.email))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((d) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return d.name.toLowerCase().split(' ').some((word) => word.startsWith(q));
    });

  const hasChanges =
    draftEmails.length !== initialEmails.length || draftEmails.some((e) => !initialEmails.includes(e));

  const handleSave = () => {
    const removed = initialEmails.filter((e) => !draftEmails.includes(e));
    const added = draftEmails.filter((e) => !initialEmails.includes(e));

    // Médico quitado: se oculta el chat (si él te vuelve a escribir, reaparece)
    removed.forEach((d) => localStorage.setItem(`melascan_hidden_${d}__${patientEmail}_${patientEmail}`, '1'));
    // Médico agregado: el chat vuelve a estar visible
    added.forEach((d) => localStorage.removeItem(`melascan_hidden_${d}__${patientEmail}_${patientEmail}`));

    const updated = users.map((u) => (u.email === patientEmail ? { ...u, assignedDoctorEmails: draftEmails } : u));
    localStorage.setItem('melascan_users', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    onSaved();
  };

  const handleCloseClick = () => {
    if (hasChanges) setConfirmExit(true);
    else onClose();
  };

  return createPortal(
    <>
      <div className="modal-backdrop">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={handleCloseClick} aria-label="Cerrar">✕</button>
          <h2>Edita tus médicos asignados</h2>

          <div className="field">
            <span>Médicos asignados</span>
            <div className="chips-input-box chips-box-static">
              {chosenDoctors.length === 0 ? (
                <span className="form-hint">No tenés médicos asignados.</span>
              ) : (
                chosenDoctors.map((d) => (
                  <span className="doctor-chip" key={d.email}>
                    {d.name}
                    <button
                      type="button"
                      className="chip-remove"
                      aria-label={`Quitar a ${d.name}`}
                      onClick={() => setDraftEmails((prev) => prev.filter((x) => x !== d.email))}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="field">
            <span>Agregar médico</span>
            <div className="searchable-select">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Buscar por el nombre del médico"
              />
              {showDropdown && (
                <div className="searchable-dropdown">
                  {availableDoctors.length === 0 ? (
                    <div className="searchable-empty">Sin resultados</div>
                  ) : (
                    availableDoctors.map((d) => (
                      <button
                        key={d.email}
                        type="button"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          setDraftEmails((prev) => [...prev, d.email]);
                          setQuery('');
                        }}
                      >
                        {d.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <button type="button" className="btn-primary auth-submit" onClick={handleSave} disabled={!hasChanges}>
            Guardar
          </button>
        </div>
      </div>

      {confirmExit && (
        <div className="modal-backdrop confirm-backdrop">
          <div className="modal-card confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>Tus cambios no serán guardados</h3>
            <p>
              Si deseas guardar tus cambios, toca <strong>"cancelar"</strong>.<br />
              Si deseas continuar sin guardarlos, toca <strong>"continuar"</strong>.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn-outline" onClick={() => setConfirmExit(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={onClose}>Continuar</button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDoctorsOpen, setEditDoctorsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Si cambia algo guardado (mensaje nuevo, chat leído, etc.) se vuelve a calcular el puntito
  useEffect(() => {
    const handler = () => setTick((n) => n + 1);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const sessionRaw = localStorage.getItem('melascan_session');
  const sessionEmail: string | null = sessionRaw ? (JSON.parse(sessionRaw) as { email: string }).email : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const currentUser = users.find((u) => u.email === sessionEmail) ?? null;

  const items = currentUser?.role === 'medico' ? NAV_MEDICO : NAV_PACIENTE;
  const subtitle = currentUser?.role === 'medico' ? (currentUser.specialty || 'Médico') : 'Paciente';
  const hasUnread = currentUser ? hasUnreadChats(currentUser) : false;

  // Pantalla principal según el rol: el logo lleva ahí
  const homePath = currentUser?.role === 'medico' ? '/home' : '/mis-analisis';

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2500);
  };

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
      <Link
        to={homePath}
        className="sidebar-logo"
        onClick={(e) => { if (location.pathname === homePath) e.preventDefault(); }}
      >
        <img src="/logo.png" alt="MelaScan" className="sidebar-logo-img" />
      </Link>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => handleNavClick(item.path)}
            className={`sidebar-link${location.pathname === item.path ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon-wrap">
              {item.icon}
              {item.label === 'Chats' && hasUnread && <span className="sidebar-notif-dot" />}
            </span>
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
              {currentUser?.photoDataUrl && (
                <button type="button" className="danger" onClick={handleRemovePhoto}>Eliminar foto</button>
              )}
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
              {currentUser?.role === 'paciente' && (
                <button type="button" onClick={() => { setMenuOpen(false); setEditDoctorsOpen(true); }}>
                  Editar médicos
                </button>
              )}
              <div className="profile-menu-divider" />
              <button type="button" className="danger" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>

      {editDoctorsOpen && currentUser && (
        <EditDoctorsModal
          patientEmail={currentUser.email}
          onClose={() => setEditDoctorsOpen(false)}
          onSaved={() => { setEditDoctorsOpen(false); showToast('Cambios guardados'); }}
        />
      )}

      {toast && createPortal(<div className="toast">{toast}</div>, document.body)}
    </aside>
  );
}