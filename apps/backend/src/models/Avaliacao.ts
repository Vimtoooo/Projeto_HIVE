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
        dataAvaliacao: Date,
        comentario?: string
    ) {
        this.idAvaliacao = Avaliacao.proximoId++;
        this.contratacao = contratacao;
        this.nota = nota;
        this.dataAvaliacao = dataAvaliacao;
        
        if (comentario) this.comentario = comentario;
    };

    public registrar(
        nota: number,
        comentario?: string
    ): void {
        // Registra uma avaliacao...
    };

    public editarComentario(
        comentario: string
    ): void {
        // Edita o comentario...
        const comentarioAnterior: string | undefined = this.comentario;

        if (comentarioAnterior) this.comentario = comentario;
    };

    public validarNota(): boolean {
        // Validar a nota de uma avaliacao...
        return false;
    };
};