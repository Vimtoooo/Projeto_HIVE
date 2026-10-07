"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { professionalsList } from "../../services/ProfessionalsApi";
import type { ProfessionalsPage } from "../../services/ProfessionalsApi";
import HomeIcon from "../home/HomeIcon";
import ProfessionalCard from "./ProfessionalCard";
import ProfessionalDetails from "./ProfessionalDetails";
import styles from "../../styles/professionals-page.module.css";
export default function ProfessionalsWorkspace() {
  const params = useSearchParams();
  return <Catalog key={params.toString()} query={params.toString()} />;
}
function Catalog({ query }: { query: string }) {
  const router = useRouter(),
    params = new URLSearchParams(query);
  const text = params.get("texto") || "",
    area = params.get("areaAtuacao") || "";
  const page = Number(params.get("pagina") || 1),
    rawId = params.get("profissional"),
    selected = rawId === null ? null : Number(rawId);
  const valid =
    Number.isSafeInteger(page) &&
    page > 0 &&
    page <= 100000 &&
    text.length <= 191 &&
    area.length <= 191 &&
    (selected === null ||
      (Number.isSafeInteger(selected) &&
        selected > 0 &&
        selected <= 2147483647));
  const [draft, setDraft] = useState(text),
    [areaDraft, setAreaDraft] = useState(area);
  const [data, setData] = useState<ProfessionalsPage | null>(null),
    [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const listQuery = new URLSearchParams({
    ...(text ? { texto: text } : {}),
    ...(area ? { areaAtuacao: area } : {}),
    pagina: String(page),
    limite: "12",
  }).toString();
  useEffect(() => {
    if (!valid) return;
    let active = true;
    professionalsList(listQuery)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Falha ao carregar catálogo.",
          );
      });
    return () => {
      active = false;
    };
  }, [listQuery, valid, retry]);
  const href = (values: Record<string, string>) =>
    "/profissionais?" +
    new URLSearchParams({
      ...(text ? { texto: text } : {}),
      ...(area ? { areaAtuacao: area } : {}),
      pagina: String(page),
      ...values,
    });
  return (
    <section className={styles.page} aria-labelledby="professionals-title">
      <header className={styles.heading}>
        <span className={styles.eyebrow}>ENCONTRE QUEM PODE AJUDAR</span>
        <h1 id="professionals-title">
          <HomeIcon name="users" /> Profissionais
        </h1>
        <p>Conheça os profissionais cadastrados e seus serviços disponíveis.</p>
      </header>
      <form
        className={styles.filters}
        onSubmit={(e) => {
          e.preventDefault();
          router.push(
            "/profissionais?" +
              new URLSearchParams({
                ...(draft.trim() ? { texto: draft.trim() } : {}),
                ...(areaDraft.trim() ? { areaAtuacao: areaDraft.trim() } : {}),
              }),
          );
        }}
      >
        <label>
          Nome ou serviço
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={191}
            placeholder="Busque um profissional ou serviço"
          />
        </label>
        <label>
          Área de atuação
          <input
            value={areaDraft}
            onChange={(e) => setAreaDraft(e.target.value)}
            maxLength={191}
            placeholder="Ex.: Elétrica"
          />
        </label>
        <button className={styles.primary}>Buscar</button>
        <Link href="/profissionais">Limpar filtros</Link>
      </form>
      {!valid ? (
        <p role="alert">
          Filtros inválidos.{" "}
          <Link href="/profissionais">Voltar ao catálogo</Link>
        </p>
      ) : (
        <div className={`${styles.panels} ${selected ? styles.hasDetail : ""}`}>
          <section className={styles.list} aria-label="Lista de profissionais">
            {error ? (
              <div role="alert">
                <p>{error}</p>
                <button onClick={() => setRetry((v) => v + 1)}>
                  Tentar novamente
                </button>
              </div>
            ) : !data ? (
              <p role="status">Carregando profissionais…</p>
            ) : (
              <>
                <p role="status">
                  {data.total}{" "}
                  {data.total === 1
                    ? "profissional encontrado"
                    : "profissionais encontrados"}{" "}
                  · Ordenados por nome
                </p>
                {!data.itens.length && (
                  <div className={styles.empty}>
                    <HomeIcon name="users" size={30} />
                    <h2>Nenhum profissional nesta página</h2>
                    <p>Tente outra busca ou retorne à primeira página.</p>
                    <Link href={href({ pagina: "1" })}>Primeira página</Link>
                  </div>
                )}
                <div className={styles.cards}>
                  {data.itens.map((p) => (
                    <ProfessionalCard
                      key={p.idPrestador}
                      professional={p}
                      selected={selected === p.idPrestador}
                      href={href({ profissional: String(p.idPrestador) })}
                    />
                  ))}
                </div>
                <nav
                  className={styles.pagination}
                  aria-label="Páginas do catálogo"
                >
                  {page > 1 ? (
                    <Link href={href({ pagina: String(page - 1) })}>
                      Anterior
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span>Página {page}</span>
                  {page * data.limite < data.total ? (
                    <Link href={href({ pagina: String(page + 1) })}>
                      Próxima
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              </>
            )}
          </section>
          {selected ? (
            <ProfessionalDetails key={selected} id={selected} back={href({})} />
          ) : (
            <aside className={styles.placeholder}>
              <HomeIcon name="users" size={34} />
              <h2>Um profissional, muitas possibilidades</h2>
              <p>
                Selecione Ver detalhes para conhecer os serviços, conversar ou
                iniciar uma solicitação.
              </p>
              <small>
                Os exemplos fictícios continuam identificados na Home.
              </small>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
