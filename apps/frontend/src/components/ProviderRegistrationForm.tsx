"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  RegistrationField as Field,
  ValidatedRegistration,
} from "./RegistrationFields";
import HomeIcon from "./home/HomeIcon";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCpf, formatPhone } from "../lib/FormValidation";
import {
  formatCnpj,
  providerInput,
  validateProvider,
  type ProviderForm,
} from "../lib/ProviderRegistration";
import { registerProvider } from "../services/ProviderRegistrationApi";
import styles from "../styles/auth-page.module.css";
import formStyles from "../styles/provider-registration.module.css";

export default function ProviderRegistrationForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const fields = new FormData(event.currentTarget);
    const field = (name: keyof ProviderForm) => String(fields.get(name) ?? "");
    const form: ProviderForm = {
      nome: field("nome"),
      email: field("email"),
      senha: field("senha"),
      confirmarSenha: field("confirmarSenha"),
      cpf: field("cpf"),
      telefone: field("telefone"),
      endereco: field("endereco"),
      cnpj: field("cnpj"),
      areaAtuacao: field("areaAtuacao"),
      experiencia: field("experiencia"),
      certificacoes: field("certificacoes"),
      titulo: field("titulo"),
      descricao: field("descricao"),
      precoBase: field("precoBase"),
    };
    const invalid = validateProvider(form);
    if (invalid) {
      showError(invalid);
      return;
    }
    sending.current = true;
    setPending(true);
    setError("");
    try {
      await registerProvider(providerInput(form));
      router.push("/login");
      // Mantém o bloqueio até a navegação concluir, evitando um segundo cadastro.
    } catch (cause: unknown) {
      showError(
        cause instanceof Error ? cause.message : "Não foi possível cadastrar.",
      );
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <div className={styles.screen}>
      <div className={styles.page}>
        <aside
          className={`${styles["painel-left"]} ${formStyles.providerAside}`}
        >
          <div className={styles["left-top"]}>
            <Link href="/login" className={styles.logo}>
              <Image
                className={styles["logo-icon"]}
                src="/images/hive-logo.png"
                width={44}
                height={44}
                alt=""
                unoptimized
              />
              <span className={styles["logo-text"]}>HIVE</span>
            </Link>
            <h1 className={styles["left-headline"]}>
              Seu trabalho
              <br />
              no <em>HIVE</em>
            </h1>
            <p className={styles["left-sub"]}>
              Crie seu perfil profissional e apresente seu primeiro serviço para
              quem precisa dele.
            </p>
          </div>
          <div className={formStyles.steps}>
            <svg
              className={formStyles.honeycomb}
              viewBox="0 0 240 110"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M60 10 95 30v40L60 90 25 70V30ZM130 10l35 20v40l-35 20-35-20V30ZM200 10l35 20v40l-35 20-35-20V30Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m45 50 10 10 20-25 M115 45h30v20h-30z M185 35h30v25h-15l-10 10V60h-5z"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
            <h2>Um caminho para novas conexões</h2>
            <ol>
              <li>
                <HomeIcon name="users" />
                <div>
                  <h3>Crie seu perfil</h3>
                  <p>Conte sua experiência e sua área de atuação.</p>
                </div>
              </li>
              <li>
                <HomeIcon name="wrench" />
                <div>
                  <h3>Apresente seu serviço</h3>
                  <p>Explique o que você oferece e informe o preço inicial.</p>
                </div>
              </li>
              <li>
                <HomeIcon name="message" />
                <div>
                  <h3>Converse com clientes</h3>
                  <p>Receba contatos e combine os detalhes pelo HIVE.</p>
                </div>
              </li>
            </ol>
          </div>
          <div className={formStyles.providerGuide}>
            <section className={formStyles.guideSection}>
              <span className={formStyles.guideIcon}>
                <HomeIcon name="clipboard" size={28} />
              </span>
              <h2>Prepare seu cartão de apresentação</h2>
              <p>
                Um perfil claro ajuda o cliente a entender como você pode
                ajudar.
              </p>
              <ul>
                <li>
                  <HomeIcon name="check" />
                  <span>Informe sua área de atuação com precisão.</span>
                </li>
                <li>
                  <HomeIcon name="check" />
                  <span>
                    Conte sua experiência com exemplos do seu trabalho.
                  </span>
                </li>
                <li>
                  <HomeIcon name="check" />
                  <span>Liste somente as certificações que você possui.</span>
                </li>
              </ul>
            </section>
            <section className={formStyles.serviceGuide}>
              <span className={formStyles.guideIcon}>
                <HomeIcon name="wrench" size={28} />
              </span>
              <h2>Seu serviço, bem explicado</h2>
              <p>
                Transforme o que você sabe fazer em uma oferta fácil de
                entender.
              </p>
              <dl>
                <div>
                  <dt>O que você faz</dt>
                  <dd>Escolha um título específico para o serviço.</dd>
                </div>
                <div>
                  <dt>O que está incluído</dt>
                  <dd>Descreva as atividades e os limites do atendimento.</dd>
                </div>
                <div>
                  <dt>Qual é o preço inicial</dt>
                  <dd>Informe um valor coerente com o serviço descrito.</dd>
                </div>
              </dl>
            </section>
            <section className={formStyles.guideSection}>
              <span className={formStyles.guideIcon}>
                <HomeIcon name="message" size={28} />
              </span>
              <h2>Boas conexões começam na conversa</h2>
              <p>
                Antes de iniciar um trabalho, alinhe com o cliente o que será
                feito, o prazo e o valor. Use as mensagens para esclarecer
                dúvidas e combinar os próximos passos.
              </p>
              <div className={formStyles.guideNote}>
                <HomeIcon name="shield" />
                <p>
                  Cuide dos seus dados: evite incluir informações pessoais nas
                  descrições públicas dos serviços.
                </p>
              </div>
            </section>
            <div className={formStyles.guideClosing}>
              <HomeIcon name="sparkle" size={36} />
              <p>
                Seu talento merece
                <br />
                <strong>uma boa apresentação.</strong>
              </p>
              <span>Comece pelo seu perfil. Construa novas conexões.</span>
            </div>
          </div>
        </aside>
        <main className={`${styles["panel-right"]} ${formStyles.panel}`}>
          <Link href="/cadastro" className={styles["btn-back"]}>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar
          </Link>
          <Link href="/login" className={styles["link-subscribe"]}>
            Já tem conta? <span>Entrar</span>
          </Link>
          <div className={`${styles["form-card"]} ${formStyles.card}`}>
            <div className={styles["form-greeting"]}>
              <div className={styles["form-greeting-tag"]}>
                🐝 Bem-vindo ao HIVE
              </div>
              <h2 className={styles["form-title"]}>Cadastro de prestador</h2>
              <p className={styles["form-subtitle"]}>
                Todos os campos são obrigatórios. Você precisa de CNPJ, ao menos
                uma certificação e um serviço inicial. Após cadastrar, entre com
                seu e-mail e senha.
              </p>
            </div>
            <ValidatedRegistration provider onSubmit={submit} pending={pending}>
              <fieldset className={formStyles.section} disabled={pending}>
                <legend>1. Dados pessoais</legend>
                <Field
                  name="nome"
                  label="Nome completo"
                  autoComplete="name"
                  minLength={3}
                  maxLength={191}
                />
                <Field
                  name="cpf"
                  label="CPF"
                  inputMode="numeric"
                  maxLength={14}
                  mask={formatCpf}
                />
                <Field
                  name="telefone"
                  label="Telefone"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                  mask={formatPhone}
                />
                <Field
                  name="endereco"
                  label="Endereço"
                  autoComplete="street-address"
                  minLength={5}
                  maxLength={191}
                />
                <Field
                  name="email"
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  maxLength={191}
                />
                <Field
                  name="senha"
                  label="Senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  hint="De 8 a 128 caracteres."
                />
                <Field
                  name="confirmarSenha"
                  label="Confirmar senha"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                />
              </fieldset>
              <fieldset className={formStyles.section} disabled={pending}>
                <legend>2. Perfil profissional</legend>
                <Field
                  name="cnpj"
                  label="CNPJ"
                  inputMode="numeric"
                  maxLength={18}
                  mask={formatCnpj}
                />
                <Field
                  name="areaAtuacao"
                  label="Área de atuação"
                  maxLength={191}
                />
                <Field
                  name="experiencia"
                  label="Experiência"
                  multiline
                  maxLength={191}
                  hint="Descreva sua experiência em até 191 caracteres."
                />
                <Field
                  name="certificacoes"
                  label="Certificações"
                  multiline
                  hint="Uma por linha: de 1 a 20 certificações, até 191 caracteres cada. Informe somente certificações que você possui."
                />
              </fieldset>
              <fieldset className={formStyles.section} disabled={pending}>
                <legend>3. Primeiro serviço</legend>
                <p className={formStyles.hint}>
                  O perfil profissional e o serviço ficarão disponíveis no
                  catálogo. Não inclua dados pessoais na descrição.
                </p>
                <Field
                  name="titulo"
                  label="Título do serviço"
                  minLength={5}
                  maxLength={191}
                  hint="De 5 a 191 caracteres."
                />
                <Field
                  name="descricao"
                  label="Descrição do serviço"
                  multiline
                  maxLength={5000}
                  hint="Até 5000 caracteres."
                />
                <Field
                  name="precoBase"
                  label="Preço base (R$)"
                  inputMode="decimal"
                  hint="De 0,01 a 1.000.000,00. Use vírgula para centavos, por exemplo: 200,50."
                />
              </fieldset>
              <p
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className={styles.error}
              >
                {error}
              </p>
              <button
                type="submit"
                disabled={pending}
                className={styles["btn-login"]}
              >
                {pending ? "Cadastrando..." : "Cadastrar prestador"}
              </button>
            </ValidatedRegistration>
            <p className={styles["switch-account"]}>
              Quer contratar serviços?{" "}
              <Link href="/cadastro">Cadastrar como cliente</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
