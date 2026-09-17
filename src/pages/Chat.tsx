import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../components/Sidebar';

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  assignedDoctorEmail?: string;
  specialty?: string;
  photoDataUrl?: string;
}

interface Session {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  assignedDoctorEmail?: string;
}

interface ChatMessage {
  id: number;
  senderRole: 'medico' | 'paciente';
  text: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  name: string;
  specialty?: string;
  photoDataUrl?: string;
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

function getMessages(conversationId: string): ChatMessage[] {
  const raw = localStorage.getItem('melascan_chat_' + conversationId);
  return raw ? JSON.parse(raw) : [];
}

function getUnreadCount(conversationId: string, viewerEmail: string, viewerRole: 'medico' | 'paciente'): number {
  const messages = getMessages(conversationId);
  const lastReadRaw = localStorage.getItem(`melascan_chat_lastread_${conversationId}_${viewerEmail}`);
  const lastReadCount = lastReadRaw ? parseInt(lastReadRaw, 10) : 0;
  return messages.slice(lastReadCount).filter((m) => m.senderRole !== viewerRole).length;
}

function markAsRead(conversationId: string, viewerEmail: string) {
  const messages = getMessages(conversationId);
  localStorage.setItem(`melascan_chat_lastread_${conversationId}_${viewerEmail}`, String(messages.length));
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const sessionRaw = localStorage.getItem('melascan_session');
  const session: Session | null = sessionRaw ? JSON.parse(sessionRaw) : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [patientQuery, setPatientQuery] = useState('');
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.path === '/chats') {
        setSelectedId(null);
        setMessages([]);
      }
    };
    window.addEventListener('melascan-nav-reset', handler);
    return () => window.removeEventListener('melascan-nav-reset', handler);
  }, []);

  let conversations: Conversation[] = [];

  if (session?.role === 'medico') {
    const myPatients = users.filter((u) => u.role === 'paciente' && u.assignedDoctorEmail === session.email);
    conversations = myPatients.map((p) => ({
      id: `${session.email}__${p.email}`,
      name: p.name,
      photoDataUrl: p.photoDataUrl,
    }));
  } else if (session?.role === 'paciente' && session.assignedDoctorEmail) {
    const myDoctor = users.find((u) => u.email === session.assignedDoctorEmail);
    conversations = myDoctor
      ? [{
          id: `${myDoctor.email}__${session.email}`,
          name: myDoctor.name,
          specialty: myDoctor.specialty,
          photoDataUrl: myDoctor.photoDataUrl,
        }]
      : [];
  }

  const filteredConversations = conversations.filter((c) => {
    if (session?.role !== 'medico') return true;
    const q = patientQuery.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q);
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMessages(getMessages(id));
    if (session) {
      markAsRead(id, session.email);
      forceRefresh((n) => n + 1);
    }
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected || !session) return;

    const current = getMessages(selected.id);
    const newMessage: ChatMessage = {
      id: current.length + 1,
      senderRole: session.role,
      text: draft,
      timestamp: Date.now(),
    };
    const updated = [...current, newMessage];

    localStorage.setItem('melascan_chat_' + selected.id, JSON.stringify(updated));
    markAsRead(selected.id, session.email);
    setMessages(updated);
    setDraft('');
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="chat-shell">
          <div className="conversations-panel">
            {session?.role === 'medico' && (
              <div className="chat-search-wrap">
                <IconSearch />
                <input
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Buscar por el nombre de paciente…"
                />
              </div>
            )}

            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div className="empty-cell" style={{ padding: '24px 16px' }}>
                  {session?.role === 'medico'
                    ? 'Todavía no tenés pacientes que te hayan asignado como médico.'
                    : 'Todavía no tenés un médico asignado.'}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const convMessages = getMessages(c.id);
                  const lastMessage = convMessages[convMessages.length - 1];
                  const unread = session ? getUnreadCount(c.id, session.email, session.role) : 0;

                  return (
                    <button
                      key={c.id}
                      className={`conversation-row-v2${selectedId === c.id ? ' active' : ''}`}
                      onClick={() => handleSelect(c.id)}
                    >
                      <Avatar photoDataUrl={c.photoDataUrl} />
                      <div className="conv-row-main">
                        <span className="conv-row-name">{c.name}</span>
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
                </div>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-cell">Todavía no hay mensajes en esta conversación.</div>
                  ) : (
                    messages.map((m) => (
                      <div className={`chat-bubble-v2 ${m.senderRole === session?.role ? 'me' : 'other'}`} key={m.id}>
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