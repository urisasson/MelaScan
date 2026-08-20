import { useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../components/Sidebar';

interface StoredUser {
  name: string;
  email: string;
  role: 'medico' | 'paciente';
  assignedDoctorEmail?: string;
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
}

interface Conversation {
  id: string;
  name: string;
}

export default function Chat() {
  const sessionRaw = localStorage.getItem('melascan_session');
  const session: Session | null = sessionRaw ? JSON.parse(sessionRaw) : null;

  const usersRaw = localStorage.getItem('melascan_users');
  const users: StoredUser[] = usersRaw ? JSON.parse(usersRaw) : [];

  let conversations: Conversation[] = [];

  if (session?.role === 'medico') {
    const myPatients = users.filter((u) => u.role === 'paciente' && u.assignedDoctorEmail === session.email);
    conversations = myPatients.map((p) => ({
      id: `${session.email}__${p.email}`,
      name: p.name,
    }));
  } else if (session?.role === 'paciente' && session.assignedDoctorEmail) {
    const myDoctor = users.find((u) => u.email === session.assignedDoctorEmail);
    conversations = myDoctor
      ? [{ id: `${myDoctor.email}__${session.email}`, name: myDoctor.name }]
      : [];
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const raw = localStorage.getItem('melascan_chat_' + id);
    setMessages(raw ? JSON.parse(raw) : []);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected || !session) return;

    const raw = localStorage.getItem('melascan_chat_' + selected.id);
    const current: ChatMessage[] = raw ? JSON.parse(raw) : [];
    const newMessage: ChatMessage = { id: current.length + 1, senderRole: session.role, text: draft };
    const updated = [...current, newMessage];

    localStorage.setItem('melascan_chat_' + selected.id, JSON.stringify(updated));
    setMessages(updated);
    setDraft('');
  };

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="chat-shell">
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-cell" style={{ padding: '24px 16px' }}>
                {session?.role === 'medico'
                  ? 'Todavía no tenés pacientes que te hayan asignado.'
                  : 'Todavía no tenés un médico asignado.'}
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  className={`conversation-row${selectedId === c.id ? ' active' : ''}`}
                  onClick={() => handleSelect(c.id)}
                >
                  <span className="conversation-avatar" />
                  <span>{c.name}</span>
                </button>
              ))
            )}
          </div>

          <div className="chat-window">
            {!selected ? (
              <div className="result-empty" style={{ margin: 'auto' }}>
                <p>Elegí una conversación para ver los mensajes.</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <span className="conversation-avatar" />
                  <span>{selected.name}</span>
                </div>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-cell">Todavía no hay mensajes en esta conversación.</div>
                  ) : (
                    messages.map((m) => (
                      <div className={`chat-bubble ${m.senderRole === session?.role ? 'me' : 'other'}`} key={m.id}>
                        {m.text}
                      </div>
                    ))
                  )}
                </div>
                <form className="chat-input-row" onSubmit={handleSend}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribí un mensaje…" />
                  <button type="submit" className="btn-primary">Enviar</button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}