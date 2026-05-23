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
    ) {
        this.idUsuario = Usuario.proximoId++;
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
    public get getIdUsuario(): number {
        return this.idUsuario;
    };

    public get getNome(): string { return this.nome; }
    public set setNome(nome: string) { this.nome = nome; }

    public get getEmail(): string { return this.email; }
    public set setEmail(email: string) { this.email = email; }

    public set setSenha(senha: string) { this.senha = senha; }

    public get getTelefone(): string { return this.telefone; }
    public set setTelefone(telefone: string) { this.telefone = telefone; }

    public get getCpf(): string { return this.cpf; }

    public get getEndereco(): string { return this.endereco; }
    public set setEndereco(endereco: string) { this.endereco = endereco; }

    public get getTipoUsuario(): TipoUsuario { return this.tipoUsuario; }
    public set setTipoUsuario(tipo: TipoUsuario) { this.tipoUsuario = tipo; }

    public get getDataCadastro(): Date { return this.dataCadastro; }

    public get getStatusConta(): StatusConta { return this.statusConta; }
    public set setStatusConta(status: StatusConta) { this.statusConta = status; }

    /**
     * Exclusão lógica: Inativa a conta do usuário
     */
    public inativarConta(): void {
        this.statusConta = StatusConta.INATIVO;
        console.log(`Conta de ${this.nome} inativada.`);
    }
};