import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';


interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  assignedDoctorEmail?: string;
  assignedDoctorEmails?: string[];
  specialty?: string;
  photoDataUrl?: string;
}

interface ChatMessage {
  id: number;
  senderRole: 'medico' | 'paciente';
  text: string;
  timestamp?: number;
}

interface Conversation {
  id: string;
  otherEmail: string;
  name: string;
  specialty?: string;
  photoDataUrl?: string;
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function matchesWordStart(text: string, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(text).split(' ').some((word) => word.startsWith(q));
}

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

const CHAT_PREFIX = 'melascan_chat_';

function getAssignedDoctors(u: StoredUser): string[] {
  if (u.assignedDoctorEmails) return u.assignedDoctorEmails;
  return u.assignedDoctorEmail ? [u.assignedDoctorEmail] : [];
}

function getAllChatIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CHAT_PREFIX) && !key.startsWith(CHAT_PREFIX + 'lastread_')) {
      ids.push(key.slice(CHAT_PREFIX.length));
    }
  }
  return ids;
}

function getMessages(id: string): ChatMessage[] {
  const raw = localStorage.getItem(CHAT_PREFIX + id);
  return raw ? JSON.parse(raw) : [];
}

function getClearedAt(id: string, viewerEmail: string): number {
  const raw = localStorage.getItem(`melascan_cleared_${id}_${viewerEmail}`);
  return raw ? parseInt(raw, 10) : 0;
}

function getVisibleMessages(id: string, viewerEmail: string): ChatMessage[] {
  const clearedAt = getClearedAt(id, viewerEmail);
  return getMessages(id).filter((m) => !clearedAt || (m.timestamp ?? 0) > clearedAt);
}

function isHidden(id: string, viewerEmail: string): boolean {
  return localStorage.getItem(`melascan_hidden_${id}_${viewerEmail}`) === '1';
}

function getUnreadCount(id: string, viewerEmail: string, viewerRole: 'medico' | 'paciente'): number {
  const messages = getMessages(id);
  const clearedAt = getClearedAt(id, viewerEmail);
  const lastReadRaw = localStorage.getItem(`${CHAT_PREFIX}lastread_${id}_${viewerEmail}`);
  const lastReadCount = lastReadRaw ? parseInt(lastReadRaw, 10) : 0;
  return messages
    .slice(lastReadCount)
    .filter((m) => m.senderRole !== viewerRole && (!clearedAt || (m.timestamp ?? 0) > clearedAt)).length;
}

function markAsRead(id: string, viewerEmail: string) {
  localStorage.setItem(`${CHAT_PREFIX}lastread_${id}_${viewerEmail}`, String(getMessages(id).length));
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function Avatar({ photoDataUrl }: { photoDataUrl?: string }) {
  if (photoDataUrl) return <img src={photoDataUrl} alt="Foto de perfil" className="avatar-img" />;
  return (
    <span className="avatar-placeholder">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    </span>
  );
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function IconXCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function Chat() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  const sessionRaw = localStorage.getItem('melascan_session');
  const sessionEmail: string | null = sessionRaw ? (JSON.parse(sessionRaw) as { email: string }).email : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];
  const me = sessionEmail ? (users.find((u) => u.email === sessionEmail) ?? null) : null;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path === '/chats') {
        setSelectedId(null);
        setMenuOpen(false);
      }
    };
    window.addEventListener('melascan-nav-reset', handler);
    return () => window.removeEventListener('melascan-nav-reset', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (selectedId && sessionEmail) markAsRead(selectedId, sessionEmail);
      setTick((n) => n + 1);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [selectedId, sessionEmail]);

  if (!me) {
    return <Navigate to="/" replace />;
  }

  const chatIds = getAllChatIds();
  let conversations: Conversation[] = [];

  if (me.role === 'medico') {
    const patientEmails = new Set<string>();
    users.forEach((u) => {
      if (u.role === 'paciente' && getAssignedDoctors(u).includes(me.email)) patientEmails.add(u.email);
    });
    const prefix = me.email + '__';
    chatIds.forEach((id) => {
      if (id.startsWith(prefix)) patientEmails.add(id.slice(prefix.length));
    });

    conversations = Array.from(patientEmails)
      .map((email) => users.find((u) => u.email === email))
      .filter((u): u is StoredUser => !!u && u.role === 'paciente')
      .map((u) => ({
        id: `${me.email}__${u.email}`,
        otherEmail: u.email,
        name: u.name,
        photoDataUrl: u.photoDataUrl,
      }));
  } else {
    const doctorEmails = new Set<string>(getAssignedDoctors(me));
    const suffix = '__' + me.email;
    chatIds.forEach((id) => {
      if (id.endsWith(suffix)) doctorEmails.add(id.slice(0, id.length - suffix.length));
    });

    conversations = Array.from(doctorEmails)
      .map((email) => users.find((u) => u.email === email))
      .filter((u): u is StoredUser => !!u && u.role === 'medico')
      .map((u) => ({
        id: `${u.email}__${me.email}`,
        otherEmail: u.email,
        name: u.name,
        specialty: u.specialty,
        photoDataUrl: u.photoDataUrl,
      }));
  }

  conversations = conversations.filter((c) => !isHidden(c.id, me.email));

  // Buscador: médico busca pacientes, paciente busca médicos
  const filteredConversations = conversations.filter((c) => matchesWordStart(c.name, searchQuery));

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const messages = selected ? getVisibleMessages(selected.id, me.email) : [];

  const notify = () => window.dispatchEvent(new Event('storage'));

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMenuOpen(false);
    markAsRead(id, me.email);
    notify();
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected) return;

    const current = getMessages(selected.id);
    const newMessage: ChatMessage = {
      id: current.length + 1,
      senderRole: me.role,
      text: draft,
      timestamp: Date.now(),
    };
    localStorage.setItem(CHAT_PREFIX + selected.id, JSON.stringify([...current, newMessage]));
    markAsRead(selected.id, me.email);

    localStorage.removeItem(`melascan_hidden_${selected.id}_${selected.otherEmail}`);

    if (me.role === 'medico') {
      const updatedUsers = users.map((u) => {
        if (u.email !== selected.otherEmail) return u;
        const assigned = getAssignedDoctors(u);
        return assigned.includes(me.email) ? u : { ...u, assignedDoctorEmails: [...assigned, me.email] };
      });
      localStorage.setItem('melascan_users', JSON.stringify(updatedUsers));
    }

    setDraft('');
    notify();
  };

  const handleClearChat = () => {
    if (!selected) return;
    localStorage.setItem(`melascan_cleared_${selected.id}_${me.email}`, String(Date.now()));
    markAsRead(selected.id, me.email);
    setMenuOpen(false);
    notify();
  };

  const handleDeleteChat = () => {
    if (!selected) return;
    localStorage.setItem(`melascan_hidden_${selected.id}_${me.email}`, '1');
    setSelectedId(null);
    setMenuOpen(false);
    notify();
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="chat-shell">
          <div className="conversations-panel">
            <div className="chat-search-wrap">
              <IconSearch />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={me.role === 'medico' ? 'Buscar por el nombre de paciente…' : 'Buscar por el nombre del médico…'}
              />
            </div>

            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-cell" style={{ padding: '24px 16px' }}>
                  {me.role === 'medico'
                    ? 'Todavía no tenés pacientes que te hayan asignado como médico.'
                    : 'Todavía no tenés un médico asignado.'}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="empty-cell" style={{ padding: '24px 16px' }}>
                  No se encontraron chats con ese nombre.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const visible = getVisibleMessages(c.id, me.email);
                  const lastMessage = visible[visible.length - 1];
                  const unread = getUnreadCount(c.id, me.email, me.role);

                  return (
                    <button
                      key={c.id}
                      className={`conversation-row-v2${selectedId === c.id ? ' active' : ''}`}
                      onClick={() => handleSelect(c.id)}
                    >
                      <Avatar photoDataUrl={c.photoDataUrl} />
                      <div className="conv-row-main">
                      <span className={`conv-row-name${searchQuery.trim() ? ' searching' : ''}`}>
                          <HighlightMatch text={c.name} query={searchQuery} />
                        </span>
                        <span className="conv-row-preview">
                          {lastMessage ? lastMessage.text : 'Sin mensajes todavía'}
                        </span>
                      </div>
                      {unread > 0 && <span className="conv-unread-badge">{unread}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="chat-window">
            {!selected ? (
              <div className="result-empty" style={{ margin: 'auto' }}>
                <p>Elegí una conversación para ver los mensajes.</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <Avatar photoDataUrl={selected.photoDataUrl} />
                  <div className="chat-header-text">
                    <span className="chat-header-name">{selected.name}</span>
                    {selected.specialty && <span className="chat-header-specialty">{selected.specialty}</span>}
                  </div>

                  <div className="chat-menu-wrap">
                    <button
                      type="button"
                      className="chat-menu-btn"
                      onClick={() => setMenuOpen((o) => !o)}
                      aria-label="Más opciones"
                    >
                      <IconDots />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="chat-menu-overlay" onClick={() => setMenuOpen(false)} />
                        <div className="chat-menu">
                          <button type="button" onClick={handleClearChat}>
                            <IconXCircle /> Vaciar chat
                          </button>
                          <button type="button" className="danger" onClick={handleDeleteChat}>
                            <IconTrash /> Eliminar chat
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-cell">Todavía no hay mensajes en esta conversación.</div>
                  ) : (
                    messages.map((m) => (
                      <div className={`chat-bubble-v2 ${m.senderRole === me.role ? 'me' : 'other'}`} key={m.id}>
                        <span className="bubble-text">{m.text}</span>
                        <span className="bubble-time">{formatTime(m.timestamp)}</span>
                      </div>
                    ))
                  )}
                </div>
                <form className="chat-input-row" onSubmit={handleSend}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribí un mensaje…" />
                  <button type="submit" className="chat-send-btn" aria-label="Enviar">
                    <IconSend />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}