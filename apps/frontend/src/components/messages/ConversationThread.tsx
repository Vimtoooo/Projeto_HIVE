"use client";
import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  messages,
  sendMessage,
  session,
} from "../../services/MessagingApi";
import type { Conversation, Message } from "../../services/MessagingApi";
import styles from "../../styles/messages-page.module.css";
function merge(old: Message[], rows: Message[]) {
  return [...new Map([...old, ...rows].map((m) => [m.id, m])).values()].sort(
    (a, b) => a.id - b.id,
  );
}
export default function ConversationThread({
  conversation: c,
  user,
  onBack,
}: {
  conversation: Conversation;
  user: number;
  onBack: () => void;
}) {
  const [rows, setRows] = useState<Message[]>([]);
  const [older, setOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [sending, setSending] = useState(false);
  const pending = useRef<{ text: string; key: string } | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const listRef = useRef<HTMLDivElement>(null);
  const other = c.cliente.idUsuario === user ? c.prestador : c.cliente;
  useEffect(() => {
    let alive = true;
    mounted.current = true;
    let first = true;
    async function refresh() {
      try {
        const current = await session();
        if (current.idUsuario !== user)
          throw new ApiError(
            "A conta mudou. Entre novamente para continuar.",
            401,
          );
        const data = await messages(c.id);
        if (!alive) return;
        const el = listRef.current;
        const bottom =
          !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setRows((prev) => merge(prev, data.itens));
        if (first) setOlder(data.temMais);
        first = false;
        setLoading(false);
        setError("");
        setBlocked(false);
        if (bottom)
          requestAnimationFrame(() => {
            if (alive && listRef.current)
              listRef.current.scrollTop = listRef.current.scrollHeight;
          });
      } catch (e) {
        if (alive) {
          setLoading(false);
          setError(e instanceof Error ? e.message : "Falha ao atualizar.");
          if (e instanceof ApiError && [401, 404].includes(e.status)) {
            setRows([]);
            setBlocked(true);
          }
        }
      }
    }
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 5000);
    return () => {
      alive = false;
      mounted.current = false;
      clearInterval(interval);
    };
  }, [c.id, user]);
  async function loadOlder() {
    if (locked.current || !rows.length) return;
    locked.current = true;
    try {
      const data = await messages(c.id, rows[0].id);
      if (mounted.current) {
        setRows((prev) => merge(prev, data.itens));
        setOlder(data.temMais);
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      locked.current = false;
    }
  }
  async function send() {
    const text = draft.trim();
    if (!text || text.length > 2000 || locked.current || blocked) return;
    locked.current = true;
    setSending(true);
    setError("");
    if (pending.current?.text !== text)
      pending.current = { text, key: crypto.randomUUID() };
    try {
      const current = await session();
      if (current.idUsuario !== user)
        throw new ApiError("A conta mudou. Abra novamente a conversa.", 401);
      const row = await sendMessage(c.id, text, pending.current.key);
      if (mounted.current) {
        setRows((prev) => merge(prev, [row]));
        setDraft("");
        pending.current = null;
        requestAnimationFrame(() => {
          if (listRef.current)
            listRef.current.scrollTop = listRef.current.scrollHeight;
        });
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Falha no envio.");
        if (e instanceof ApiError && e.status === 401) {
          setRows([]);
          setBlocked(true);
        }
      }
    } finally {
      locked.current = false;
      if (mounted.current) setSending(false);
    }
  }
  return (
    <section
      className={styles.thread}
      aria-label={"Conversa com " + other.nome}
    >
      <header>
        <button
          type="button"
          className={styles.back}
          onClick={onBack}
          aria-label="Voltar às conversas"
        >
          ←
        </button>
        <span className={styles.initial}>{other.nome.charAt(0)}</span>
        <div>
          <h3>{other.nome}</h3>
          <small>Combine os detalhes do serviço</small>
        </div>
      </header>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div
        ref={listRef}
        className={styles.messages}
        role="log"
        aria-label="Histórico de mensagens"
        aria-live="polite"
      >
        {older && (
          <button type="button" onClick={() => void loadOlder()}>
            Carregar mensagens anteriores
          </button>
        )}
        {loading && <p>Carregando mensagens…</p>}
        {!loading && !rows.length && !blocked && (
          <p className={styles.empty}>
            Conte o que você precisa. Uma boa conversa ajuda a combinar o
            serviço.
          </p>
        )}
        {rows.map((m) => (
          <div
            key={m.id}
            className={m.remetenteId === user ? styles.mine : styles.theirs}
          >
            <p>{m.conteudo}</p>
            <time dateTime={m.enviadaEm}>
              {new Date(m.enviadaEm).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        ))}
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="message-text">Sua mensagem</label>
        <textarea
          id="message-text"
          placeholder="Olá! Gostaria de saber mais sobre o serviço…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          disabled={sending || blocked}
          rows={2}
        />
        <div>
          <small>{draft.length}/2000 · Enter quebra a linha</small>
          <button type="submit" disabled={!draft.trim() || sending || blocked}>
            {sending ? "Enviando…" : "Enviar mensagem"}
          </button>
        </div>
      </form>
    </section>
  );
}
