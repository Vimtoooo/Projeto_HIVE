import { Prestador, StatusServico } from "@prisma/client";

export class Servico {

    private static proximoId: number = 1;

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

    // Getters e Setters
    public get getIdServico(): number { return this.idServico; }

    public get getPrestador(): Prestador { return this.prestador; }

    public get getTitulo(): string { return this.titulo; }
    public set setTitulo(titulo: string) { this.titulo = titulo; }

    public get getDescricao(): string { return this.descricao; }
    public set setDescricao(desc: string) { this.descricao = desc; }

    public get getPrecoBase(): number { return this.precoBase; }
    public set setPrecoBase(preco: number) { this.precoBase = preco; }

    public get getDataCadastro(): Date { return this.dataCadastro; }

    public get getStatus(): StatusServico { return this.status; }
};