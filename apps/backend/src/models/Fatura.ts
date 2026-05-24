import { FormaPagamento, StatusPagamento } from "@prisma/client";
import { Usuario } from "./Usuario";
import { Contratacao } from "./Contratacao";
import { Financeiro } from "./Financeiro";

export class Fatura {

    private static proximoId: number = 1;

    private idFatura: number;
    private usuario!: Usuario;
    private contratacao!: Contratacao;
    private financeiros: Financeiro[]; // Alterado para array conforme schema.prisma
    private dataEmissao: Date;
    private valorTotal!: number;
    private statusPagamento!: StatusPagamento;
    private dataPagamento?: Date | null;

    public constructor(
        usuario: Usuario,
        contratacao: Contratacao,
        valorTotal: number,
        statusPagamento: StatusPagamento = StatusPagamento.PENDENTE
    ) {
        this.idFatura = Fatura.proximoId++;
        this.setUsuario = usuario;
        this.setContratacao = contratacao;
        this.financeiros = []; // Inicia vazio, registros são adicionados no pagamento
        this.dataEmissao = new Date();
        this.setValorTotal = valorTotal;
        this.setStatusPagamento = statusPagamento;
        this.dataPagamento = null;
    };

    public gerar(): void {
        console.log(`Fatura ${this.idFatura} emitida para o usuário ${this.usuario.getNome}`);
    };

    public calcularTotal(): number {
        // No futuro, aqui você somaria taxas ou descontos extras
        return this.valorTotal;
    };

    public atualizarStatus(status: StatusPagamento): void {
        this.statusPagamento = status;
    };

    public registrarPagamento(
        data: Date,
        metodo: FormaPagamento
    ): void {
        this.dataPagamento = data;
        this.statusPagamento = StatusPagamento.PAGO;
        
        console.log(`Pagamento de R$${this.valorTotal} registrado via ${metodo} em ${data}`);
    };

    // Getters e Setters
    public get getIdFatura(): number { return this.idFatura; }

    public get getUsuario(): Usuario { return this.usuario; }
    public set setUsuario(usuario: Usuario) { this.usuario = usuario; }

    public get getContratacao(): Contratacao { return this.contratacao; }
    public set setContratacao(contratacao: Contratacao) { this.contratacao = contratacao; }

    public get getFinanceiros(): Financeiro[] { return this.financeiros; }

    public get getDataEmissao(): Date { return this.dataEmissao; }

    public get getValorTotal(): number { return this.valorTotal; }
    public set setValorTotal(valor: number) {
        if (valor <= 0) throw new Error("O valor total da fatura deve ser positivo.");
        this.valorTotal = valor;
    }

    public get getStatusPagamento(): StatusPagamento { return this.statusPagamento; }
    public set setStatusPagamento(status: StatusPagamento) { this.statusPagamento = status; }
};