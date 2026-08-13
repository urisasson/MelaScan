import { useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../components/Sidebar';

interface Conversation {
  id: string;
  patientName: string;
}

interface Message {
  id: number;
  from: 'me' | 'other';
  text: string;
}

// TODO: reemplazar por GET /chats al backend (pacientes con los que el médico tiene conversación)
const conversations: Conversation[] = [];

export default function Chat() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // TODO: reemplazar por GET /chats/:id/mensajes al backend
    setMessages([]);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected) return;
    // TODO: reemplazar por POST al backend (o WebSocket) para enviar el mensaje real
    setMessages((prev) => [...prev, { id: prev.length + 1, from: 'me', text: draft }]);
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
                Todavía no tenés conversaciones.
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  className={`conversation-row${selectedId === c.id ? ' active' : ''}`}
                  onClick={() => handleSelect(c.id)}
                >
                  <span className="conversation-avatar" />
                  <span>{c.patientName}</span>
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
                  <span>{selected.patientName}</span>
                </div>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="empty-cell">Todavía no hay mensajes en esta conversación.</div>
                  ) : (
                    messages.map((m) => (
                      <div className={`chat-bubble ${m.from}`} key={m.id}>{m.text}</div>
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