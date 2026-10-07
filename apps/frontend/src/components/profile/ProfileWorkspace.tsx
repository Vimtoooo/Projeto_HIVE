"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getProfile, saveProfile } from "../../services/ProfileApi";
import type { Profile, ProfileInput } from "../../services/ProfileApi";
import { ApiError } from "../../services/MessagingApi";
import {
  forgetViewer,
  rememberViewer,
  subscribeViewer,
  readStored,
  parseViewer,
  VIEWER_KEY,
} from "../../lib/ViewerStore";
import { initials } from "../../lib/HomeCatalog";
import HomeIcon from "../home/HomeIcon";
import styles from "../../styles/profile-page.module.css";
const role = {
  CONTRATANTE: "Cliente",
  PRESTADOR: "Prestador",
  AMBOS: "Cliente e prestador",
};
const fields = (p: Profile): ProfileInput => ({
  nome: p.nome,
  telefone: p.telefone,
  endereco: p.endereco,
});
export default function ProfileWorkspace() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [draft, setDraft] = useState<ProfileInput>({
      nome: "",
      telefone: "",
      endereco: "",
    });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [unauthorized, setUnauthorized] = useState(false),
    [retry, setRetry] = useState(0);
  const alive = useRef(false),
    locked = useRef(false),
    owner = useRef<number | null>(null),
    generation = useRef(0);
  useEffect(() => {
    alive.current = true;
    const unsubscribe = subscribeViewer(() => {
      const viewer = parseViewer(readStored(VIEWER_KEY));
      if (owner.current !== null && viewer?.id !== owner.current) {
        generation.current++;
        owner.current = null;
        locked.current = false;
        setProfile(null);
        setDraft({ nome: "", telefone: "", endereco: "" });
        setBusy(false);
        setNotice("");
        setLoading(true);
        setRetry((n) => n + 1);
      }
    });
    return () => {
      alive.current = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    const version = ++generation.current;
    void getProfile()
      .then((p) => {
        if (active && version === generation.current) {
          owner.current = p.idUsuario;
          setProfile(p);
          setDraft(fields(p));
          setError("");
          setUnauthorized(false);
          rememberViewer(p);
        }
      })
      .catch((e) => {
        if (active && version === generation.current) {
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o perfil.",
          );
          if (e instanceof ApiError && e.status === 401) {
            owner.current = null;
            setUnauthorized(true);
            setProfile(null);
            forgetViewer();
          }
        }
      })
      .finally(() => {
        if (active && version === generation.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked.current || !profile) return;
    const input = {
      nome: draft.nome.trim(),
      telefone: draft.telefone.replace(/\D/g, ""),
      endereco: draft.endereco.trim(),
    };
    if (
      input.nome.length < 3 ||
      input.nome.length > 191 ||
      !/^\d{10,11}$/.test(input.telefone) ||
      input.endereco.length < 5 ||
      input.endereco.length > 191
    ) {
      setError(
        "Confira os campos: nome com 3 a 191 caracteres, telefone com 10 ou 11 dígitos e endereço com 5 a 191 caracteres.",
      );
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const version = generation.current;
    try {
      const saved = await saveProfile(input);
      if (alive.current && version === generation.current) {
        if (saved.idUsuario !== profile.idUsuario) {
          owner.current = null;
          setProfile(null);
          setDraft({ nome: "", telefone: "", endereco: "" });
          setLoading(true);
          setRetry((n) => n + 1);
          return;
        }
        setProfile(saved);
        setDraft(fields(saved));
        rememberViewer(saved);
        setNotice("Alterações salvas com sucesso.");
      }
    } catch (e) {
      if (alive.current && version === generation.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Não foi possível salvar. Tente novamente.",
        );
        if (e instanceof ApiError && e.status === 401) {
          owner.current = null;
          setUnauthorized(true);
          setProfile(null);
          setDraft({ nome: "", telefone: "", endereco: "" });
          forgetViewer();
        }
      }
    } finally {
      if (alive.current && version === generation.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }
  if (unauthorized)
    return (
      <section className={styles.state}>
        <h1>Entre para acessar seu perfil</h1>
        <p>Sua sessão terminou ou ainda não foi iniciada.</p>
        <Link href="/login">Entrar na conta</Link>
      </section>
    );
  if (loading)
    return (
      <section className={styles.state}>
        <h1>Meu perfil</h1>
        <p role="status">Carregando seus dados…</p>
      </section>
    );
  if (!profile)
    return (
      <section className={styles.state}>
        <h1>Meu perfil</h1>
        <p role="alert">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setRetry((n) => n + 1);
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  const dirty = JSON.stringify(draft) !== JSON.stringify(fields(profile));
  return (
    <section className={styles.workspace} aria-labelledby="profile-title">
      <header className={styles.heading}>
        <span className={styles.eyebrow}>SEU ESPAÇO NO HIVE</span>
        <h1 id="profile-title">Meu perfil</h1>
        <p>Seus dados atualizados deixam cada conexão mais simples.</p>
      </header>
      <div className={styles.panels}>
        <aside className={styles.summary} aria-label="Resumo da conta">
          <span className={styles.avatar}>{initials(profile.nome)}</span>
          <h2>{profile.nome}</h2>
          <span className={styles.role}>{role[profile.tipoUsuario]}</span>
          <dl>
            <dt>E-mail</dt>
            <dd>{profile.email}</dd>
            <dt>CPF</dt>
            <dd>{profile.cpfMascarado}</dd>
            <dt>No HIVE desde</dt>
            <dd>
              {new Date(profile.dataCadastro).toLocaleDateString("pt-BR")}
            </dd>
          </dl>
          <p className={styles.hint}>
            <HomeIcon name="shield" size={19} />
            Seu CPF aparece mascarado para proteger sua identificação.
          </p>
        </aside>
        <form
          className={styles.form}
          onSubmit={submit}
          aria-label="Editar perfil"
          aria-busy={busy}
        >
          <h2>Informações pessoais</h2>
          <p className={styles.intro}>
            Atualize seu nome e seus dados de contato.
          </p>
          <label htmlFor="profile-name">Nome completo</label>
          <input
            id="profile-name"
            autoComplete="name"
            required
            minLength={3}
            maxLength={191}
            value={draft.nome}
            disabled={busy}
            onChange={(e) => {
              setDraft({ ...draft, nome: e.target.value });
              setNotice("");
            }}
          />
          <label htmlFor="profile-phone">Telefone</label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={20}
            value={draft.telefone}
            disabled={busy}
            aria-describedby="phone-hint"
            onChange={(e) => {
              setDraft({ ...draft, telefone: e.target.value });
              setNotice("");
            }}
          />
          <small id="phone-hint">
            Inclua o DDD. Aceitamos telefone fixo e celular.
          </small>
          <label htmlFor="profile-address">Endereço</label>
          <input
            id="profile-address"
            autoComplete="street-address"
            required
            minLength={5}
            maxLength={191}
            value={draft.endereco}
            disabled={busy}
            onChange={(e) => {
              setDraft({ ...draft, endereco: e.target.value });
              setNotice("");
            }}
          />
          <p className={styles.hint}>
            E-mail, CPF e tipo de conta são exibidos somente para consulta nesta
            etapa.
          </p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className={styles.success} role="status">
              {notice}
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              disabled={busy || !dirty}
              onClick={() => {
                setDraft(fields(profile));
                setError("");
                setNotice("Edição cancelada. Seus dados foram mantidos.");
              }}
            >
              Cancelar edição
            </button>
            <button
              className={styles.primary}
              type="submit"
              disabled={busy || !dirty}
            >
              {busy ? "Salvando…" : "Salvar alterações"}
              <HomeIcon name="check" size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
