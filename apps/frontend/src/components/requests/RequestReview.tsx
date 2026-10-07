"use client";
import { useRef, useState } from "react";
import { ApiError, session } from "../../services/MessagingApi";
import { reviewRequest, type ServiceRequest } from "../../services/RequestsApi";
import styles from "../../styles/reviews.module.css";

export default function RequestReview({
  request,
  userId,
  onSaved,
  onUnauthorized,
}: {
  request: ServiceRequest;
  userId: number;
  onSaved: (row: ServiceRequest) => void;
  onUnauthorized: () => void;
}) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  async function send() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const current = await session();
      if (current.idUsuario !== userId) {
        onUnauthorized();
        return;
      }
      onSaved(await reviewRequest(request.idContratacao, nota, comentario));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) onUnauthorized();
      else
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível enviar. Tente novamente.",
        );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  if (request.avaliacao)
    return (
      <section className={styles.panel} aria-label="Avaliação do serviço">
        <h3>Avaliação do serviço</h3>
        <p className={styles.rating}>★ {request.avaliacao.nota} de 5</p>
        <p>{request.avaliacao.comentario || "Sem comentário."}</p>
        <small>
          Enviada em{" "}
          {new Date(request.avaliacao.dataAvaliacao).toLocaleDateString(
            "pt-BR",
          )}
          . Avaliação definitiva.
        </small>
      </section>
    );
  if (!request.podeAvaliar) return null;
  return (
    <section className={styles.panel} aria-label="Avaliar serviço">
      <h3>Como foi o serviço?</h3>
      <p>Sua avaliação ajuda outras pessoas a escolher um profissional.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (nota) setConfirm(true);
        }}
      >
        <fieldset disabled={busy || confirm} className={styles.score}>
          <legend>Nota do serviço</legend>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="nota"
                value={value}
                required
                checked={nota === value}
                onChange={() => setNota(value)}
              />
              <span>{value} ★</span>
            </label>
          ))}
        </fieldset>
        <label className={styles.comment}>
          Comentário (opcional)
          <textarea
            maxLength={1000}
            rows={4}
            value={comentario}
            disabled={busy || confirm}
            onChange={(event) => setComentario(event.target.value)}
          />
        </label>
        <small>
          {comentario.length}/1000 caracteres. A nota, o comentário e seu
          primeiro nome serão públicos no perfil do profissional.
        </small>
        <p>A avaliação é definitiva e não poderá ser editada após o envio.</p>
        {error && <p role="alert">{error}</p>}
        {confirm ? (
          <div
            role="group"
            aria-label="Confirmar avaliação"
            className={styles.confirm}
          >
            <p>Enviar nota {nota} de 5 definitivamente?</p>
            <button type="button" disabled={busy} onClick={() => void send()}>
              {busy ? "Enviando…" : "Confirmar avaliação"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Revisar
            </button>
          </div>
        ) : (
          <button type="submit" disabled={!nota}>
            Enviar avaliação
          </button>
        )}
      </form>
    </section>
  );
}
