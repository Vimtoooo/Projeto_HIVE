"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccountSession } from "../../lib/useAccountSession";
import {
  rememberViewer,
  parseViewer,
  readStored,
  VIEWER_KEY,
} from "../../lib/ViewerStore";
import { professionalInput } from "../../lib/ProviderRegistration";
import {
  activateProvider,
  activationMayHaveSucceeded,
} from "../../services/ProviderActivationApi";
import { ApiError, session } from "../../services/MessagingApi";
import { readRegistration, ValidatedRegistration } from "../RegistrationFields";
import ProfessionalFields from "../ProfessionalFields";
import styles from "../../styles/provider-registration.module.css";
import auth from "../../styles/auth-page.module.css";

export default function ProviderActivation() {
  const account = useAccountSession();
  useEffect(() => {
    const current = account.user;
    const displayed = parseViewer(readStored(VIEWER_KEY));
    if (
      current &&
      (displayed?.id !== current.idUsuario || displayed.name !== current.nome)
    )
      rememberViewer(current);
  }, [account.user]);
  if (account.loading) return <p role="status">Consultando sua sessão…</p>;
  if (account.error)
    return (
      <div role="alert">
        {account.error}{" "}
        <button onClick={() => void account.refresh()}>Tentar novamente</button>
      </div>
    );
  if (!account.user)
    return (
      <p>
        Entre na sua conta para ativar o perfil profissional.{" "}
        <Link className="hive-link" href="/login">
          Entrar
        </Link>
      </p>
    );
  if (account.user.possuiPerfilProfissional)
    return (
      <p role="status">
        Seu perfil profissional já está ativo.{" "}
        <Link className="hive-link" href="/perfil">
          Ir para Meu perfil
        </Link>
      </p>
    );
  return (
    <ActivationForm
      key={account.user.idUsuario}
      userId={account.user.idUsuario}
      refresh={account.refresh}
    />
  );
}

function ActivationForm({
  userId,
  refresh,
}: {
  userId: number;
  refresh: () => Promise<unknown>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const alive = useRef(false),
    locked = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function confirm() {
    const current = await session();
    if (!alive.current) return true;
    if (current.idUsuario !== userId) {
      await refresh();
      return true;
    }
    if (current.possuiPerfilProfissional) {
      rememberViewer(current);
      router.replace("/perfil?ativado=1");
      return true;
    }
    return false;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const input = professionalInput(readRegistration(event.currentTarget));
    locked.current = true;
    setPending(true);
    setError("");
    try {
      // Also resolves an uncertain previous response before any repeat write.
      if (await confirm()) return;
      setUncertain(false);
      try {
        await activateProvider(input);
      } catch (cause) {
        if (!activationMayHaveSucceeded(cause)) throw cause;
        if (await confirm()) return;
        throw cause;
      }
      if (!(await confirm())) {
        setUncertain(true);
        throw Error(
          "A resposta foi recebida, mas a sessão ainda não confirmou a ativação. Tente consultar novamente.",
        );
      }
    } catch (cause) {
      if (!alive.current) return;
      if (cause instanceof ApiError && cause.status === 401) {
        await refresh();
        return;
      }
      setUncertain(activationMayHaveSucceeded(cause));
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível confirmar a ativação.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      if (alive.current) {
        locked.current = false;
        setPending(false);
      }
    }
  }
  return (
    <section
      className={`${auth.screen} ${styles.activation}`}
      aria-labelledby="activation-title"
    >
      <Link className="hive-link" href="/perfil">
        ← Meu perfil
      </Link>
      <h1 id="activation-title">Ativar perfil profissional</h1>
      <p>
        Continue contratando e passe a oferecer serviços com a mesma conta e
        histórico.
      </p>
      <p>
        CNPJ e primeiro serviço são obrigatórios. Autônomos sem CNPJ não podem
        concluir. Validamos apenas o formato do CNPJ, sem consulta oficial.
        Certificações são opcionais.
      </p>
      <ValidatedRegistration activation pending={pending} onSubmit={submit}>
        <ProfessionalFields pending={pending} activation />
        <p role="alert" tabIndex={-1} ref={errorRef} className={auth.error}>
          {error}
        </p>
        {uncertain && (
          <p role="status">
            A ativação pode ter sido concluída. Ao tentar novamente,
            consultaremos sua sessão antes de reenviar.
          </p>
        )}
        <button type="submit" className={auth["btn-login"]} disabled={pending}>
          {pending
            ? "Confirmando…"
            : uncertain
              ? "Consultar e tentar novamente"
              : "Ativar perfil profissional"}
        </button>
      </ValidatedRegistration>
    </section>
  );
}
