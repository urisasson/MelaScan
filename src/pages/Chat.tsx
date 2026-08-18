import { useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../components/Sidebar';

interface AnalysisRecord {
  sentToPatient: boolean;
  patientName?: string;
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
  const role = (localStorage.getItem('melascan_role') as 'medico' | 'paciente') || 'paciente';

  // Médico: una conversación por cada paciente al que le envió un análisis.
  // Paciente: una sola conversación con "su médico" (genérico hasta que haya cuentas reales).
  let conversations: Conversation[] = [];
  if (role === 'medico') {
    const raw = localStorage.getItem('melascan_historial');
    const historial: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    const patientNames = Array.from(
      new Set(historial.filter((r) => r.sentToPatient && r.patientName).map((r) => r.patientName as string))
    );
    conversations = patientNames.map((name) => ({ id: name, name }));
  } else {
    conversations = [{ id: 'medico-generico', name: 'Tu médico' }];
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
    if (!draft.trim() || !selected) return;

    const raw = localStorage.getItem('melascan_chat_' + selected.id);
    const current: ChatMessage[] = raw ? JSON.parse(raw) : [];
    const newMessage: ChatMessage = { id: current.length + 1, senderRole: role, text: draft };
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
                {role === 'medico'
                  ? 'Todavía no le enviaste ningún análisis a un paciente.'
                  : 'Todavía no tenés conversación con tu médico.'}
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
                      <div className={`chat-bubble ${m.senderRole === role ? 'me' : 'other'}`} key={m.id}>
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