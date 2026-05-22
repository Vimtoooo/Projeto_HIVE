import { Fatura, Contratacao, TipoRegistro } from "@prisma/client";

export class Financeiro {

    private static proximoId: number = 1;

    private idFinanceiro: number;
    private fatura?: Fatura; // Fatura é opcional no schema.prisma
    private contratacao: Contratacao;
    private tipoRegistro: TipoRegistro;
    private valor: number;
    private descricao?: string;
    private dataRegistro: Date;

    public constructor(
        contratacao: Contratacao,
        tipoRegistro: TipoRegistro,
        valor: number,
        descricao?: string,
        fatura?: Fatura, // Tornando fatura opcional no construtor
        dataRegistro: Date = new Date() // Valor padrão para dataRegistro
    ) {
        this.idFinanceiro = Financeiro.proximoId++;
        this.fatura = fatura; // Atribui a fatura se for fornecida
        this.contratacao = contratacao;
        this.tipoRegistro = tipoRegistro;
        this.valor = valor;
        this.descricao = descricao;
        this.dataRegistro = dataRegistro;
    };

    // Métodos estáticos de fábrica para criar novos registros financeiros
    // Em uma aplicação real, isso seria feito por um serviço ou repositório
    public static registrarReceita(
        contratacao: Contratacao,
        valor: number,
        descricao?: string,
        fatura?: Fatura
    ): Financeiro {
        console.log(`Receita de R$${valor} registrada para a contratação ${contratacao.idContratacao}.`);
        return new Financeiro(contratacao, TipoRegistro.RECEITA, valor, descricao, fatura);
    };

    public static registrarDespesa(
        contratacao: Contratacao,
        valor: number,
        descricao?: string,
        fatura?: Fatura
    ): Financeiro {
        console.log(`Despesa de R$${valor} registrada para a contratação ${contratacao.idContratacao}.`);
        return new Financeiro(contratacao, TipoRegistro.DESPESA, valor, descricao, fatura);
    };
};