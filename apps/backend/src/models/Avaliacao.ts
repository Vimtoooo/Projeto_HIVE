import { Contratacao } from "@prisma/client";

export class Avaliacao {

    private static proximoId: number = 1;

    private idAvaliacao: number;
    private contratacao: Contratacao;
    private nota: number;
    private dataAvaliacao: Date;
    private comentario?: string;

    public constructor(
        contratacao: Contratacao,
        nota: number,
        comentario?: string
    ) {
        this.idAvaliacao = Avaliacao.proximoId++;
        this.contratacao = contratacao;
        this.nota = nota;
        this.dataAvaliacao = new Date();
        this.comentario = comentario;
    };

    public registrar(
        nota: number,
        comentario?: string
    ): void {
        this.nota = nota;
        this.comentario = comentario;
        
        if (!this.validarNota()) {
            throw new Error("Falha ao registrar: A nota deve estar entre 0 e 5.");
        };
        
        console.log(`Avaliação ${this.idAvaliacao} registrada com sucesso.`);
    };

    public editarComentario(
        comentario: string
    ): void {
        this.comentario = comentario;
        console.log("Comentário atualizado.");
    };

    public validarNota(): boolean {
        return this.nota >= 0 && this.nota <= 5;
    };
};