"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  notificationDetail,
  notificationList,
  readAllNotifications,
} from "../../services/NotificationsApi";
import type {
  NotificationItem,
  NotificationPage,
} from "../../services/NotificationsApi";
import { ApiError, session } from "../../services/MessagingApi";
import { rememberViewer } from "../../lib/ViewerStore";
import { useNotifications } from "./NotificationsProvider";
import HomeIcon from "../home/HomeIcon";
import styles from "../../styles/notifications-page.module.css";
const formatDate = (v: string) =>
  new Date(v).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export default function NotificationsWorkspace() {
  const { summary, unauthorized, refresh, error } = useNotifications();
  useEffect(() => {
    let alive = true;
    void session()
      .then((u) => {
        if (alive) rememberViewer(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (unauthorized)
    return (
      <section className={styles.state}>
        <HomeIcon name="bell" />
        <h1>Entre para ver suas notificações</h1>
        <p>Sua sessão terminou ou ainda não foi iniciada.</p>
        <Link href="/login">Entrar na conta</Link>
      </section>
    );
  if (!summary)
    return (
      <section className={styles.state}>
        <h1>Notificações</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Carregando seus avisos…"}
        </p>
        {error && (
          <button onClick={() => void refresh()}>Tentar novamente</button>
        )}
      </section>
    );
  return (
    <NotificationFilters key={summary.usuarioId} user={summary.usuarioId} />
  );
}
function NotificationFilters({ user }: { user: number }) {
  const [category, setCategory] = useState(""),
    [unread, setUnread] = useState(false);
  const { summary, error } = useNotifications();
  return (
    <section className={styles.workspace} aria-labelledby="notifications-title">
      <header className={styles.heading}>
        <span className={styles.headingIcon}>
          <HomeIcon name="bell" size={28} />
        </span>
        <div>
          <span className={styles.eyebrow}>SEU HIVE, EM DIA</span>
          <h1 id="notifications-title">Notificações</h1>
          <p>Acompanhe suas conversas e cada etapa dos seus serviços.</p>
        </div>
        <span className={styles.total}>
          {summary?.naoLidas ?? 0}{" "}
          {summary?.naoLidas === 1 ? "não lida" : "não lidas"}
        </span>
      </header>
      {error && (
        <p role="status">
          Não foi possível atualizar o contador. Tentaremos novamente.
        </p>
      )}
      <div
        className={styles.filters}
        role="group"
        aria-label="Filtrar notificações"
      >
        {[
          ["", "Todas"],
          ["solicitacoes", "Solicitações"],
          ["mensagens", "Mensagens"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {label}
          </button>
        ))}
        <label>
          <input
            type="checkbox"
            checked={unread}
            onChange={(e) => setUnread(e.target.checked)}
          />
          Não lidas
        </label>
      </div>
      <NotificationPanels
        key={`${category}:${unread}`}
        user={user}
        category={category}
        unread={unread}
      />
    </section>
  );
}
function NotificationPanels({
  user,
  category,
  unread,
}: {
  user: number;
  category: string;
  unread: boolean;
}) {
  const { revision, refresh } = useNotifications();
  const [data, setData] = useState<NotificationPage | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [page, setPage] = useState<{ antes?: number; ateId?: number }>({}),
    [selected, setSelected] = useState<NotificationItem | null>(null);
  const [busy, setBusy] = useState(false),
    [readError, setReadError] = useState(false),
    [loading, setLoading] = useState(true);
  const alive = useRef(true),
    sequence = useRef(0),
    locked = useRef(false),
    title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    const invalidate = () => {
      sequence.current++;
    };
    return () => {
      alive.current = false;
      invalidate();
    };
  }, []);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      limite: "20",
      ...(category ? { categoria: category } : {}),
      ...(unread ? { naoLidas: "true" } : {}),
      ...(page.antes
        ? { antes: String(page.antes), ateId: String(page.ateId) }
        : {}),
    });
    void notificationList(query.toString())
      .then((result) => {
        if (active) {
          if (result.usuarioId !== user) {
            void refresh();
            return;
          }
          setData(result);
          setError("");
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Falha ao carregar notificações.",
          );
          setLoading(false);
          if (e instanceof ApiError && e.status === 401) void refresh();
        }
      });
    return () => {
      active = false;
    };
  }, [user, category, unread, page, revision, refresh]);
  async function open(id: number) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setReadError(false);
    setNotice("");
    const request = ++sequence.current;
    try {
      const current = await notificationDetail(id);
      if (!alive.current || request !== sequence.current) return;
      setSelected(current);
      setTimeout(() => title.current?.focus(), 0);
      if (current.lidaEm === null) {
        try {
          const saved = await notificationDetail(id, true);
          if (alive.current && request === sequence.current) {
            setSelected(saved);
            setData((old) =>
              old
                ? {
                    ...old,
                    itens: old.itens.map((n) => (n.id === id ? saved : n)),
                  }
                : old,
            );
            await refresh();
          }
        } catch (e) {
          if (alive.current) {
            setReadError(true);
            setNotice(
              e instanceof Error
                ? e.message
                : "Não foi possível marcar como lida.",
            );
            if (e instanceof ApiError && e.status === 401) void refresh();
          }
        }
      }
    } catch (e) {
      if (alive.current) {
        setNotice(e instanceof Error ? e.message : "Notificação indisponível.");
        if (e instanceof ApiError && e.status === 404) {
          setSelected(null);
          void refresh();
        }
        if (e instanceof ApiError && e.status === 401) void refresh();
      }
    } finally {
      if (alive.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  async function readAll() {
    if (!data || locked.current) return;
    locked.current = true;
    setBusy(true);
    setNotice("");
    try {
      await readAllNotifications(data.ateId);
      if (alive.current) {
        setNotice("Avisos até esta consulta marcados como lidos.");
        if (selected && selected.id <= data.ateId)
          setSelected(await notificationDetail(selected.id));
        await refresh();
      }
    } catch (e) {
      if (alive.current) {
        setNotice(
          e instanceof Error ? e.message : "Não foi possível marcar os avisos.",
        );
        if (e instanceof ApiError && e.status === 401) void refresh();
      }
    } finally {
      if (alive.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <>
      <div className={styles.toolbar}>
        <p>Do mais recente ao mais antigo</p>
        <button
          disabled={!data || busy || data.ateId === 0}
          onClick={() => void readAll()}
          title="Marca todas as categorias até o momento desta consulta. Avisos novos permanecem não lidos."
        >
          <HomeIcon name="check" size={16} />
          Marcar todas como lidas
        </button>
      </div>
      <p className={styles.scope}>
        A leitura em lote inclui todas as categorias até esta consulta; novos
        avisos ficam pendentes.
      </p>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className={styles.notice} role="alert">
          {error}{" "}
          <button onClick={() => void refresh()}>Tentar novamente</button>
        </div>
      )}
      <div className={`${styles.panels} ${selected ? styles.hasDetail : ""}`}>
        <section
          className={styles.list}
          aria-label="Lista de notificações"
          aria-busy={busy}
        >
          {loading && !data ? (
            <p className={styles.state}>Carregando notificações…</p>
          ) : data?.itens.length === 0 ? (
            <div className={styles.state}>
              <HomeIcon name="bell" size={32} />
              <h2>Tudo em dia por aqui</h2>
              <p>
                {unread
                  ? "Você não tem avisos não lidos neste filtro."
                  : "Novas mensagens e atualizações dos seus pedidos aparecerão aqui."}
              </p>
            </div>
          ) : (
            data?.itens.map((n) => (
              <button
                key={n.id}
                className={`${styles.item} ${n.lidaEm === null ? styles.unread : ""} ${selected?.id === n.id ? styles.selected : ""}`}
                onClick={() => void open(n.id)}
                disabled={busy}
                aria-current={selected?.id === n.id ? "true" : undefined}
              >
                <span
                  className={`${styles.eventIcon} ${n.tipo === "NOVA_MENSAGEM" ? styles.messageIcon : ""}`}
                >
                  <HomeIcon
                    name={n.tipo === "NOVA_MENSAGEM" ? "message" : "clipboard"}
                  />
                </span>
                <span className={styles.copy}>
                  <strong>{n.titulo}</strong>
                  <span>{n.descricao}</span>
                  <small>
                    {formatDate(n.criadaEm)} ·{" "}
                    {n.lidaEm === null ? "Não lida" : "Lida"}
                  </small>
                </span>
                <HomeIcon name="chevron" size={16} />
              </button>
            ))
          )}
          <div className={styles.pagination}>
            {page.antes && (
              <button
                disabled={busy}
                onClick={() => {
                  setPage({});
                  setSelected(null);
                }}
              >
                Mais recentes
              </button>
            )}
            {data?.proximoCursor && (
              <button
                disabled={busy}
                onClick={() => {
                  setPage({ antes: data.proximoCursor!, ateId: data.ateId });
                  setSelected(null);
                }}
              >
                Mais antigas
              </button>
            )}
          </div>
        </section>
        <section className={styles.detail} aria-label="Detalhes da notificação">
          {selected ? (
            <>
              <button
                className={styles.back}
                onClick={() => {
                  sequence.current++;
                  setSelected(null);
                }}
              >
                ← Voltar às notificações
              </button>
              <span className={styles.detailIcon}>
                <HomeIcon
                  name={selected.tipo === "NOVA_MENSAGEM" ? "message" : "bell"}
                  size={30}
                />
              </span>
              <p className={styles.eyebrow}>
                {selected.tipo === "NOVA_MENSAGEM"
                  ? "MENSAGENS"
                  : "SOLICITAÇÕES"}
              </p>
              <h2 ref={title} tabIndex={-1}>
                {selected.titulo}
              </h2>
              <time dateTime={selected.criadaEm}>
                {formatDate(selected.criadaEm)}
              </time>
              <p className={styles.description}>{selected.descricao}</p>
              <p className={styles.readState}>
                {selected.lidaEm
                  ? "Lida em " + formatDate(selected.lidaEm)
                  : "Não lida"}
              </p>
              {readError && (
                <button disabled={busy} onClick={() => void open(selected.id)}>
                  Tentar marcar como lida
                </button>
              )}
              {selected.destino ? (
                <Link className={styles.primary} href={selected.destino}>
                  {selected.tipo === "NOVA_MENSAGEM"
                    ? "Abrir conversa"
                    : "Ver solicitação"}
                  <HomeIcon name="arrow" size={18} />
                </Link>
              ) : (
                <p>O conteúdo de origem não está mais disponível.</p>
              )}
              <p className={styles.hint}>
                Os avisos ajudam você a acompanhar o serviço. Ler uma
                notificação não altera seu pedido.
              </p>
            </>
          ) : (
            <div className={styles.state}>
              <HomeIcon name="bell" size={38} />
              <h2>Cada novidade, no seu lugar</h2>
              <p>
                Selecione um aviso ao lado para ver os detalhes e continuar a
                conversa ou acompanhar o pedido.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
