"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";
import {
  formatCpf,
  formatPhone,
  registrationErrors,
} from "../lib/FormValidation";
import {
  providerErrors,
  professionalErrors,
  type ProviderForm,
  type ProviderErrors,
} from "../lib/ProviderRegistration";
import HomeIcon, { type IconName } from "./home/HomeIcon";
import styles from "../styles/auth-page.module.css";

const Errors = createContext<ProviderErrors>({});
export function readRegistration(form: HTMLFormElement): ProviderForm {
  const data = new FormData(form);
  const names: (keyof ProviderForm)[] = [
    "nome",
    "email",
    "senha",
    "confirmarSenha",
    "cpf",
    "telefone",
    "endereco",
    "cnpj",
    "areaAtuacao",
    "experiencia",
    "certificacoes",
    "titulo",
    "descricao",
    "precoBase",
  ];
  return Object.fromEntries(
    names.map((name) => [name, String(data.get(name) ?? "")]),
  ) as unknown as ProviderForm;
}
export function ValidatedRegistration({
  children,
  provider = false,
  activation = false,
  pending,
  onSubmit,
  id,
}: {
  children: ReactNode;
  provider?: boolean;
  activation?: boolean;
  pending: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  id?: string;
}) {
  const [errors, setErrors] = useState<ProviderErrors>({});
  const touched = useRef(new Set<string>());
  const attempted = useRef(false);
  const validate = (form: HTMLFormElement) =>
    activation
      ? professionalErrors(readRegistration(form))
      : provider
        ? providerErrors(readRegistration(form))
        : registrationErrors(readRegistration(form));
  function refresh(event: FormEvent<HTMLFormElement>, blur: boolean) {
    if (pending) return;
    const target = event.target;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      )
    )
      return;
    if (blur) touched.current.add(target.name);
    const next = validate(event.currentTarget);
    setErrors(
      Object.fromEntries(
        Object.entries(next).filter(
          ([name]) => attempted.current || touched.current.has(name),
        ),
      ),
    );
  }
  return (
    <Errors.Provider value={errors}>
      <form
        id={id}
        noValidate
        aria-busy={pending}
        onBlur={(e) => refresh(e, true)}
        onChange={(e) => refresh(e, false)}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          attempted.current = true;
          const next = validate(e.currentTarget);
          setErrors(next);
          const first = Object.keys(next)[0];
          if (first) {
            (
              e.currentTarget.elements.namedItem(first) as HTMLElement | null
            )?.focus();
            return;
          }
          onSubmit(e);
        }}
      >
        {children}
      </form>
    </Errors.Provider>
  );
}
const placeholders: Record<keyof ProviderForm, string> = {
  nome: "Seu nome completo",
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
  telefone: "(11) 99999-9999",
  endereco: "Rua, número, bairro",
  email: "seu@email.com",
  senha: "De 8 a 128 caracteres",
  confirmarSenha: "Repita a senha",
  areaAtuacao: "Ex.: Montagem de móveis",
  experiencia: "Descreva sua experiência profissional",
  certificacoes:
    "Ex.: Curso de montagem de móveis\nCurso de acabamento em madeira",
  titulo: "Ex.: Montagem de mesa",
  descricao: "Explique o que está incluído no serviço",
  precoBase: "Ex.: 200,50",
};
const icons: Record<keyof ProviderForm, IconName> = {
  nome: "users",
  cpf: "clipboard",
  cnpj: "clipboard",
  telefone: "phone",
  endereco: "location",
  email: "mail",
  senha: "lock",
  confirmarSenha: "lock",
  areaAtuacao: "wrench",
  experiencia: "book",
  certificacoes: "shield",
  titulo: "wrench",
  descricao: "clipboard",
  precoBase: "money",
};
export function RegistrationField({
  name,
  label,
  hint,
  multiline,
  mask,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  name: keyof ProviderForm;
  label: string;
  hint?: string;
  multiline?: boolean;
  mask?: (s: string) => string;
}) {
  const error = useContext(Errors)[name];
  const description =
    [hint ? `${name}-hint` : "", error ? `${name}-error` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const common = {
    id: name,
    name,
    required: props.required ?? true,
    className: styles["form-input"],
    placeholder: placeholders[name],
    "aria-invalid": Boolean(error),
    "aria-describedby": description,
  };
  return (
    <div className={styles["form-group"]}>
      <label className={styles["form-label"]} htmlFor={name}>
        {label}
      </label>
      <div
        className={`${styles["input-wrap"]} ${multiline ? styles.multiline : ""}`}
      >
        <span className={styles["input-icon"]}>
          <HomeIcon name={icons[name]} size={18} />
        </span>
        {multiline ? (
          <textarea {...common} maxLength={props.maxLength} rows={3} />
        ) : (
          <input
            {...props}
            {...common}
            onChange={
              mask
                ? (e) => {
                    e.currentTarget.value = mask(e.currentTarget.value);
                  }
                : undefined
            }
          />
        )}
      </div>
      {hint && (
        <p id={`${name}-hint`} className={styles.fieldHint}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${name}-error`}
          className={styles.fieldError}
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
export function PersonalRegistrationFields() {
  return (
    <>
      <RegistrationField
        name="nome"
        label="Nome completo"
        autoComplete="name"
        maxLength={191}
      />
      <RegistrationField
        name="cpf"
        label="CPF"
        inputMode="numeric"
        maxLength={14}
        mask={formatCpf}
      />
      <RegistrationField
        name="telefone"
        label="Telefone"
        autoComplete="tel"
        inputMode="tel"
        maxLength={15}
        mask={formatPhone}
      />
      <RegistrationField
        name="endereco"
        label="Endereço"
        autoComplete="street-address"
        maxLength={191}
      />
      <RegistrationField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        maxLength={191}
      />
      <RegistrationField
        name="senha"
        label="Senha"
        type="password"
        autoComplete="new-password"
        maxLength={128}
      />
      <RegistrationField
        name="confirmarSenha"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        maxLength={128}
      />
    </>
  );
}
