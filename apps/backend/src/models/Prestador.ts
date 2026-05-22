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

        return novoServico;
    };

    public atualizarServico(
        servicoId: Servico,
        dados: Partial<Servico>
    ): void {
        // Atualize serviços pela classe Prestador...
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
};