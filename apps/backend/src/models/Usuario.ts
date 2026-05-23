// 1. Imports de Banco (Enums e Tipos do Prisma)
import { FormaPagamento, StatusConta, TipoUsuario } from "@prisma/client";

// 2. Imports de Domínio (Suas Classes)
import { Servico } from "./Servico";
import { Contratacao } from "./Contratacao";
import { Indicacao } from "./Indicacao";

export class Usuario {

    private static proximoId: number = 1;

    private idUsuario: number;
    protected nome: string; // Alterado de private para protected
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

        console.log(`Contratação do serviço "${servico.getTitulo}" gerada por ${this.nome}.`);
        return novaContratacao;
    };

    public pagarFatura(
        faturaId: number,
        metodo: FormaPagamento
    ): void {
        console.log(`Fatura ${faturaId} paga via ${metodo}.`);
    };

    public receberIndicacao(indicacao: Indicacao): void {
        console.log(`Usuário ${this.nome} recebeu uma indicação através de ${indicacao.getMeioIndicado}.`);
    };

    // Getters para campos privados que podem ser necessários em outras partes do modelo
    public get getIdUsuario(): number {
        return this.idUsuario;
    };

    public get getNome(): string { return this.nome; }
    public set setNome(nome: string) {
        if (nome.trim().length < 3) throw new Error("O nome deve ter pelo menos 3 caracteres.");
        this.nome = nome.trim();
    };

    public get getEmail(): string { return this.email; }
    public set setEmail(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) throw new Error("Formato de e-mail inválido.");
        this.email = email.toLowerCase().trim();
    };

    public set setSenha(senha: string) {
        if (senha.length < 8) throw new Error("A senha deve conter no mínimo 8 caracteres por questões de segurança.");
        this.senha = senha;
    };

    public get getTelefone(): string { return this.telefone; }
    public set setTelefone(telefone: string) {
        const foneLimpo = telefone.replace(/\D/g, '');
        if (foneLimpo.length < 10 || foneLimpo.length > 11) {
            throw new Error("Telefone deve conter DDD e ter 10 ou 11 dígitos.");
        };
        this.telefone = foneLimpo;
    };

    public get getCpf(): string { return this.cpf; }
    public set setCpf(cpf: string) {
        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) throw new Error("CPF deve conter exatamente 11 dígitos.");
        this.cpf = cpfLimpo;
    };

    public get getEndereco(): string { return this.endereco; }
    public set setEndereco(endereco: string) {
        if (endereco.trim().length < 5) throw new Error("Endereço muito curto ou incompleto.");
        this.endereco = endereco.trim();
    };

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
    };
};