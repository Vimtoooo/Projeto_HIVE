"use client";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "../styles/auth-page.module.css";
import { login } from "../services/ApiClient";
export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const senha = String(fields.get("senha") ?? "");
    if (!email || !senha) {
      setError("Preencha o e-mail e a senha.");
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    try {
      await login({ email, senha });
      router.push("/home");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível entrar.",
      );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <div className={styles.screen}>
      <div className={styles["page"]}>
        <aside className={styles["painel-left"]}>
          <div className={styles["left-top"]}>
            <Link href="#" className={styles["logo"]}>
              <Image
                width={80}
                height={80}
                unoptimized
                className={styles["logo-icon"]}
                src="/images/hive-logo.png"
                alt="HIVE Logo"
              />
              <span className={styles["logo-text"]}>HIVE</span>
            </Link>

            <h1 className={styles["left-headline"]}>
              Profissionais
              <br />
              ao seu <em> alcance</em>
            </h1>
            <p className={styles["left-sub"]}>
              Conectamos você com os melhores prestadores de serviço perto de
              você — com avaliações verificadas e total segurança
            </p>
          </div>

          <blockquote className={styles["testimonial"]}>
            <p className={styles["testimonial-quote"]}>
              &quot;Encontrei um eletricista certificado em menos de 10 minutos.
              O serviço ficou impecável e o preço foi justo. Indico o HIVE para
              todos!&quot;
            </p>
            <div className={styles["testimonial-author"]}>
              <div className={styles["testimonial-avatar"]}>A</div>
              <div>
                <div className={styles["testimonial-name"]}>Ana Rodrigues</div>
                <div className={styles["testimonial-role"]}>
                  Usuária desde 2024 · São Paulo
                </div>
              </div>
              <div className={styles["testimonial-stars"]}>★★★★★</div>
            </div>
          </blockquote>
        </aside>

        <main className={styles["panel-right"]}>
          <Link href="#" className={styles["btn-back"]}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Voltar
          </Link>

          <Link href="/cadastro" className={styles["link-subscribe"]}>
            Novo por aqui? <span>Cadastrar-se</span>
          </Link>

          <form className={styles["form-card"]} onSubmit={handleSubmit}>
            <div className={styles["form-greeting"]}>
              <div className={styles["form-greeting-tag"]}>
                👋 Bem-vindo de volta
              </div>
              <h2 className={styles["form-title"]}>Olá!</h2>
              <p className={styles["form-subtitle"]}>
                Confirme sua senha para entrar na sua conta.
              </p>
            </div>

            <div className={styles["form-group"]}>
              <label className={styles["form-label"]} htmlFor="email">
                E-mail
              </label>
              <div className={styles["input-wrap"]}>
                <svg
                  className={styles["input-icon"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  className={styles["form-input"]}
                  type="email"
                  id="email"
                  required
                  name="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles["form-group"]}>
              <label className={styles["form-label"]} htmlFor="senha">
                Senha
              </label>
              <div className={styles["input-wrap"]}>
                <svg
                  className={styles["input-icon"]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  className={styles["form-input"]}
                  type="password"
                  id="senha"
                  required
                  name="senha"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className={styles["form-row"]}>
              <Link href="#" className={styles["link-forgot"]}>
                Esqueci minha senha
              </Link>
            </div>

            <p role="alert" className={styles.error}>
              {error}
            </p>
            <button
              type="submit"
              disabled={pending}
              className={styles["btn-login"]}
              id="btn-login"
            >
              {pending ? "Entrando..." : "Logar"}
            </button>
            <Link href="/cadastro" className={styles["btn-register"]}>
              Cadastrar-se
            </Link>

            <div className={styles["divider"]}>
              <div className={styles["divider-line"]}></div>
              <span className={styles["divider-text"]}>Ou</span>
              <div className={styles["divider-line"]}></div>
            </div>

            <div className={styles["social-btns"]}>
              <Link href="#" className={styles["btn-social"]}>
                <Image
                  width={80}
                  height={80}
                  unoptimized
                  className={styles["google-icon"]}
                  src="/images/google-logo.png"
                  alt="google-Logo"
                />
              </Link>
              <Link href="#" className={styles["btn-social"]}>
                <Image
                  width={80}
                  height={80}
                  unoptimized
                  className={styles["facebook-icon"]}
                  src="/images/facebook-logo.png"
                  alt=" facebook-logo"
                />
              </Link>
            </div>

            <p className={styles["switch-account"]}>
              Deseja criar uma conta? <Link href="/cadastro">Cadastrar-se</Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
