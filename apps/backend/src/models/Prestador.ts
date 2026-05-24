import { StatusConta, StatusServico, TipoRegistro, TipoUsuario } from "@prisma/client";
import { Usuario } from "./Usuario";
import { Servico } from "./Servico";
import { Financeiro } from "./Financeiro";
import { Fatura } from "./Fatura";
import { Contratacao } from "./Contratacao";

export class Prestador extends Usuario {

    private areaAtuacao!: string;
    private experiencia!: string;
    private certificacoes!: string[];
    private avaliacaoMedia: number = 0;
    private cnpj!: string;

    public constructor(
        nome: string,
        email: string,
        senha: string,
        telefone: string,
        cpf: string,
        endereco: string,
        tipoUsuario: TipoUsuario,
        statusConta: StatusConta,
        areaAtuacao: string,
        experiencia: string,
        certificacoes: string[],
        cnpj: string
    ) {
        super(nome, email, senha, telefone, cpf, endereco, tipoUsuario, statusConta);
        this.setAreaAtuacao = areaAtuacao;
        this.setExperiencia = experiencia;
        this.setCertificacoes = certificacoes;
        this.setCnpj = cnpj;
    };

    public cadastrarServico(
        titulo: string,
        descricao: string,
        precoBase: number
    ): Servico {
        // Cadastra um serviço...
        const novoServico = new Servico(
            this,
            titulo,
            descricao,
            precoBase,
            StatusServico.ATIVO
        );

        console.log(`Cadastro de serviço "${novoServico.getTitulo}" gerada por ${this.nome}.`);
        return novoServico;
    };

    public atualizarServico(
        servico: Servico,
        dados: Partial<Servico>
    ): void {
        // Corrigido: Agora mescla os dados no objeto Serviço recebido
        Object.assign(servico, dados);
        console.log(`Serviço "${servico.getTitulo}" atualizado com sucesso.`);
    };

    public calcularAvaliacaoMedia(): void {
        console.log(`Calculando nova média para ${this.nome}...`);
    };

    public registrarFinanceiro(
        contratacao: Contratacao,
        tipo: TipoRegistro,
        valor: number,
        descricao?: string,
        fatura?: Fatura
    ): Financeiro {
        // Registra o financeiro de uma cobrança ou ganho (receita ou despesa)
        const novaFinanca: Financeiro = new Financeiro(
            contratacao,
            tipo,
            valor,
            descricao,
            fatura
        );

        console.log(`Registro financeiro de ${tipo} criado para a contratação #${contratacao.getIdContratacao}`);
        return novaFinanca;
    };

    public emitirFatura(contratacao: Contratacao): Fatura {
        // A Fatura é emitida PARA o Contratante (Cliente)
        // Delegamos a criação para o método que já implementamos na classe Contratacao
        console.log(`Prestador ${this.nome} solicitou a emissão da fatura.`);
        return contratacao.gerarFatura();
    };

    // Getters e Setters específicos do Prestador
    public get getAreaAtuacao(): string { return this.areaAtuacao; }
    public set setAreaAtuacao(area: string) {
        if (area.trim().length === 0) throw new Error("Área de atuação é obrigatória.");
        this.areaAtuacao = area.trim();
    };

    public get getExperiencia(): string { return this.experiencia; }
    public set setExperiencia(exp: string) {
        if (exp.trim().length === 0) throw new Error("Descrição de experiência é obrigatória.");
        this.experiencia = exp.trim();
    };

    public get getCertificacoes(): string[] { return this.certificacoes; }
    public set setCertificacoes(certs: string[]) {
        if (!certs || certs.length === 0) throw new Error("O prestador deve ter ao menos uma certificação ou habilidade listada.");
        this.certificacoes = certs;
    };

    public get getAvaliacaoMedia(): number { return this.avaliacaoMedia; }

    public get getCnpj(): string { return this.cnpj; }
    public set setCnpj(cnpj: string) {
        const cnpjLimpo = cnpj.replace(/\D/g, '');
        if (cnpjLimpo.length !== 14) throw new Error("CNPJ deve conter exatamente 14 dígitos.");
        this.cnpj = cnpjLimpo;
    };
};