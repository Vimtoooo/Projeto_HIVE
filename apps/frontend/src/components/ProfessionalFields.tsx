"use client";
import { RegistrationField as Field } from "./RegistrationFields";
import { formatCnpj } from "../lib/ProviderRegistration";
import formStyles from "../styles/provider-registration.module.css";
export default function ProfessionalFields({
  pending,
  activation = false,
}: {
  pending: boolean;
  activation?: boolean;
}) {
  return (
    <>
      <fieldset className={formStyles.section} disabled={pending}>
        <legend>{activation ? "1" : "2"}. Perfil profissional</legend>
        <Field
          name="cnpj"
          label="CNPJ"
          inputMode="numeric"
          maxLength={18}
          mask={formatCnpj}
        />
        <Field name="areaAtuacao" label="Área de atuação" maxLength={191} />
        <Field
          name="experiencia"
          label="Experiência"
          multiline
          maxLength={191}
          hint="Descreva sua experiência em até 191 caracteres."
        />
        <Field
          name="certificacoes"
          label="Certificações (opcional)"
          required={false}
          multiline
          hint="Uma por linha: até 20 certificações, até 191 caracteres cada. Informe somente certificações que você possui."
        />
      </fieldset>
      <fieldset className={formStyles.section} disabled={pending}>
        <legend>{activation ? "2" : "3"}. Primeiro serviço</legend>
        <p className={formStyles.hint}>
          O perfil profissional e o serviço ficarão disponíveis no catálogo. Não
          inclua dados pessoais na descrição.
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
    </>
  );
}
