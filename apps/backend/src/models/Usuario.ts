import { FormaPagamento, Indicacao, StatusConta, TipoUsuario, Servico } from "@prisma/client";
import { Contratacao } from "./Contratacao";

export class Usuario {

    private static proximoId: number = 1;

    private idUsuario: number;
    private nome: string;
    private email: string;
    private senha: string;
    private telefone: string;
    private cpf: string;
    protected endereco: string;
    protected tipoUsuario: TipoUsuario;
    private dataCadastro: Date = new Date();
    private statusConta: StatusConta;

    public constructor(
        nome: string,
        email: string,
        senha: string,
        telefone: string,
        cpf: string,
        endereco: string,
        tipoUsuario: TipoUsuario,
        statusConta: StatusConta,
        idUsuario?: number
    ) {
        this.idUsuario = idUsuario || Usuario.proximoId++;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.telefone = telefone;
        this.cpf = cpf;
        this.endereco = endereco;
        this.tipoUsuario = tipoUsuario;
        this.statusConta = statusConta;
    };

    public cadastrar(): void {
        console.log(`Usuário ${this.nome} cadastrado com status ${this.statusConta}.`);
    };

    public autenticar(
        email: string,
        senha: string
    ): boolean {
        return this.email === email && this.senha === senha;
    };

    public atualizarPerfil(dados: Partial<Usuario>): void {
        // Forma limpa de mesclar dados e modificar sem objetos sem gerar erros
        Object.assign(this, dados);
        console.log(`Perfil de ${this.nome} atualizado.`);
    };

    public solicitarContratacao(
        servico: Servico,
        valor: number,
        formaPagamento: FormaPagamento
    ): Contratacao {
        const novaContratacao = new Contratacao(
            servico,
            this as any, // Cast necessário pois o construtor espera o tipo Prisma.Usuario
            valor,
            formaPagamento
        );

        console.log(`Contratação do serviço "${servico.titulo}" gerada por ${this.nome}.`);
        return novaContratacao;
    };

    public pagarFatura(
        faturaId: number,
        metodo: FormaPagamento
    ): void {
        console.log(`Fatura ${faturaId} paga via ${metodo}.`);
    };

    public receberIndicacao(indicacao: Indicacao): void {
        console.log(`Usuário ${this.nome} recebeu uma indicação através de ${indicacao.meioIndicacao}.`);
    };

    // Getters para campos privados que podem ser necessários em outras partes do modelo
    public get id(): number {
        return this.idUsuario;
    };
}