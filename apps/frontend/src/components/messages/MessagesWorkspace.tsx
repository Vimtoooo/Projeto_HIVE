"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApiError, conversations, session } from "../../services/MessagingApi";
import type { Conversation } from "../../services/MessagingApi";
import { rememberViewer, forgetViewer } from "../../lib/ViewerStore";
import { initials } from "../../lib/HomeCatalog";
import HomeIcon from "../home/HomeIcon";
import ConversationThread from "./ConversationThread";
import styles from "../../styles/messages-page.module.css";
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export default function MessagesWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("conversa");
  const [list, setList] = useState<Conversation[]>([]);
  const [user, setUser] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    let loading = false;
    async function load() {
      if (loading) return;
      loading = true;
      try {
        const current = await session();
        const rows = await conversations();
        if (!alive) return;
        rememberViewer(current);
        setUser(current.idUsuario);
        setList(rows);
        setReady(true);
        setError("");
        setUnauthorized(false);
      } catch (e) {
        if (!alive) return;
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar as conversas.",
        );
        if (e instanceof ApiError && e.status === 401) {
          setUnauthorized(true);
          setList([]);
          setUser(null);
          forgetViewer();
        }
      } finally {
        loading = false;
      }
    }
    void load();
    const timer = setInterval(() => {
      void load();
    }, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  const selected = list.find((c) => String(c.id) === selectedId);
  const other =
    selected &&
    (selected.cliente.idUsuario === user
      ? selected.prestador
      : selected.cliente);
  const visible = list.filter((c) =>
    normalize(
      (c.cliente.idUsuario === user ? c.prestador : c.cliente).nome,
    ).includes(normalize(query.trim())),
  );
  const back = () => router.push("/mensagens", { scroll: false });
  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>CADA CONVERSA, UMA CONEXÃO</span>
          <h1>
            <HomeIcon name="message" /> Mensagens
          </h1>
          <p>Combine os detalhes e encontre boas soluções, juntos.</p>
        </div>
        <Link href="/home#professionals" className={styles.find}>
          Encontrar profissionais <HomeIcon name="arrow" size={16} />
        </Link>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error} {unauthorized && <Link href="/login">Entrar novamente</Link>}
        </p>
      )}
      {!ready && !error && <p role="status">Carregando suas conversas…</p>}
      {ready && !unauthorized && (
        <div
          className={`${styles.workspace} ${selectedId ? styles.hasSelection : ""}`}
        >
          <section className={styles.inbox} aria-label="Suas conversas">
            <div className={styles.inboxHeading}>
              <h2>Conversas</h2>
              <span>{list.length}</span>
            </div>
            <label className={styles.search}>
              <HomeIcon name="search" size={18} />
              <input
                aria-label="Buscar conversa"
                placeholder="Buscar contato…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
              />
            </label>
            <nav className={styles.list} aria-label="Conversas">
              {visible.map((c) => {
                const contact =
                  c.cliente.idUsuario === user ? c.prestador : c.cliente;
                return (
                  <button
                    type="button"
                    key={c.id}
                    aria-pressed={selected?.id === c.id}
                    onClick={() =>
                      router.push(`/mensagens?conversa=${c.id}`, {
                        scroll: false,
                      })
                    }
                  >
                    <span className={styles.initial}>
                      {initials(contact.nome)}
                    </span>
                    <span>
                      <strong>{contact.nome}</strong>
                      <small>
                        {c.cliente.idUsuario === user
                          ? "Profissional"
                          : "Cliente"}{" "}
                        · Conversa de serviço
                      </small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                );
              })}
              {!visible.length && (
                <div className={styles.listEmpty}>
                  {list.length
                    ? "Nenhum contato encontrado. Tente outro nome."
                    : "Suas conversas aparecerão aqui. Escolha um profissional cadastrado para começar."}
                  {!list.length && (
                    <Link href="/home#professionals">
                      Explorar profissionais →
                    </Link>
                  )}
                </div>
              )}
            </nav>
            <p className={styles.inboxFoot}>
              <HomeIcon name="shield" size={15} /> Suas conversas ficam na sua
              conta.
            </p>
          </section>
          {selected && user ? (
            <ConversationThread
              key={`${selected.id}:${user}`}
              conversation={selected}
              user={user}
              onBack={back}
            />
          ) : (
            <section
              className={styles.welcome}
              aria-label="Selecione uma conversa"
            >
              {selectedId && (
                <button type="button" className={styles.back} onClick={back}>
                  ← Voltar às conversas
                </button>
              )}
              <span className={styles.welcomeIcon}>
                <HomeIcon name="message" size={36} />
              </span>
              <h2>
                {selectedId
                  ? "Conversa indisponível"
                  : "Uma boa conversa começa aqui."}
              </h2>
              <p>
                {selectedId
                  ? "Esta conversa não está na sua lista. Selecione um contato para continuar."
                  : "Selecione um contato ao lado para conversar sobre o serviço e combinar os próximos passos."}
              </p>
            </section>
          )}
          <aside className={styles.details} aria-label="Detalhes do contato">
            <h2>Detalhes da conversa</h2>
            {other ? (
              <>
                <span className={styles.largeInitial}>
                  {initials(other.nome)}
                </span>
                <h3>{other.nome}</h3>
                <span className={styles.role}>
                  {selected?.cliente.idUsuario === user
                    ? "Profissional no HIVE"
                    : "Cliente no HIVE"}
                </span>
                <div className={styles.detailDivider} />
                <h4>Sobre este espaço</h4>
                <p>
                  Alinhe o que precisa, tire dúvidas e combine a disponibilidade
                  diretamente com seu contato.
                </p>
              </>
            ) : (
              <p>
                Ao selecionar uma conversa, as informações do contato aparecem
                aqui.
              </p>
            )}
            <div className={styles.tip}>
              <HomeIcon name="sparkle" size={22} />
              <h3>Uma conversa que ajuda</h3>
              <p>
                Descreva o serviço e o melhor horário para você. Não compartilhe
                senhas ou dados de pagamento.
              </p>
            </div>
            <small>Enviar uma mensagem não confirma uma contratação.</small>
          </aside>
        </div>
      )}
    </div>
  );
}
