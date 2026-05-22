import { Fatura, FormaPagamento, Indicacao, Servico, Usuario, StatusContratacao } from "@prisma/client";

export class Contratacao {
    private static proximoId: number = 1;

    private idContratacao: number;
    private indicacao: Indicacao;
    private servico: Servico;
    private contratante: Usuario;
    private fatura: Fatura;
    private dataContratacao: Date;
    private status: StatusContratacao;
    private valor: number;
    private formaPagamento: FormaPagamento;
    private dataVencimento?: Date;

    constructor(
        indicacao: Indicacao,
        servico: Servico,
        contratante: Usuario,
        fatura: Fatura,
        valor: number,
        formaPagamento: FormaPagamento,
        dataVencimento?: Date
    ) {
        this.idContratacao = Contratacao.proximoId++;
        this.indicacao = indicacao;
        this.servico = servico;
        this.contratante = contratante;
        this.fatura = fatura;
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
        // Lógica para calcular valor com possíveis descontos ou taxas
        return this.valor;
    };

    public gerarFatura(): Fatura {
        // Aqui você implementaria a lógica para criar uma nova instância de Fatura
        // baseada nos dados desta contratação.
        // this.fatura = new

        console.log("Fatura gerada com sucesso.");
        return {} as Fatura; // Placeholder
    };
};