"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApiError, session } from "../../services/MessagingApi";
import {
  actions,
  changeRequest,
  payments,
  requestConversation,
  requestDetail,
  requestList,
  statuses,
} from "../../services/RequestsApi";
import type {
  RequestAction,
  RequestPage,
  RequestRole,
  ServiceRequest,
} from "../../services/RequestsApi";
import type { PublicUser } from "../../types/ApiTypes";
import { forgetViewer, rememberViewer } from "../../lib/ViewerStore";
import { requestMoney as money } from "../../lib/RequestFormatting";
import { initials } from "../../lib/HomeCatalog";
import HomeIcon from "../home/HomeIcon";
import NewRequestForm from "./NewRequestForm";
import styles from "../../styles/requests-page.module.css";
const date = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export default function RequestsWorkspace() {
  const params = useSearchParams();
  return <RequestsContent key={params.toString()} query={params.toString()} />;
}
function RequestsContent({ query }: { query: string }) {
  const router = useRouter(),
    params = new URLSearchParams(query);
  const role: RequestRole =
    params.get("papel") === "prestador" ? "prestador" : "cliente";
  const status = params.get("status") ?? "";
  const page = Number(params.get("pagina") ?? "1");
  const rawId = params.get("pedido"),
    id = rawId ? Number(rawId) : null;
  const creating = params.get("nova") === "1";
  const valid =
    (!status || Object.hasOwn(statuses, status)) &&
    Number.isSafeInteger(page) &&
    page > 0 &&
    page <= 100000 &&
    (!rawId || (Number.isSafeInteger(id) && Number(id) > 0));
  const [user, setUser] = useState<PublicUser | null>(null),
    [data, setData] = useState<RequestPage | null>(null),
    [detail, setDetail] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState(""),
    [unauthorized, setUnauthorized] = useState(false),
    [ready, setReady] = useState(false),
    [tick, setTick] = useState(0),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState<RequestAction | null>(null);
  const locked = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function navigate(values: Record<string, string>) {
    router.push("/solicitacoes?" + new URLSearchParams(values), {
      scroll: false,
    });
  }
  const listUrl = {
    papel: role,
    ...(status ? { status } : {}),
    pagina: String(page),
  };
  function expire() {
    setUnauthorized(true);
    setUser(null);
    setData(null);
    setDetail(null);
    forgetViewer();
    setError("Entre novamente para continuar.");
  }
  useEffect(() => {
    let alive = true,
      loading = false;
    async function load() {
      if (loading) return;
      loading = true;
      try {
        const current = await session();
        if (!valid)
          throw Error("Endereço de solicitação inválido. Volte à lista.");
        const [rows, selected] = await Promise.all([
          requestList(role, status, page),
          id ? requestDetail(id) : Promise.resolve(null),
        ]);
        if (!alive) return;
        rememberViewer(current);
        setUser(current);
        setData(rows);
        setDetail(selected);
        setReady(true);
        setError("");
        setUnauthorized(false);
      } catch (e) {
        if (!alive) return;
        setReady(true);
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar seus pedidos.",
        );
        if (e instanceof ApiError && e.status === 401) {
          setUnauthorized(true);
          setUser(null);
          setData(null);
          setDetail(null);
          forgetViewer();
        } else if (e instanceof ApiError && e.status === 404) {
          setDetail(null);
        }
      } finally {
        loading = false;
      }
    }
    void load();
    const timer = setInterval(() => {
      void load();
    }, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [role, status, page, id, valid, tick]);
  async function act(action: RequestAction | "CONVERSAR") {
    if (!detail || !user || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const current = await session();
      if (current.idUsuario !== user.idUsuario) {
        expire();
        return;
      }
      if (action === "CONVERSAR") {
        const conversationId = await requestConversation(detail.idContratacao);
        if (mounted.current)
          router.push(`/mensagens?conversa=${conversationId}`);
      } else {
        const row = await changeRequest(detail.idContratacao, action);
        if (mounted.current) {
          setDetail(row);
          setConfirm(null);
          setNotice("Solicitação atualizada: " + statuses[row.status] + ".");
          setTick((v) => v + 1);
        }
      }
    } catch (e) {
      if (!mounted.current) return;
      if (e instanceof ApiError && e.status === 401) expire();
      else
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível realizar a ação. Atualize e tente novamente.",
        );
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const contact =
    detail &&
    (detail.papel === "cliente" ? detail.prestador : detail.contratante);
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>SEUS SERVIÇOS, EM UM SÓ LUGAR</span>
          <h1>
            <HomeIcon name="clipboard" /> Minhas solicitações
          </h1>
          <p>Acompanhe cada pedido e combine os próximos passos.</p>
        </div>
        {user?.tipoUsuario !== "PRESTADOR" && user && (
          <button
            className={styles.primary}
            onClick={() => navigate({ nova: "1" })}
          >
            + Nova solicitação
          </button>
        )}
      </header>
      <div className={styles.roles} aria-label="Tipo de solicitações">
        <button
          aria-pressed={role === "cliente"}
          onClick={() => navigate({ papel: "cliente" })}
        >
          Pedidos feitos
        </button>
        <button
          aria-pressed={role === "prestador"}
          onClick={() => navigate({ papel: "prestador" })}
        >
          Pedidos recebidos
        </button>
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}{" "}
          {unauthorized ? (
            <Link href="/login">Entrar novamente</Link>
          ) : (
            <>
              <button onClick={() => setTick((v) => v + 1)}>Atualizar</button>
              <Link href="/solicitacoes">Voltar à lista</Link>
            </>
          )}
        </div>
      )}
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {!ready && <p role="status">Carregando solicitações…</p>}
      {ready && !unauthorized && user && (
        <>
          {creating ? (
            <div className={styles.createGrid}>
              <div>
                <button
                  className={styles.back}
                  onClick={() => navigate({ papel: role })}
                >
                  ← Voltar à lista
                </button>
                {user.tipoUsuario === "PRESTADOR" ? (
                  <p>
                    Esta conta é somente de prestador. Veja os pedidos
                    recebidos.
                  </p>
                ) : (
                  <NewRequestForm
                    user={user.idUsuario}
                    onUnauthorized={expire}
                    onCreated={(id) =>
                      navigate({ papel: "cliente", pedido: String(id) })
                    }
                  />
                )}
              </div>
              <aside className={styles.tip}>
                <HomeIcon name="shield" />
                <h2>Como funciona?</h2>
                <ol>
                  <li>Você escolhe um serviço e envia o pedido.</li>
                  <li>O prestador aceita ou recusa.</li>
                  <li>Após a execução, o prestador conclui o serviço.</li>
                </ol>
                <p>
                  O pagamento é combinado entre vocês. O HIVE não processa
                  cobranças nesta etapa.
                </p>
              </aside>
            </div>
          ) : (
            <>
              <div className={styles.filters} aria-label="Filtrar por status">
                {[["", "Todos"], ...Object.entries(statuses)].map(
                  ([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={status === value}
                      onClick={() =>
                        navigate({
                          papel: role,
                          ...(value ? { status: value } : {}),
                        })
                      }
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
              <div
                className={`${styles.workspace} ${id ? styles.selected : ""}`}
              >
                <section
                  className={styles.list}
                  aria-label="Lista de solicitações"
                >
                  <div className={styles.listHeading}>
                    <h2>
                      {role === "cliente"
                        ? "Seus pedidos"
                        : "Pedidos para você"}
                    </h2>
                    <span>{data?.total ?? 0}</span>
                  </div>
                  {data?.itens.map((row) => (
                    <button
                      key={row.idContratacao}
                      aria-pressed={row.idContratacao === id}
                      onClick={() =>
                        navigate({
                          ...listUrl,
                          pedido: String(row.idContratacao),
                        })
                      }
                    >
                      <span className={styles.rowTop}>
                        <small>#{row.idContratacao}</small>
                        <span className={styles.badge} data-status={row.status}>
                          {statuses[row.status]}
                        </span>
                      </span>
                      <strong>{row.servico.titulo}</strong>
                      <small>
                        {row.papel === "cliente"
                          ? row.prestador.nome
                          : row.contratante.nome}
                      </small>
                      <span className={styles.rowBottom}>
                        <small>{date(row.dataContratacao)}</small>
                        <b>{money(row.valor)}</b>
                      </span>
                    </button>
                  ))}
                  {!data?.itens.length && (
                    <p className={styles.empty}>
                      Nenhuma solicitação nesta lista.{" "}
                      {role === "cliente"
                        ? "Crie um pedido ou experimente outro filtro."
                        : "Os pedidos dos seus clientes aparecerão aqui."}
                    </p>
                  )}
                  <div className={styles.pagination}>
                    <button
                      disabled={page === 1}
                      onClick={() =>
                        navigate({ ...listUrl, pagina: String(page - 1) })
                      }
                    >
                      Anterior
                    </button>
                    <span>Página {page}</span>
                    <button
                      disabled={!data || page * data.limite >= data.total}
                      onClick={() =>
                        navigate({ ...listUrl, pagina: String(page + 1) })
                      }
                    >
                      Próxima
                    </button>
                  </div>
                </section>
                <section
                  className={styles.details}
                  aria-label="Detalhes da solicitação"
                >
                  {detail && contact ? (
                    <>
                      <button
                        className={styles.back}
                        onClick={() => navigate(listUrl)}
                      >
                        ← Voltar à lista
                      </button>
                      <div className={styles.detailHeading}>
                        <span
                          className={styles.badge}
                          data-status={detail.status}
                        >
                          {statuses[detail.status]}
                        </span>
                        <small>Solicitação #{detail.idContratacao}</small>
                      </div>
                      <h2>{detail.servico.titulo}</h2>
                      <p className={styles.description}>
                        {detail.servico.descricao}
                      </p>
                      <div className={styles.person}>
                        <span className={styles.avatar}>
                          {initials(contact.nome)}
                        </span>
                        <div>
                          <strong>{contact.nome}</strong>
                          <small>
                            {detail.papel === "cliente"
                              ? detail.prestador.areaAtuacao
                              : "Cliente"}
                          </small>
                        </div>
                        <button
                          disabled={busy}
                          onClick={() => void act("CONVERSAR")}
                        >
                          <HomeIcon name="message" size={17} /> Conversar
                        </button>
                      </div>
                      <dl className={styles.facts}>
                        <div>
                          <dt>Valor do pedido</dt>
                          <dd>{money(detail.valor)}</dd>
                        </div>
                        <div>
                          <dt>Solicitado em</dt>
                          <dd>{date(detail.dataContratacao)}</dd>
                        </div>
                        <div>
                          <dt>Pagamento combinado</dt>
                          <dd>{payments[detail.formaPagamento]}</dd>
                        </div>
                        <div>
                          <dt>Seu papel</dt>
                          <dd>
                            {detail.papel === "cliente"
                              ? "Contratante"
                              : "Prestador"}
                          </dd>
                        </div>
                      </dl>
                      <div className={styles.progress}>
                        <HomeIcon
                          name={
                            detail.status === "CONCLUIDA"
                              ? "check"
                              : "clipboard"
                          }
                        />
                        <p>
                          {detail.status === "PENDENTE"
                            ? "Aguardando a decisão do prestador."
                            : detail.status === "EM_ANDAMENTO"
                              ? "Pedido aceito. Combine os detalhes pela conversa."
                              : detail.status === "CONCLUIDA"
                                ? "Serviço concluído. O profissional fica disponível no seu histórico."
                                : "Pedido encerrado por cancelamento ou recusa."}
                        </p>
                      </div>
                      {detail.cancelamentoBloqueado && (
                        <p className={styles.note}>
                          Este pedido possui registros financeiros que precisam
                          ser tratados antes de um cancelamento.
                        </p>
                      )}
                      <div className={styles.actions}>
                        {detail.acoes.map((action) => (
                          <button
                            key={action}
                            disabled={busy}
                            className={
                              action === "ACEITAR" || action === "CONCLUIR"
                                ? styles.primary
                                : styles.secondary
                            }
                            onClick={() => setConfirm(action)}
                          >
                            {actions[action]}
                          </button>
                        ))}
                      </div>
                      {confirm && (
                        <div
                          className={styles.confirm}
                          role="group"
                          aria-label="Confirmar ação"
                        >
                          <h3>{actions[confirm]}?</h3>
                          <p>
                            {confirm === "CONCLUIR"
                              ? "Confirme somente depois de realizar o serviço. Esta ação encerra o pedido."
                              : confirm === "CANCELAR" || confirm === "RECUSAR"
                                ? "O pedido será encerrado e não poderá ser reaberto."
                                : "O pedido passará para Em andamento."}
                          </p>
                          <button
                            className={styles.primary}
                            disabled={busy}
                            onClick={() => void act(confirm)}
                          >
                            {busy
                              ? "Salvando…"
                              : "Confirmar: " + actions[confirm]}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => setConfirm(null)}
                          >
                            Voltar
                          </button>
                        </div>
                      )}
                      <p className={styles.note}>
                        Não há rastreamento de localização ou cobrança
                        automática. Combine endereço e horário pela conversa.
                      </p>
                    </>
                  ) : (
                    <div className={styles.empty}>
                      <HomeIcon name="clipboard" size={36} />
                      <h2>Seu próximo passo começa aqui</h2>
                      <p>
                        Selecione um pedido para ver os detalhes e as ações
                        disponíveis.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
