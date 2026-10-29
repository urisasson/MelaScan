import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface StoredUser {
  name: string;
  email: string;
  password?: string;
  role: 'medico' | 'paciente';
  specialty?: string;
  dni?: string;
  photoDataUrl?: string;
  assignedDoctorEmail?: string;
  assignedDoctorEmails?: string[];
}

interface HistorialRecord {
  doctorEmail?: string;
  doctorName?: string;
  patientEmail?: string;
  patientName?: string;
  sentTo?: { email: string; name: string }[];
  [key: string]: unknown;
}

// Saca tildes y pasa a minúscula, para que "pe" encuentre "Pérez"
function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ¿Alguna palabra (nombre o apellido) empieza con lo que escribiste?
function matchesWordStart(text: string, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(text).split(' ').some((word) => word.startsWith(q));
}

// Muestra el nombre completo, con en negrita solo el principio de la palabra que coincide
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = normalize(query.trim());
  if (!q) return <>{text}</>;
  const t = normalize(text);
  let idx = -1;
  for (let i = 0; i < t.length; i++) {
    if ((i === 0 || t[i - 1] === ' ') && t.startsWith(q, i)) { idx = i; break; }
  }
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="search-hit">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

// Soporta cuentas viejas (un solo médico) y nuevas (varios médicos)
function getAssignedDoctors(u: StoredUser): string[] {
  if (u.assignedDoctorEmails) return u.assignedDoctorEmails;
  return u.assignedDoctorEmail ? [u.assignedDoctorEmail] : [];
}

// DNI con puntos: 11111111 -> 11.111.111
function formatDni(dni: string) {
  return dni ? dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
}

// Si cambiás tu correo, se renombran los chats y sus marcas (leídos, ocultos, vaciados)
function renameEmailInKeys(oldEmail: string, newEmail: string) {
  const escaped = oldEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|_)${escaped}(?=_|$)`, 'g');
  const prefixes = ['melascan_chat_lastread_', 'melascan_hidden_', 'melascan_cleared_', 'melascan_chat_'];

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }

  keys.forEach((k) => {
    const prefix = prefixes.find((p) => k.startsWith(p));
    if (!prefix) return;
    const rest = k.slice(prefix.length);
    const newRest = rest.replace(re, (_m, before: string) => before + newEmail);
    if (newRest === rest) return;
    const value = localStorage.getItem(k);
    if (value !== null) localStorage.setItem(prefix + newRest, value);
    localStorage.removeItem(k);
  });
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
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
function IconIdCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <line x1="13" y1="10" x2="18" y2="10" />
      <line x1="13" y1="14" x2="18" y2="14" />
    </svg>
  );
}
function IconStethoscope() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2v2" />
      <path d="M5 2v2" />
      <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
      <path d="M8 15a6 6 0 0 0 12 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
function IconPencil() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
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

// Cartel "Tus cambios no serán guardados" (se usa en Mi perfil y en Editar pacientes)
function ConfirmDiscard({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  return (
    <div className="modal-backdrop confirm-backdrop">
      <div className="modal-card confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>Tus cambios no serán guardados</h3>
        <p>
          Si deseas guardar tus cambios, toca <strong>"cancelar"</strong>.<br />
          Si deseas continuar sin guardarlos, toca <strong>"continuar"</strong>.
        </p>
        <div className="confirm-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={onContinue}>Continuar</button>
        </div>
      </div>
    </div>
  );
}

// Ventana "Mi perfil": se ve igual que el perfil del chat, y con el lápiz se puede editar
function MyProfileModal({
  email,
  onClose,
  onSaved,
}: {
  email: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const me = users.find((u) => u.email === email);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me?.name ?? '');
  const [newEmail, setNewEmail] = useState(me?.email ?? '');
  const [password, setPassword] = useState(me?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [dni, setDni] = useState(me?.dni ?? '');
  const [specialty, setSpecialty] = useState(me?.specialty ?? '');
  const [photo, setPhoto] = useState<string | undefined>(me?.photoDataUrl);
  // Qué estabas por hacer cuando apareció el cartel de "cambios no guardados"
  const [confirmAction, setConfirmAction] = useState<'close' | 'stopEditing' | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!me) return null;

  const isDoctor = me.role === 'medico';

  const hasChanges =
    name !== me.name ||
    newEmail !== me.email ||
    password !== (me.password ?? '') ||
    photo !== me.photoDataUrl ||
    (isDoctor ? specialty !== (me.specialty ?? '') : dni !== (me.dni ?? ''));


  const resetValues = () => {
    setName(me.name);
    setNewEmail(me.email);
    setPassword(me.password ?? '');
    setDni(me.dni ?? '');
    setSpecialty(me.specialty ?? '');
    setPhoto(me.photoDataUrl);
    setError('');
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  // Lápiz: prende y apaga el modo edición
  const handleTogglePencil = () => {
    if (!editing) { setEditing(true); return; }
    if (hasChanges) setConfirmAction('stopEditing');
    else setEditing(false);
  };

  const handleClose = () => {
    if (hasChanges) setConfirmAction('close');
    else onClose();
  };

  const handleConfirmContinue = () => {
    if (confirmAction === 'close') {
      onClose();
      return;
    }
    resetValues();
    setEditing(false);
    setConfirmAction(null);
  };

  const handleSave = () => {
    setError('');
    const cleanName = name.trim();
    const cleanEmail = newEmail.trim();
    const emailChanged = cleanEmail !== me.email;

    if (!cleanName || !cleanEmail || !password) { setError('Completá todos los campos.'); return; }
    // El correo solo se revisa si lo cambiaste (misma regla que en el Register)
    if (emailChanged && !/^[^\s@]+@[^\s@]+$/.test(cleanEmail)) { setError('El correo no es válido.'); return; }
    if (emailChanged && users.some((u) => u.email === cleanEmail)) {
      setError('Ya existe una cuenta con ese correo.');
      return;
    }
    if (isDoctor && !specialty.trim()) { setError('La especialidad es obligatoria.'); return; }
    if (!isDoctor && !/^\d{8}$/.test(dni)) { setError('El DNI tiene que tener 8 números.'); return; }

    const oldEmail = me.email;
    const updatedMe: StoredUser = {
      ...me,
      name: cleanName,
      email: cleanEmail,
      password,
      photoDataUrl: photo,
      ...(isDoctor ? { specialty: specialty.trim() } : { dni }),
    };

    // Usuarios: mis datos + (si cambié el correo) los pacientes que me tienen asignado
    const updatedUsers = users.map((u) => {
      if (u.email === oldEmail) return updatedMe;
      if (emailChanged && u.role === 'paciente') {
        const assigned = getAssignedDoctors(u);
        if (assigned.includes(oldEmail)) {
          return { ...u, assignedDoctorEmails: assigned.map((d) => (d === oldEmail ? cleanEmail : d)) };
        }
      }
      return u;
    });
    localStorage.setItem('melascan_users', JSON.stringify(updatedUsers));

    // Análisis: se actualizan mi nombre y mi correo donde aparezco
    const histRaw = localStorage.getItem('melascan_historial');
    const historial: HistorialRecord[] = histRaw ? JSON.parse(histRaw) : [];
    const updatedHist = historial.map((r) => {
      const copy = { ...r };
      if (copy.doctorEmail === oldEmail) { copy.doctorEmail = cleanEmail; copy.doctorName = cleanName; }
      if (copy.patientEmail === oldEmail) { copy.patientEmail = cleanEmail; copy.patientName = cleanName; }
      if (copy.sentTo) {
        copy.sentTo = copy.sentTo.map((s) => (s.email === oldEmail ? { email: cleanEmail, name: cleanName } : s));
      }
      return copy;
    });
    localStorage.setItem('melascan_historial', JSON.stringify(updatedHist));

    // Chats: si cambié el correo, se renombran para no perder nada
    if (emailChanged) renameEmailInKeys(oldEmail, cleanEmail);

    localStorage.setItem('melascan_session', JSON.stringify(updatedMe));
    window.dispatchEvent(new Event('storage'));
    onSaved();
  };

  return createPortal(
    <>
      <div className="modal-backdrop">
        <div
          className={`modal-card profile-card my-profile${isDoctor ? ' is-doctor' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`profile-edit-btn${editing ? ' active' : ''}`}
            onClick={handleTogglePencil}
            aria-label={editing ? 'Dejar de editar' : 'Editar perfil'}
          >
            <IconPencil />
          </button>
          <button className="modal-close" onClick={handleClose} aria-label="Cerrar">✕</button>

          <div className="profile-card-header">
            <div className="profile-card-avatar">
              {photo ? (
                <img src={photo} alt="Foto de perfil" />
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="profile-card-name">{name || me.name}</h4>
              <span className="profile-card-sub">{isDoctor ? (specialty || 'Médico') : 'Paciente'}</span>
              {editing && (
                <div className="profile-photo-actions">
                  <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
                    Cambiar foto
                  </button>
                  {photo && (
                    <button type="button" className="link-btn link-danger" onClick={() => setPhoto(undefined)}>
                      Eliminar foto
                    </button>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Nombre Completo</span>
            <div className={`profile-field-box${editing ? ' editing' : ''}`}>
              <IconUser />
              {editing ? <input value={name} onChange={(e) => setName(e.target.value)} /> : <span>{name}</span>}
            </div>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Correo Electrónico</span>
            <div className={`profile-field-box${editing ? ' editing' : ''}`}>
              <IconMail />
              {editing ? (
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              ) : (
                <span>{newEmail}</span>
              )}
            </div>
          </div>

          <div className="profile-field">
            <span className="profile-field-label">Contraseña</span>
            <div className={`profile-field-box${editing ? ' editing' : ''}`}>
              <IconLock />
              {editing ? (
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              ) : (
                <span>{showPassword ? password : '•'.repeat(Math.max(password.length, 8))}</span>
              )}
              <button
                type="button"
                className="profile-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Mostrar contraseña"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {isDoctor ? (
            <div className="profile-field">
              <span className="profile-field-label">Especialidad</span>
              <div className={`profile-field-box${editing ? ' editing' : ''}`}>
                <IconStethoscope />
                {editing ? (
                  <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                ) : (
                  <span>{specialty || '—'}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="profile-field">
              <span className="profile-field-label">DNI</span>
              <div className={`profile-field-box${editing ? ' editing' : ''}`}>
                <IconIdCard />
                {editing ? (
                  <input
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    inputMode="numeric"
                  />
                ) : (
                  <span>{formatDni(dni)}</span>
                )}
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          {editing && (
            <button type="button" className="btn-primary auth-submit" onClick={handleSave} disabled={!hasChanges}>
              Guardar
            </button>
          )}
        </div>
      </div>

      {confirmAction && (
        <ConfirmDiscard onCancel={() => setConfirmAction(null)} onContinue={handleConfirmContinue} />
      )}
    </>,
    document.body
  );
}

// Ventana "Editar pacientes" (solo médicos). Los cambios se aplican recién al tocar "Guardar".
function EditPatientsModal({
  doctorEmail,
  onClose,
  onSaved,
}: {
  doctorEmail: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const patients = users.filter((u) => u.role === 'paciente');

  // Pacientes asignados = los que tienen a este médico en su lista
  const initialEmails = patients
    .filter((p) => getAssignedDoctors(p).includes(doctorEmail))
    .map((p) => p.email);

  const [draftEmails, setDraftEmails] = useState<string[]>(initialEmails);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const chosenPatients = draftEmails
    .map((email) => patients.find((p) => p.email === email))
    .filter((p): p is StoredUser => !!p);

  // No se ofrecen los pacientes que ya están en la lista
  const availablePatients = patients
    .filter((p) => !draftEmails.includes(p.email))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((p) => matchesWordStart(p.name, query));

  const hasChanges =
    draftEmails.length !== initialEmails.length || draftEmails.some((e) => !initialEmails.includes(e));

  const handleSave = () => {
    const removed = initialEmails.filter((e) => !draftEmails.includes(e));
    const added = draftEmails.filter((e) => !initialEmails.includes(e));

    const updated = users.map((u) => {
      if (u.role !== 'paciente') return u;
      const assigned = getAssignedDoctors(u);
      if (added.includes(u.email) && !assigned.includes(doctorEmail)) {
        return { ...u, assignedDoctorEmails: [...assigned, doctorEmail] };
      }
      if (removed.includes(u.email)) {
        return { ...u, assignedDoctorEmails: assigned.filter((d) => d !== doctorEmail) };
      }
      return u;
    });
    localStorage.setItem('melascan_users', JSON.stringify(updated));

    // Paciente agregado: el chat aparece para los dos (aunque alguno lo hubiera eliminado antes)
    added.forEach((p) => {
      const chatId = `${doctorEmail}__${p}`;
      localStorage.removeItem(`melascan_hidden_${chatId}_${p}`);
      localStorage.removeItem(`melascan_hidden_${chatId}_${doctorEmail}`);
    });

    // Paciente quitado: el chat se conserva para los dos (si no tenía mensajes, se crea vacío)
    removed.forEach((p) => {
      const chatId = `${doctorEmail}__${p}`;
      if (!localStorage.getItem(`melascan_chat_${chatId}`)) {
        localStorage.setItem(`melascan_chat_${chatId}`, '[]');
      }
    });

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
      <div className="modal-card edit-patients-card" onClick={(e) => e.stopPropagation()}>          <button className="modal-close" onClick={handleCloseClick} aria-label="Cerrar">✕</button>
          <h2>Edita tus pacientes asignados</h2>

          <div className="field">
            <span>Pacientes asignados</span>
            <div className="chips-input-box chips-box-static">
              {chosenPatients.length === 0 ? (
                <span className="form-hint">No tenés pacientes asignados.</span>
              ) : (
                chosenPatients.map((p) => (
                  <span className="doctor-chip" key={p.email}>
                    {p.name}
                    <button
                      type="button"
                      className="chip-remove"
                      aria-label={`Quitar a ${p.name}`}
                      onClick={() => setDraftEmails((prev) => prev.filter((x) => x !== p.email))}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="field">
            <span>Agregar paciente</span>
            <div className="searchable-select">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Buscar por nombre para agregar a un paciente"
              />
              {showDropdown && (
                <div className="searchable-dropdown">
                  {availablePatients.length === 0 ? (
                    <div className="searchable-empty">Sin resultados</div>
                  ) : (
                    availablePatients.map((p) => (
                      <button
                        key={p.email}
                        type="button"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          setDraftEmails((prev) => [...prev, p.email]);
                          setQuery('');
                        }}
                      >
                        <HighlightMatch text={p.name} query={query} />
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

      {confirmExit && <ConfirmDiscard onCancel={() => setConfirmExit(false)} onContinue={onClose} />}
    </>,
    document.body
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editPatientsOpen, setEditPatientsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Si cambia algo guardado (mensaje nuevo, chat leído, perfil, etc.) se vuelve a dibujar
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
    setConfirmLogout(false);
    localStorage.removeItem('melascan_session');
    navigate('/');
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
              <button type="button" onClick={() => { setMenuOpen(false); setProfileOpen(true); }}>
                Mi perfil
              </button>
              {currentUser?.role === 'medico' && (
                <button type="button" onClick={() => { setMenuOpen(false); setEditPatientsOpen(true); }}>
                  Editar pacientes
                </button>
              )}
              <div className="profile-menu-divider" />
              {/* El menú queda abierto detrás del cartel: si cancelás, sigue ahí */}
              <button type="button" className="danger" onClick={() => setConfirmLogout(true)}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>

      {profileOpen && currentUser && (
        <MyProfileModal
          email={currentUser.email}
          onClose={() => setProfileOpen(false)}
          onSaved={() => { setProfileOpen(false); showToast('Cambios guardados'); }}
        />
      )}

      {editPatientsOpen && currentUser && (
        <EditPatientsModal
          doctorEmail={currentUser.email}
          onClose={() => setEditPatientsOpen(false)}
          onSaved={() => { setEditPatientsOpen(false); showToast('Cambios guardados'); }}
        />
      )}

      {confirmLogout && createPortal(
        <div className="modal-backdrop confirm-backdrop">
          <div className="modal-card confirm-card logout-card" onClick={(e) => e.stopPropagation()}>
            <h3>Cerrar Sesión</h3>
            <p>¿Estás seguro de que querés cerrar sesión?</p>
            <div className="confirm-actions">
              <button type="button" className="btn-cancel-gray" onClick={() => setConfirmLogout(false)}>Cancelar</button>
              <button type="button" className="btn-danger" onClick={handleLogout}>Continuar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && createPortal(<div className="toast">{toast}</div>, document.body)}
    </aside>
  );
}