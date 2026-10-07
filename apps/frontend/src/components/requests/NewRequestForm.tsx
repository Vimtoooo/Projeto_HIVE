"use client";
import { useEffect, useRef, useState } from "react";
import {
  createRequest,
  payments,
  requestServices,
} from "../../services/RequestsApi";
import type { CatalogService } from "../../services/RequestsApi";
import { professionalDetail } from "../../services/ProfessionalsApi";
import { session } from "../../services/MessagingApi";
import { requestMoney as money } from "../../lib/RequestFormatting";
import styles from "../../styles/requests-page.module.css";
export default function NewRequestForm({
  user,
  onCreated,
  onUnauthorized,
  initialProfessional,
  initialService,
}: {
  user: number;
  initialProfessional?: string | null;
  initialService?: string | null;
  onCreated: (id: number) => void;
  onUnauthorized: () => void;
}) {
  const [services, setServices] = useState<CatalogService[]>([]),
    [selected, setSelected] = useState<CatalogService | null>(null);
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0);
  const [payment, setPayment] = useState<keyof typeof payments>("PIX"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [initialLoading, setInitialLoading] = useState(
    Boolean(initialProfessional || initialService),
  );
  const [initialError, setInitialError] = useState("");
  useEffect(() => {
    if (!initialProfessional && !initialService) return;
    let active = true;
    async function loadSelected() {
      try {
        const providerId = Number(initialProfessional),
          serviceId = Number(initialService);
        if (
          !Number.isSafeInteger(providerId) ||
          providerId <= 0 ||
          !Number.isSafeInteger(serviceId) ||
          serviceId <= 0 ||
          providerId === user
        )
          throw Error(
            "Seleção de serviço inválida. Escolha outro serviço na lista.",
          );
        const provider = await professionalDetail(providerId);
        const service = provider.servicos.find(
          (item) => item.idServico === serviceId,
        );
        if (!service)
          throw Error(
            "O serviço escolhido não está mais disponível. Escolha outro serviço.",
          );
        if (active)
          setSelected({
            ...service,
            prestador: {
              idPrestador: provider.idPrestador,
              nome: provider.nome,
            },
          });
      } catch (e) {
        if (active)
          setInitialError(
            e instanceof Error ? e.message : "Serviço indisponível.",
          );
      } finally {
        if (active) setInitialLoading(false);
      }
    }
    void loadSelected();
    return () => {
      active = false;
    };
  }, [initialProfessional, initialService, user]);
  const pending = useRef<{ payload: string; key: string } | null>(null),
    locked = useRef(false);
  useEffect(() => {
    let alive = true;
    requestServices(query, page)
      .then((data) => {
        if (alive) {
          setServices(
            data.itens.filter((s) => s.prestador.idPrestador !== user),
          );
          setTotal(data.total);
          setError("");
        }
      })
      .catch((e) => {
        if (alive)
          setError(e instanceof Error ? e.message : "Falha no catálogo.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, page, user, reload]);
  async function submit() {
    if (!selected || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    const payload = JSON.stringify([selected.idServico, payment]);
    if (pending.current?.payload !== payload)
      pending.current = { payload, key: crypto.randomUUID() };
    try {
      const current = await session();
      if (current.idUsuario !== user) {
        onUnauthorized();
        return;
      }
      const row = await createRequest(
        selected.idServico,
        payment,
        pending.current.key,
      );
      if (mounted.current) onCreated(row.idContratacao);
    } catch (e) {
      if (!mounted.current) return;
      if (e instanceof Error && "status" in e && e.status === 401)
        onUnauthorized();
      else
        setError(
          e instanceof Error
            ? e.message
            : "Falha ao solicitar. Tente novamente.",
        );
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className={styles.newForm} aria-label="Nova solicitação">
      <h2>O que você precisa?</h2>
      <p>
        Escolha um serviço cadastrado. O profissional receberá o pedido para
        avaliar.
      </p>
      {initialLoading && <p role="status">Conferindo o serviço escolhido…</p>}
      {initialError && <p role="alert">{initialError}</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <form
        className={styles.search}
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setPage(1);
          setQuery(search);
          setReload((v) => v + 1);
        }}
      >
        <input
          aria-label="Buscar serviço"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
          placeholder="Buscar serviço…"
          disabled={busy}
        />
        <button disabled={busy || loading}>Buscar</button>
      </form>
      {loading ? (
        <p role="status">Carregando serviços…</p>
      ) : (
        <div className={styles.serviceList}>
          {services.map((s) => (
            <button
              type="button"
              key={s.idServico}
              aria-pressed={selected?.idServico === s.idServico}
              onClick={() => {
                setSelected(s);
                setInitialError("");
              }}
              disabled={busy || initialLoading}
            >
              <span>
                <strong>{s.titulo}</strong>
                <small>{s.prestador.nome}</small>
              </span>
              <b>{money(s.precoBase)}</b>
            </button>
          ))}
          {!services.length && (
            <p>Nenhum serviço disponível nesta página. Tente outra busca.</p>
          )}
        </div>
      )}
      <div className={styles.pagination}>
        <button
          type="button"
          disabled={page === 1 || busy || loading}
          onClick={() => {
            setLoading(true);
            setPage(page - 1);
          }}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          type="button"
          disabled={page * 20 >= total || busy || loading}
          onClick={() => {
            setLoading(true);
            setPage(page + 1);
          }}
        >
          Próxima
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {selected && (
          <div className={styles.summary}>
            <h3>{selected.titulo}</h3>
            <p>{selected.descricao}</p>
            <strong>Valor exibido: {money(selected.precoBase)}</strong>
          </div>
        )}
        <label htmlFor="request-payment">Forma de pagamento pretendida</label>
        <select
          id="request-payment"
          value={payment}
          disabled={busy}
          onChange={(e) => setPayment(e.target.value as keyof typeof payments)}
        >
          {Object.entries(payments).map(([v, label]) => (
            <option value={v} key={v}>
              {label}
            </option>
          ))}
        </select>
        <p className={styles.note}>
          O pedido usa o preço vigente no envio. Confira o valor registrado nos
          detalhes. Nenhuma cobrança será realizada por esta tela.
        </p>
        <button
          className={styles.primary}
          disabled={!selected || busy || loading || initialLoading}
        >
          {busy ? "Enviando…" : "Confirmar solicitação"}
        </button>
      </form>
    </section>
  );
}
