"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { professionalDetail } from "../../services/ProfessionalsApi";
import type { ProfessionalDetail } from "../../services/ProfessionalsApi";
import {
  ApiError,
  session,
  startConversation,
} from "../../services/MessagingApi";
import { rememberViewer } from "../../lib/ViewerStore";
import { requestMoney } from "../../lib/RequestFormatting";
import { RatingLabel } from "./ProfessionalCard";
import HomeIcon from "../home/HomeIcon";
import ProfessionalReviews from "./ProfessionalReviews";
import styles from "../../styles/professionals-page.module.css";
export default function ProfessionalDetails({
  id,
  back,
}: {
  id: number;
  back: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ProfessionalDetail | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [login, setLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const locked = useRef(false),
    alive = useRef(true),
    title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    professionalDetail(id)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Falha ao carregar profissional.",
          );
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  useEffect(() => {
    if (data) title.current?.focus();
  }, [data]);
  async function act(service?: number) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setActionError("");
    setLogin(false);
    try {
      const user = await session();
      if (!alive.current) return;
      rememberViewer(user);
      if (user.idUsuario === id)
        throw Error("Escolha outro profissional para esta ação.");
      if (service !== undefined) {
        if (user.tipoUsuario === "PRESTADOR")
          throw Error(
            "Esta conta é somente de prestador e não pode solicitar serviços.",
          );
        router.push(
          `/solicitacoes?nova=1&profissional=${id}&servico=${service}`,
        );
      } else {
        const conversation = await startConversation(id);
        if (alive.current)
          router.push(`/mensagens?conversa=${conversation.id}`);
      }
    } catch (e) {
      if (alive.current) {
        if (e instanceof ApiError && e.status === 404) setError(e.message);
        setLogin(e instanceof ApiError && e.status === 401);
        setActionError(
          e instanceof Error ? e.message : "Não foi possível continuar.",
        );
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section className={styles.detail} aria-label="Detalhes do profissional">
      <Link className={styles.back} href={back} scroll={false}>
        ← Voltar à lista
      </Link>
      {error ? (
        <div role="alert">
          <h2>Não foi possível abrir este profissional</h2>
          <p>{error}</p>
          <button onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </button>
        </div>
      ) : !data ? (
        <p role="status">Carregando profissional…</p>
      ) : (
        <>
          <span className={styles.area}>{data.areaAtuacao}</span>
          <h2 ref={title} tabIndex={-1}>
            {data.nome}
          </h2>
          <RatingLabel rating={data.avaliacao} />
          <h3>Experiência</h3>
          <p>{data.experiencia || "Não informada."}</p>
          <h3>Certificações declaradas</h3>
          {data.certificacoes.length ? (
            <ul>
              {data.certificacoes.map((c, index) => (
                <li key={index}>{c}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma certificação informada.</p>
          )}
          <small>
            Informações fornecidas pelo profissional, sem verificação pelo HIVE.
          </small>
          <button
            className={styles.primary}
            disabled={busy}
            onClick={() => void act()}
          >
            <HomeIcon name="message" size={18} />
            {busy ? "Aguarde…" : "Conversar"}
          </button>
          {actionError && (
            <div role="alert">
              <p>{actionError}</p>
              {login && <Link href="/login">Entrar na conta</Link>}
            </div>
          )}
          <h3>Serviços disponíveis</h3>
          {data.servicos.map((s) => (
            <article key={s.idServico} className={styles.service}>
              <h4>{s.titulo}</h4>
              <p>{s.descricao}</p>
              <strong>{requestMoney(s.precoBase)}</strong>
              <button
                disabled={busy}
                onClick={() => void act(s.idServico)}
                aria-label={`Solicitar serviço: ${s.titulo}`}
              >
                Solicitar serviço <HomeIcon name="arrow" size={16} />
              </button>
            </article>
          ))}
          <p className={styles.note}>
            A disponibilidade e o preço serão conferidos no envio do pedido.
            Nenhuma cobrança é realizada aqui.
          </p>
          <ProfessionalReviews key={id} id={id} />
        </>
      )}
    </section>
  );
}
