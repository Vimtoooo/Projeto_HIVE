import { TipoRegistro } from "@prisma/client";
import { Contratacao } from "./Contratacao";
import { Fatura } from "./Fatura";

export class Financeiro {

    private static proximoId: number = 1;

    private idFinanceiro: number;
    private fatura?: Fatura; // Fatura é opcional no schema.prisma
    private contratacao: Contratacao;
    private tipoRegistro: TipoRegistro;
    private valor: number;
    private descricao?: string;
    private dataRegistro: Date = new Date();

    public constructor(
        contratacao: Contratacao,
        tipoRegistro: TipoRegistro,
        valor: number,
        descricao?: string,
        fatura?: Fatura, // Tornando fatura opcional no construtor
    ) {
        this.idFinanceiro = Financeiro.proximoId++;
        this.fatura = fatura; // Atribui a fatura se for fornecida
        this.contratacao = contratacao;
        this.tipoRegistro = tipoRegistro;
        this.valor = valor;
        this.descricao = descricao;
    };

    // Métodos estáticos de fábrica para criar novos registros financeiros
    // Em uma aplicação real, isso seria feito por um serviço ou repositório
    public static registrarReceita(
        contratacao: Contratacao,
        valor: number,
        descricao?: string,
        fatura?: Fatura
    ): Financeiro {
        console.log(`Receita de R$${valor} registrada para a contratação ${contratacao.getIdContratacao}.`);
        return new Financeiro(contratacao, TipoRegistro.RECEITA, valor, descricao, fatura);
    };

    public static registrarDespesa(
        contratacao: Contratacao,
        valor: number,
        descricao?: string,
        fatura?: Fatura
    ): Financeiro {
        console.log(`Despesa de R$${valor} registrada para a contratação ${contratacao.getIdContratacao}.`);
        return new Financeiro(contratacao, TipoRegistro.DESPESA, valor, descricao, fatura);
    };

    // Getters e Setters
    public get getIdFinanceiro(): number { return this.idFinanceiro; }

    public get getFatura(): Fatura | undefined { return this.fatura; }

    public get getContratacao(): Contratacao { return this.contratacao; }

    public get getTipoRegistro(): TipoRegistro { return this.tipoRegistro; }

    public get getValor(): number { return this.valor; }

    public get getDescricao(): string | undefined { return this.descricao; }
    public set setDescricao(desc: string) {
        this.descricao = desc ? desc.trim() : undefined;
    };

    public get getDataRegistro(): Date { return this.dataRegistro; }
};