"use client";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ValidatedRegistration,
  PersonalRegistrationFields,
} from "./RegistrationFields";
import Image from "next/image";
import HomeIcon from "./home/HomeIcon";
import stepsStyles from "../styles/provider-registration.module.css";
import styles from "../styles/auth-page.module.css";
import { register } from "../services/ApiClient";
import { registrationInput, validateRegistration } from "../lib/FormValidation";
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
          <div className={stepsStyles.steps}>
            <svg
              className={stepsStyles.honeycomb}
              viewBox="0 0 240 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m45 5 39 23v46L45 97 6 74V28z M123 5l39 23v46l-39 23-39-23V28z M201 5l33 23v46l-33 23-39-23V28z" />
              <circle cx="41" cy="46" r="11" />
              <path d="m49 54 12 12 M110 38h26v30h-26z M116 47h14 M116 55h10 M186 38h29v22h-17l-9 8v-8h-3z" />
            </svg>
            <h2>Seu próximo serviço começa aqui</h2>
            <ol>
              <li>
                <HomeIcon name="search" />
                <div>
                  <h3>Encontre profissionais</h3>
                  <p>
                    Explore as áreas de atuação e encontre quem oferece o
                    serviço de que você precisa.
                  </p>
                </div>
              </li>
              <li>
                <HomeIcon name="clipboard" />
                <div>
                  <h3>Compare os serviços</h3>
                  <p>
                    Confira descrições, preços e avaliações disponíveis para
                    escolher com mais informação.
                  </p>
                </div>
              </li>
              <li>
                <HomeIcon name="message" />
                <div>
                  <h3>Converse e combine</h3>
                  <p>
                    Tire dúvidas pelo HIVE e combine os detalhes do serviço
                    diretamente com o profissional.
                  </p>
                </div>
              </li>
            </ol>
          </div>
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

            <Link href="/cadastro/prestador" className={styles["btn-register"]}>
              Quero me cadastrar como prestador
            </Link>
            <ValidatedRegistration
              id="registerForm"
              onSubmit={handleSubmit}
              pending={pending}
            >
              <fieldset disabled={pending} className={styles.personalFields}>
                <PersonalRegistrationFields />
              </fieldset>
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
            </ValidatedRegistration>
            <p className={styles["switch-account"]}>
              Já tem conta? <Link href="/login">Entrar</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
