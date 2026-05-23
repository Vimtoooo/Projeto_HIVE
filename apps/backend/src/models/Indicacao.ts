import { MeioIndicado, Prestador, StatusIndicado, Usuario } from "@prisma/client";

// Definimos um tipo que representa a herança do UML: Prestador é um Usuario
type PrestadorComDadosDeUsuario = Prestador & Usuario;

export class Indicacao {

    private static proximoId: number = 1;

    private idIndicacao: number;
    private indicador: Usuario; // Renomeado para refletir o schema
    private indicado: PrestadorComDadosDeUsuario; // Agora possui o atributo .nome
    private meioIndicado: MeioIndicado; // Corrigido o nome
    private dataIndicado: Date = new Date(); // Corrigido o nome
    private statusIndicacao: StatusIndicado; // Corrigido o nome
    private observacao: string;

    // Propriedades para facilitar a persistência no Prisma
    public indicadorId: number;
    public indicadoId: number;

    public constructor(
        indicador: Usuario,
        indicado: PrestadorComDadosDeUsuario,
        meioIndicacao: MeioIndicado,
        observacao: string,
        statusIndicacao: StatusIndicado = StatusIndicado.PENDENTE, // Valor padrão como no schema
        idIndicacao?: number // Opcional, será gerado pelo banco
    ) {
        this.idIndicacao = idIndicacao || Indicacao.proximoId++; // Mantém o gerador em memória para testes, mas o DB sobrescreverá
        this.indicador = indicador;
        this.indicado = indicado;
        this.indicadorId = indicador.idUsuario; // Armazena o ID para persistência
        this.indicadoId = indicado.idPrestador; // Armazena o ID para persistência
        this.meioIndicado = meioIndicacao;
        this.statusIndicacao = statusIndicacao;
        this.observacao = observacao;
    };

    public registrarIndicacao(): void {
        if (!this.validarIndicacao()) {
            throw new Error("Não foi possível registrar a indicação: dados inválidos.");
        };
        console.log(`Indicação ${this.idIndicacao} registrada com sucesso para ${this.indicado.nome}.`);
    };

    public validarIndicacao(): boolean {
        // Exemplo de validação: A observação não pode ser vazia
        if (!this.observacao || this.observacao.trim() === '') {
            console.error("A observação da indicação não pode ser vazia.");
            return false;
        };
        // Adicione outras regras de validação aqui (ex: verificar se indicador e indicado existem)
        return true;
    };

    public atualizarStatus(status: StatusIndicado): void {
        this.statusIndicacao = status;
    };

    // Getters e Setters
    public get getIdIndicacao(): number { return this.idIndicacao; }
    
    public get getIndicador(): Usuario { return this.indicador; }
    
    public get getIndicado(): PrestadorComDadosDeUsuario { return this.indicado; }
    
    public get getMeioIndicado(): MeioIndicado { return this.meioIndicado; }
    public set setMeioIndicado(meio: MeioIndicado) { this.meioIndicado = meio; }

    public get getDataIndicado(): Date { return this.dataIndicado; }

    public get getStatusIndicacao(): StatusIndicado { return this.statusIndicacao; }
    public set setStatusIndicacao(status: StatusIndicado) { this.statusIndicacao = status; }

    public get getObservacao(): string { return this.observacao; }
    public set setObservacao(obs: string) { 
        if (!obs || obs.trim().length === 0) {
            throw new Error("A observação não pode ser vazia.");
        }
        this.observacao = obs.trim(); 
    }
};