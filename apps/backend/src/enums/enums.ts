export enum FormaPagamento {
    'CARTAO', 'PIX', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA'
};

export enum MeioIndicado {
    'APLICATIVO', 'WHATSAPP', 'EMAIL', 'TELEFONE', 'REDES_SOCIAIS', 'OUTROS'
};

export enum StatusConta {
    'ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE'
};

export enum StatusContratacao {
    'PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'
};

export enum StatusIndicacao {
    'PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA'
};

export enum StatusPagamento {
    'PENDENTE', 'PAGO', 'PARCIALMENTE_PAGO', 'CANCELADO', 'ESTORNADO'
};

export enum StatusServico {
    'ATIVO', 'INATIVO'
};

export enum TipoRegistro {
    'RECEITA', 'DESPESA'
};

export enum TipoUsuario {
    'CONTRATANTE', 'PRESTADOR', 'AMBOS'
};