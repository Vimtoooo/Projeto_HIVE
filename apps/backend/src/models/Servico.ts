import { StatusServico } from "@prisma/client";
import { Prestador } from "./Prestador";

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
        if (preco <= 0) {
            console.log(`O preço deve ser superior a R$ 0,00. Valor informado: ${preco}`);
            return;
        };

        this.precoBase = preco;
        console.log(`Preco alterado com sucesso.`);
    };

    public editarDescricao(descricao: string): void {
        // Edite a descrição de um serviço...
        if (!Boolean(descricao) && descricao.length === 0) {
            console.log(`Uma descrição vazia não é válido!`)
            return;
        };

        this.descricao = descricao;
        console.log(`Descrição editada com sucesso.`);
    };

    public ativar(): void {
        // Ative um serviço para ser disponível ao público...
        this.status = StatusServico.ATIVO;
        console.log(`Serviço "${this.getTitulo}" foi ativado.`);
    };

    public desativar(): void {
        // Desative um serviço, ou seja, para não ser disponível ao público...
        this.status = StatusServico.INATIVO;
        console.log(`Serviço "${this.getTitulo}" foi desativado.`);
    };

    // Getters e Setters
    public get getIdServico(): number { return this.idServico; }

    public get getPrestador(): Prestador { return this.prestador; }

    public get getTitulo(): string { return this.titulo; }
    public set setTitulo(titulo: string) {
        if (titulo.trim().length < 5) throw new Error("O título do serviço deve ter pelo menos 5 caracteres.");
        this.titulo = titulo.trim();
    };

    public get getDescricao(): string { return this.descricao; }
    public set setDescricao(desc: string) { this.editarDescricao(desc); }

    public get getPrecoBase(): number { return this.precoBase; }
    public set setPrecoBase(preco: number) { this.atualizarPreco(preco); }

    public get getDataCadastro(): Date { return this.dataCadastro; }

    public get getStatus(): StatusServico { return this.status; }
};