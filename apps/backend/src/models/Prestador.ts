import { Contratacao, Fatura, Financeiro, StatusConta, StatusServico, TipoRegistro, TipoUsuario } from "@prisma/client";
import { Usuario } from "./Usuario";
import { Servico } from "./Servico";

export class Prestador extends Usuario {

    private areaAtuacao: string;
    private experiencia: string;
    private certificacoes: string[];
    private avaliacaoMedia: number = 0;
    private cnpj: string;

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
        this.areaAtuacao = areaAtuacao;
        this.experiencia = experiencia;
        this.certificacoes = certificacoes;
        this.cnpj = cnpj;
    };

    public cadastrarServico(
        titulo: string,
        descricao: string,
        precoBase: number
    ): Servico {
        // Cadastra um serviço...
        const novoServico = new Servico(
            this as any,
            titulo,
            descricao,
            precoBase,
            StatusServico.ATIVO
        );

        console.log(`Cadastro de serviço "${novoServico.getTitulo}" gerada por ${this.getNome}.`);
        return novoServico;
    };

    public atualizarServico(
        servicoId: Servico,
        dados: Partial<Servico>
    ): void {
        // Atualize serviços pela classe Prestador...
        Object.assign(this, dados);
        console.log(`Serviço de ${this.getNome} atualizado.`);
    };

    public calcularAvaliacaoMedia(): void {
        // Calcula a média de uma avaliação...
    };

    public registrarFinanceiro(
        tipo: TipoRegistro,
        valor: number,
        descricao: string
    ): Financeiro {
        // Registra o financeiro de uma cobrança ou ganho (receita ou despesa)
        return {} as Financeiro;
    };

    public emitirFatura(contratacao: Contratacao): Fatura {
        // Gerar fatura de uma contratação...
        return {} as Fatura;
    };

    // Getters e Setters específicos do Prestador
    public get getAreaAtuacao(): string { return this.areaAtuacao; }
    public set setAreaAtuacao(area: string) { this.areaAtuacao = area; }

    public get getExperiencia(): string { return this.experiencia; }
    public set setExperiencia(exp: string) { this.experiencia = exp; }

    public get getCertificacoes(): string[] { return this.certificacoes; }
    public set setCertificacoes(certs: string[]) { this.certificacoes = certs; }

    public get getAvaliacaoMedia(): number { return this.avaliacaoMedia; }

    public get getCnpj(): string { return this.cnpj; }
    public set setCnpj(cnpj: string) { this.cnpj = cnpj; }
};