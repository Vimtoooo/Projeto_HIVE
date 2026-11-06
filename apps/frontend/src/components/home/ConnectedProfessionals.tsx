"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  history,
  session,
  startConversation,
} from "../../services/MessagingApi";
import type {
  Conversation,
  PreviousProvider,
} from "../../services/MessagingApi";
import { rememberViewer, writeStored, VIEWER_KEY } from "../../lib/ViewerStore";
import {
  professionalsList,
  type ProfessionalSummary,
} from "../../services/ProfessionalsApi";
import RegisteredProfessionalCard from "./RegisteredProfessionalCard";
import homeStyles from "../../styles/home-page.module.css";
import HomeIcon from "./HomeIcon";
import styles from "../../styles/conversations.module.css";
export default function ConnectedProfessionals({
  onConversation,
}: {
  onConversation: (c: Conversation) => void;
}) {
  const [catalog, setCatalog] = useState<ProfessionalSummary[]>([]);
  const [previous, setPrevious] = useState<PreviousProvider[]>([]);
  const [user, setUser] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [login, setLogin] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    professionalsList(`pagina=${page}&limite=12`)
      .then((data) => {
        if (alive) {
          setCatalog((old) => [
            ...new Map(
              (page === 1 ? data.itens : [...old, ...data.itens]).map((p) => [
                p.idPrestador,
                p,
              ]),
            ).values(),
          ]);
          setMore(data.pagina * data.limite < data.total);
          setCatalogError("");
        }
      })
      .catch((e: unknown) => {
        if (alive)
          setCatalogError(
            e instanceof Error ? e.message : "Falha ao carregar profissionais.",
          );
      })
      .finally(() => {
        if (alive) setCatalogLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, retry]);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const current = await session();
        const rows = await history();
        if (alive) {
          rememberViewer(current);
          setUser(current.idUsuario);
          setPrevious(rows);
          setLogin(false);
          setHistoryError("");
        }
      } catch (e) {
        if (alive) {
          if (e instanceof ApiError && e.status === 401) {
            writeStored(VIEWER_KEY, "");
            setUser(null);
            setPrevious([]);
          }
          setLogin(e instanceof ApiError && e.status === 401);
          setHistoryError(
            e instanceof ApiError && e.status === 401
              ? ""
              : e instanceof Error
                ? e.message
                : "Falha ao carregar histórico.",
          );
        }
      } finally {
        if (alive) setLoaded(true);
      }
    }
    void load();
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      window.removeEventListener("focus", load);
    };
  }, [retry]);
  async function contact(id: number) {
    if (busy !== null) return;
    setBusy(id);
    setActionError("");
    try {
      onConversation(await startConversation(id));
    } catch (e) {
      setActionError(
        e instanceof ApiError && e.status === 401
          ? "Entre novamente para enviar mensagens."
          : e instanceof Error
            ? e.message
            : "Não foi possível abrir a conversa.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className={styles.connected} id="connected-professionals">
      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError} <Link href="/login">Ir para login</Link>
        </p>
      )}
      <section aria-labelledby="previous-title">
        <h2 id="previous-title">
          <HomeIcon name="clipboard" size={21} /> Contrate novamente
        </h2>
        <p>Retome o contato com quem já cuidou de um serviço seu.</p>
        {!loaded && <p role="status">Carregando seu histórico…</p>}
        {login && (
          <div className={styles.empty}>
            <Link href="/login">Entre na sua conta</Link> para ver os
            profissionais que você já contratou.
          </div>
        )}
        {historyError && (
          <p role="alert">
            {historyError}{" "}
            <button
              type="button"
              onClick={() => {
                setCatalogLoading(true);
                setRetry((v) => v + 1);
              }}
            >
              Tentar novamente
            </button>
          </p>
        )}
        {loaded && !login && !historyError && !previous.length && (
          <div className={styles.empty}>
            Quando um serviço seu for concluído, o profissional aparecerá aqui.
          </div>
        )}
        {!login && !historyError && (
          <div className={styles.providerGrid}>
            {previous.map((p) => (
              <article
                key={p.prestadorId}
                aria-label={"Contrate novamente: " + p.nome}
              >
                <span className={styles.initial}>{p.nome.charAt(0)}</span>
                <h3>{p.nome}</h3>
                <p>{p.areaAtuacao}</p>
                <small>Último serviço: {p.ultimoServico}</small>
                <button
                  type="button"
                  disabled={!p.disponivel || busy !== null}
                  onClick={() => void contact(p.prestadorId)}
                >
                  {!p.disponivel
                    ? "Indisponível no momento"
                    : busy === p.prestadorId
                      ? "Abrindo…"
                      : "Conversar novamente"}{" "}
                  <HomeIcon name="message" size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      <section aria-labelledby="registered-title">
        <h2 id="registered-title">
          <HomeIcon name="users" size={21} /> Profissionais cadastrados
        </h2>
        <p>
          Converse com profissionais disponíveis e combine o próximo serviço.
        </p>
        {catalogError && (
          <p role="alert">
            {catalogError}{" "}
            <button
              type="button"
              onClick={() => {
                setCatalogLoading(true);
                setRetry((v) => v + 1);
              }}
            >
              Tentar novamente
            </button>
          </p>
        )}
        {catalogLoading && <p role="status">Carregando profissionais…</p>}
        {!catalogLoading &&
          !catalogError &&
          !catalog.filter((p) => p.idPrestador !== user).length && (
            <p>Nenhum profissional disponível nesta lista.</p>
          )}
        <div className={homeStyles.registeredGrid}>
          {catalog
            .filter((p) => p.idPrestador !== user)
            .map((p) => (
              <RegisteredProfessionalCard
                key={p.idPrestador}
                professional={p}
                busy={busy}
                onMessage={() => void contact(p.idPrestador)}
              />
            ))}
        </div>
        {more && (
          <button
            type="button"
            disabled={catalogLoading || Boolean(catalogError)}
            onClick={() => {
              setCatalogLoading(true);
              setPage((p) => p + 1);
            }}
          >
            Ver mais profissionais
          </button>
        )}
      </section>
    </div>
  );
}
