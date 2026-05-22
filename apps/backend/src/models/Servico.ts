import { Prestador, StatusServico } from "@prisma/client";

export class Servico {

    private static proximoId: number;

    private idServico: number;
    private prestador: Prestador;
    private titulo: string;
    private descricao: string;
    private precoBase: number;
    private dataCadastro: Date = new Date();
    private status: StatusServico;

    public constructor(
        prestador: Prestador,
        titulo: string,
        descricao: string,
        precoBase: number,
        status: StatusServico
    ) {
        this.idServico = Servico.proximoId++;
        this.prestador = prestador;
        this.titulo = titulo;
        this.descricao = descricao;
        this.precoBase = precoBase;
        this.status = status;
    };

    public atualizarPreco(preco: number): void {
        // Modifica o preço de um serviço...
        if (preco >= 0) {
            console.log(`O preço de um serviço oferecido para o cliente deve ser válido e acima de R$ 0,00 e não ${preco}`);
            return;
        };

        this.precoBase = preco;
    };

    public editarDescricao(descricao: string): void {
        // Edite a descrição de um serviço...
        if (!Boolean(descricao) && descricao.length === 0) {
            console.log(`Uma descrição vazia não é válido!`)
            return;
        };

        this.descricao = descricao;
    };

    public ativar(): void {
        // Ative um serviço para ser disponível ao público...
        this.status = StatusServico.ATIVO;
    };

    public desativar(): void {
        // Desative um serviço, ou seja, para não ser disponível ao público...
        this.status = StatusServico.INATIVO;
    };
};