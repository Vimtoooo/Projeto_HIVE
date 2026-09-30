"use client";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "../styles/auth-page.module.css";
import { register } from "../services/ApiClient";
import {
  formatCpf,
  formatPhone,
  registrationInput,
  validateRegistration,
} from "../lib/FormValidation";
export default function RegistrationForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const fields = new FormData(event.currentTarget);
    const field = (name: string): string => String(fields.get(name) ?? "");
    const form = {
      nome: field("nome"),
      cpf: field("cpf"),
      telefone: field("telefone"),
      endereco: field("endereco"),
      email: field("email"),
      senha: field("senha"),
      confirmarSenha: field("confirmarSenha"),
    };
    const invalid = validateRegistration(form);
    if (invalid) {
      setError(invalid);
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    try {
      await register(registrationInput(form));
      router.push("/login");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível cadastrar.",
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
            <Link href="/login" className={styles["logo"]}>
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
              Junte-se
              <br />
              ao <em>HIVE</em>
            </h1>
            <p className={styles["left-sub"]}>
              Crie sua conta e conecte-se com os melhores prestadores de serviço
              perto de você.
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
          <Link href="/login" className={styles["btn-back"]}>
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
          <Link href="/login" className={styles["link-subscribe"]}>
            Já tem conta? <span>Entrar</span>
          </Link>

          <div className={styles["form-card"]}>
            <div className={styles["form-greeting"]}>
              <div className={styles["form-greeting-tag"]}>
                🐝 Bem-vindo ao HIVE
              </div>
              <h2 className={styles["form-title"]}>Criar conta</h2>
              <p className={styles["form-subtitle"]}>
                Preencha os dados abaixo para se cadastrar como cliente.
              </p>
            </div>

            <form id="registerForm" onSubmit={handleSubmit}>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]} htmlFor="nome">
                  Nome completo
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
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
                  </svg>
                  <input
                    className={styles["form-input"]}
                    type="text"
                    id="nome"
                    name="nome"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["form-label"]} htmlFor="cpf">
                  CPF
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
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="9" x2="17" y2="9" />
                    <line x1="7" y1="13" x2="13" y2="13" />
                  </svg>
                  <input
                    className={styles["form-input"]}
                    type="text"
                    id="cpf"
                    onChange={(event) => {
                      event.currentTarget.value = formatCpf(
                        event.currentTarget.value,
                      );
                    }}
                    name="cpf"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["form-label"]} htmlFor="telefone">
                  Telefone
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    className={styles["form-input"]}
                    type="text"
                    id="telefone"
                    onChange={(event) => {
                      event.currentTarget.value = formatPhone(
                        event.currentTarget.value,
                      );
                    }}
                    name="telefone"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>
              </div>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]} htmlFor="endereco">
                  Endereço
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
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <input
                    className={styles["form-input"]}
                    type="text"
                    id="endereco"
                    name="endereco"
                    placeholder="Rua, número, bairro"
                    required
                  />
                </div>
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
                    name="email"
                    placeholder="seu@email.com"
                    required
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
                    name="senha"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
              </div>
              <div className={styles["form-group"]}>
                <label
                  className={styles["form-label"]}
                  htmlFor="confirmarSenha"
                >
                  Confirmar senha
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
                    id="confirmarSenha"
                    name="confirmarSenha"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>

              <span id="erro" role="alert" className={styles.error}>
                {error}
              </span>
              <button
                type="submit"
                className={styles["btn-login"]}
                id="btn-register-submit"
                disabled={pending}
              >
                {pending ? "Cadastrando..." : "Cadastrar"}
              </button>
            </form>
            <p className={styles["switch-account"]}>
              Já tem conta? <Link href="/login">Entrar</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
