import { Fatura, FormaPagamento, Indicacao, Servico, Usuario, StatusContratacao, StatusPagamento } from "@prisma/client";

export class Contratacao {
    private static proximoId: number = 1;

    private idContratacao: number;
    private indicacao?: Indicacao;
    private servico: Servico;
    private contratante: Usuario;
    private fatura?: Fatura;
    private dataContratacao: Date;
    private status: StatusContratacao;
    private valor: number;
    private formaPagamento: FormaPagamento;
    private dataVencimento?: Date;

    constructor(
        servico: Servico,
        contratante: Usuario,
        valor: number,
        formaPagamento: FormaPagamento,
        indicacao?: Indicacao,
        dataVencimento?: Date
    ) {
        this.idContratacao = Contratacao.proximoId++;
        this.servico = servico;
        this.contratante = contratante;
        this.indicacao = indicacao;
        this.dataContratacao = new Date();
        this.status = StatusContratacao.PENDENTE;
        this.valor = valor;
        this.formaPagamento = formaPagamento;
        this.dataVencimento = dataVencimento;
    };

    public iniciar(): void {
        this.status = StatusContratacao.EM_ANDAMENTO;
    };

    public cancelar(): void {
        this.status = StatusContratacao.CANCELADA;
    };

    public concluir(): void {
        this.status = StatusContratacao.CONCLUIDA;
    };

    public calcularValorFinal(): number {
        let valorFinal = this.valor;

        // Exemplo de ajuste: Se houver indicação, aplica-se um desconto de 5%
        if (this.indicacao) {
            valorFinal = valorFinal * 0.95;
        };

        // Aqui poderiam entrar outros ajustes do Prestador (taxas extras, materiais, etc)
        return valorFinal;
    };

    public gerarFatura(): Fatura {
        const valorFinal = this.calcularValorFinal();

        // Criamos o objeto de Fatura seguindo a interface do Prisma
        const novaFatura: Fatura = {
            idFatura: Math.floor(Math.random() * 10000), // Placeholder para ID real
            dataEmissao: new Date(),
            valorTotal: valorFinal,
            statusPagamento: StatusPagamento.PENDENTE,
            dataPagamento: null,
            usuarioId: this.contratante.idUsuario,
            contratacaoId: this.idContratacao
        };

        this.fatura = novaFatura;

        console.log("Fatura gerada com sucesso.");
        return novaFatura;
    };

    // Getters e Setters
    public get getIdContratacao(): number { return this.idContratacao; }

    public get getServico(): Servico { return this.servico; }

    public get getContratante(): Usuario { return this.contratante; }

    public get getStatus(): StatusContratacao { return this.status; }
    public set setStatus(status: StatusContratacao) { this.status = status; }

    public get getValor(): number { return this.valor; }
    public set setValor(valor: number) { this.valor = valor; }

    public get getFormaPagamento(): FormaPagamento { return this.formaPagamento; }
    public set setFormaPagamento(forma: FormaPagamento) { this.formaPagamento = forma; }

    public get getDataVencimento(): Date | undefined { return this.dataVencimento; }
    public set setDataVencimento(data: Date) { this.dataVencimento = data; }
};