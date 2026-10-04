"use client";
import { useEffect, useState } from "react";
import {
  professionalReviews,
  type ReviewsPage,
} from "../../services/ProfessionalsApi";
import styles from "../../styles/reviews.module.css";

export default function ProfessionalReviews({ id }: { id: number }) {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    page: number;
    data?: ReviewsPage;
    error?: string;
  } | null>(null);
  useEffect(() => {
    let alive = true;
    professionalReviews(id, page)
      .then((data) => {
        if (alive) setResult({ page, data });
      })
      .catch((e) => {
        if (alive)
          setResult({
            page,
            error:
              e instanceof Error ? e.message : "Falha ao carregar avaliações.",
          });
      });
    return () => {
      alive = false;
    };
  }, [id, page, retry]);
  const current = result?.page === page ? result : null;
  return (
    <section className={styles.panel} aria-label="Avaliações dos clientes">
      <h3>Avaliações dos clientes</h3>
      {!current && <p role="status">Carregando avaliações…</p>}
      {current?.error && (
        <div role="alert">
          <p>{current.error}</p>
          <button onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {current?.data && (
        <>
          {!current.data.total && (
            <p>
              Ainda não há avaliações. Elas aparecem após a conclusão dos
              serviços.
            </p>
          )}
          {current.data.itens.map((review) => (
            <article className={styles.review} key={review.idAvaliacao}>
              <strong>
                {review.autor} ·{" "}
                <span className={styles.rating}>★ {review.nota} de 5</span>
              </strong>
              <small>
                {review.servico} ·{" "}
                {new Date(review.dataAvaliacao).toLocaleDateString("pt-BR")}
              </small>
              <p>{review.comentario || "Sem comentário."}</p>
            </article>
          ))}
          {current.data.total > current.data.limite && (
            <nav
              className={styles.pagination}
              aria-label="Páginas de avaliações"
            >
              <button
                disabled={page === 1}
                onClick={() => setPage((v) => v - 1)}
              >
                Avaliações anteriores
              </button>
              <span>Página {page}</span>
              <button
                disabled={page * current.data.limite >= current.data.total}
                onClick={() => setPage((v) => v + 1)}
              >
                Próximas avaliações
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
