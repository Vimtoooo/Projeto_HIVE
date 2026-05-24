import { StatusConta, TipoUsuario, MeioIndicado, StatusIndicado, StatusServico, FormaPagamento, StatusPagamento, TipoRegistro } from "@prisma/client";
import { Usuario } from "../src/models/Usuario";
import { Prestador } from "../src/models/Prestador";
import { Servico } from "../src/models/Servico";
import { Indicacao } from "../src/models/Indicacao";
import { Contratacao } from "../src/models/Contratacao";
import { Fatura } from "../src/models/Fatura";
import { Avaliacao } from "../src/models/Avaliacao";
import { Financeiro } from "../src/models/Financeiro";

async function testeNormal() {
    console.log("=== INICIANDO TESTES DE DOMÍNIO - PROJETO HIVE ===\n");

    // --- TESTE 1: VALIDAÇÕES DE INTEGRIDADE (FAIL-FAST) ---
    console.log("TESTE 1: Validando restrições de segurança...");
    try {
        const userFalho = new Usuario("Jo", "jo@email.com", "senha12345", "11987654321", "12345678901", "Rua A", TipoUsuario.CONTRATANTE, StatusConta.ATIVO);
        userFalho.setNome = "Jo"; // Deve lançar erro (mínimo 3 caracteres)
    } catch (error: any) {
        console.log("✅ Captura de erro esperada (Nome):", error.message);
    }

    try {
        const prestador = new Prestador(
            "Carlos Silva", "carlos@email.com", "senha12345", "11999999999", "12345678901",
            "Rua das Flores", TipoUsuario.PRESTADOR, StatusConta.ATIVO, "Marcenaria", "10 anos", ["Certificado A"], "12345678000199"
        ); // CNPJ é validado no construtor
        prestador.setCnpj = "123"; // Deve lançar erro (CNPJ inválido)
    } catch (error: any) {
        console.log("✅ Captura de erro esperada (CNPJ):", error.message);
    }

    console.log("\n--------------------------------------------------\n");

    // --- TESTE 2: FLUXO FELIZ (HAPPY PATH) ---
    console.log("TESTE 2: Simulando fluxo real de negócio...");

    // 1. Criar Personagens
    const cliente = new Usuario(
        "Ana Souza", "ana@cliente.com", "seguranca123", "11988888888", "98765432100",
        "Av. Central, 500", TipoUsuario.CONTRATANTE, StatusConta.ATIVO
    );

    const carpinteiro = new Prestador(
        "Roberto Madeiras", "roberto@marceneiro.com", "madeira@2024", "11977777777", "11122233344",
        "Galpão Ind, 10", TipoUsuario.PRESTADOR, StatusConta.ATIVO, "Carpintaria", "15 anos", ["Mestre Marceneiro"], "99888777000155"
    );

    console.log(`- Usuários criados: ${cliente.getNome} (Cliente) e ${carpinteiro.getNome} (Prestador)`);

    // 2. Prestador cadastra um serviço
    const servicoCama = carpinteiro.cadastrarServico(
        "Cama de Casal Provençal",
        "Cama feita em madeira maciça com entalhes manuais.",
        1500.00
    );
    console.log(`- Serviço ofertado: ${servicoCama.getTitulo} | Preço: R$${servicoCama.getPrecoBase}`);

    // 3. Simular uma Indicação
    // Nota: Fazemos o cast para simular a herança do Prisma que você definiu no tipo PrestadorComDadosDeUsuario
    const indicacao = new Indicacao(
        cliente, // Indicador
        carpinteiro, // Indicado (Prestador é compatível com Prestador & Usuario)
        MeioIndicado.WHATSAPP,
        "Indicado pelo grupo de vizinhos do bairro.",
        StatusIndicado.PENDENTE
    );
    indicacao.registrarIndicacao();
    indicacao.setStatusIndicacao = StatusIndicado.ACEITA;

    // 4. Contratação
    const contrato = cliente.solicitarContratacao(
        servicoCama,
        servicoCama.getPrecoBase,
        FormaPagamento.PIX
    );

    // 5. Verificação de Lógica de Negócio (Desconto por Indicação)
    contrato.setIndicacao = indicacao;
    
    let valorFinal = contrato.calcularValorFinal();
    console.log(`- Valor original: R$${contrato.getValor}`);
    console.log(`- Valor com desconto de indicação (5%): R$${valorFinal}`);

    // 6. Faturamento e Pagamento
    const fatura = contrato.gerarFatura();
    console.log(`- Fatura #${fatura.getIdFatura} gerada para ${fatura.getUsuario.getNome}`);
    
    fatura.registrarPagamento(new Date(), FormaPagamento.PIX);
    console.log(`- Status da Fatura: ${fatura.getStatusPagamento}`);

    // 7. Registro Financeiro
    const registro = carpinteiro.registrarFinanceiro(
        contrato,
        TipoRegistro.RECEITA,
        valorFinal,
        "Pagamento recebido pela cama de casal",
        fatura
    );
    console.log(`- Lançamento contábil criado: ID ${registro.getIdFinanceiro}`);

    console.log("\n=== TESTES CONCLUÍDOS COM SUCESSO ===");
}

executarTestes().catch(err => {
    console.error("❌ Erro inesperado durante os testes:", err);
});


// --- Funções de Teste Distintas ---

// Helper para logs
function logSection(title: string) {
    console.log(`\n--- ${title.toUpperCase()} ---`);
    console.log("--------------------------------------------------\n");
}

// Função 1: Testar validações de construtor e setters (já existente, mas encapsulada)
function testarValidacoesDeIntegridade() {
    logSection("1. TESTANDO VALIDAÇÕES DE INTEGRIDADE (FAIL-FAST)");

    console.log("Tentando criar usuário com nome inválido (menos de 3 caracteres)...");
    try {
        new Usuario("Jo", "jo@email.com", "senha12345", "11987654321", "12345678901", "Rua A", TipoUsuario.CONTRATANTE, StatusConta.ATIVO);
    } catch (error: any) {
        console.log(`✅ Erro esperado no construtor (Nome): ${error.message}`);
    }

    const clienteTeste = new Usuario("Nome Valido", "teste@email.com", "senha12345", "11987654321", "12345678901", "Rua A", TipoUsuario.CONTRATANTE, StatusConta.ATIVO);
    console.log("Tentando definir nome inválido via setter...");
    try {
        clienteTeste.setNome = "Jo";
    } catch (error: any) {
        console.log(`✅ Erro esperado no setter (Nome): ${error.message}`);
    }

    console.log("Tentando definir e-mail inválido via setter...");
    try {
        clienteTeste.setEmail = "email-invalido";
    } catch (error: any) {
        console.log(`✅ Erro esperado no setter (Email): ${error.message}`);
    }

    console.log("Tentando definir CPF inválido via setter...");
    try {
        clienteTeste.setCpf = "123";
    } catch (error: any) {
        console.log(`✅ Erro esperado no setter (CPF): ${error.message}`);
    }

    console.log("Tentando criar prestador com CNPJ inválido...");
    try {
        new Prestador(
            "Carlos Silva", "carlos@email.com", "senha12345", "11999999999", "12345678901",
            "Rua das Flores", TipoUsuario.PRESTADOR, StatusConta.ATIVO, "Marcenaria", "10 anos", ["Certificado A"], "123"
        );
    } catch (error: any) {
        console.log(`✅ Erro esperado no construtor (CNPJ): ${error.message}`);
    }
}

// Função 2: Criar e exibir personagens base
function criarPersonagensBase(): { cliente: Usuario, carpinteiro: Prestador } {
    logSection("2. CRIANDO PERSONAGENS BASE (CLIENTE E PRESTADOR)");

    const cliente = new Usuario(
        "Ana Souza", "ana@cliente.com", "seguranca123", "11988888888", "98765432100",
        "Av. Central, 500", TipoUsuario.CONTRATANTE, StatusConta.ATIVO
    );
    cliente.cadastrar();

    const carpinteiro = new Prestador(
        "Roberto Madeiras", "roberto@marceneiro.com", "madeira@2024", "11977777777", "11122233344",
        "Galpão Ind, 10", TipoUsuario.PRESTADOR, StatusConta.ATIVO, "Carpintaria", "15 anos", ["Mestre Marceneiro"], "99888777000155"
    );
    carpinteiro.cadastrar();

    console.log(`- Cliente: ${cliente.getNome} (ID: ${cliente.getIdUsuario})`);
    console.log(`- Prestador: ${carpinteiro.getNome} (ID: ${carpinteiro.getIdUsuario})`);
    return { cliente, carpinteiro };
}

// Função 3: Prestador cadastra e gerencia serviços
function testarCadastroEGerenciamentoDeServico(carpinteiro: Prestador): Servico {
    logSection("3. PRESTADOR CADASTRA E GERENCIA SERVIÇOS");

    const servicoCama = carpinteiro.cadastrarServico(
        "Cama de Casal Provençal",
        "Cama feita em madeira maciça com entalhes manuais.",
        1500.00
    );
    console.log(`- Serviço cadastrado: "${servicoCama.getTitulo}" (ID: ${servicoCama.getIdServico})`);
    console.log(`  Descrição: ${servicoCama.getDescricao} | Preço: R$${servicoCama.getPrecoBase}`);

    servicoCama.setDescricao = "Cama de casal provençal, entalhada à mão, com acabamento em verniz fosco.";
    servicoCama.setPrecoBase = 1650.00;
    console.log(`- Serviço atualizado: "${servicoCama.getTitulo}"`);
    console.log(`  Nova Descrição: ${servicoCama.getDescricao} | Novo Preço: R$${servicoCama.getPrecoBase}`);

    servicoCama.desativar();
    console.log(`- Status do serviço "${servicoCama.getTitulo}": ${servicoCama.getStatus}`);
    servicoCama.ativar();
    console.log(`- Status do serviço "${servicoCama.getTitulo}": ${servicoCama.getStatus}`);

    return servicoCama;
}

// Função 4: Simular e gerenciar indicações
function testarFluxoDeIndicacao(cliente: Usuario, carpinteiro: Prestador): Indicacao {
    logSection("4. SIMULANDO E GERENCIANDO INDICAÇÕES");

    const indicacao = new Indicacao(
        cliente,
        carpinteiro, // Prestador é compatível com Prestador & Usuario
        MeioIndicado.WHATSAPP,
        "Indicado pelo grupo de vizinhos do bairro.",
        StatusIndicado.PENDENTE
    );
    indicacao.registrarIndicacao();
    console.log(`- Indicação registrada (ID: ${indicacao.getIdIndicacao}) de ${indicacao.getIndicador.getNome} para ${indicacao.getIndicado.getNome}`);
    console.log(`  Status inicial: ${indicacao.getStatusIndicacao}`);

    indicacao.setStatusIndicacao = StatusIndicado.ACEITA;
    console.log(`- Status da indicação atualizado para: ${indicacao.getStatusIndicacao}`);

    return indicacao;
}

// Função 5: Testar contratação com lógica de desconto
function testarContratacaoComDesconto(cliente: Usuario, servico: Servico, indicacao: Indicacao): Contratacao {
    logSection("5. TESTANDO CONTRATAÇÃO COM LÓGICA DE DESCONTO");

    const contrato = cliente.solicitarContratacao(
        servico,
        servico.getPrecoBase,
        FormaPagamento.PIX
    );
    console.log(`- Contratação solicitada (ID: ${contrato.getIdContratacao}) para "${servico.getTitulo}"`);
    console.log(`  Valor inicial: R$${contrato.getValor}`);

    contrato.setIndicacao = indicacao; // Aplica a indicação para o desconto
    const valorFinalComDesconto = contrato.calcularValorFinal();
    console.log(`- Indicação aplicada. Valor final com desconto (5%): R$${valorFinalComDesconto}`);

    return contrato;
}

// Função 6: Testar faturamento e pagamento
function testarFaturamentoEFluxoDePagamento(contrato: Contratacao, cliente: Usuario) {
    logSection("6. TESTANDO FATURAMENTO E FLUXO DE PAGAMENTO");

    const fatura = contrato.gerarFatura();
    console.log(`- Fatura (ID: ${fatura.getIdFatura}) gerada para ${cliente.getNome}`);
    console.log(`  Valor da fatura: R$${fatura.getValorTotal} | Status: ${fatura.getStatusPagamento}`);

    fatura.registrarPagamento(new Date(), FormaPagamento.PIX);
    console.log(`- Pagamento da fatura registrado. Novo status: ${fatura.getStatusPagamento}`);
}

// Função 7: Testar registro financeiro do prestador
function testarRegistroFinanceiroDoPrestador(carpinteiro: Prestador, contrato: Contratacao, fatura: Fatura) {
    logSection("7. TESTANDO REGISTRO FINANCEIRO DO PRESTADOR");

    const receita = carpinteiro.registrarFinanceiro(
        contrato,
        TipoRegistro.RECEITA,
        contrato.calcularValorFinal(),
        "Pagamento recebido pela contratação",
        fatura
    );
    console.log(`- Receita registrada (ID: ${receita.getIdFinanceiro}): R$${receita.getValor} para contratação ${contrato.getIdContratacao}`);

    // Simular uma despesa não vinculada a uma fatura específica
    const despesa = carpinteiro.registrarFinanceiro(
        contrato, // Ainda vinculado a um contrato para contexto, mas sem fatura específica
        TipoRegistro.DESPESA,
        50.00,
        "Compra de material extra para o serviço"
    );
    console.log(`- Despesa registrada (ID: ${despesa.getIdFinanceiro}): R$${despesa.getValor} para contratação ${contrato.getIdContratacao}`);
}

// Função 8: Testar atualização de perfil do usuário
function testarAtualizacaoDePerfilDoUsuario(cliente: Usuario) {
    logSection("8. TESTANDO ATUALIZAÇÃO DE PERFIL DO USUÁRIO");

    console.log(`- Perfil inicial de ${cliente.getNome}: Telefone ${cliente.getTelefone}, Endereço ${cliente.getEndereco}`);
    cliente.setTelefone = "21912345678";
    cliente.setEndereco = "Rua Nova, 100, Centro, Rio de Janeiro";
    console.log(`- Perfil atualizado: Telefone ${cliente.getTelefone}, Endereço ${cliente.getEndereco}`);
}

// Função 9: Testar inativação de conta
function testarInativacaoDeConta(usuario: Usuario) {
    logSection("9. TESTANDO INATIVAÇÃO DE CONTA");

    console.log(`- Status inicial da conta de ${usuario.getNome}: ${usuario.getStatusConta}`);
    usuario.inativarConta();
    console.log(`- Status da conta após inativação: ${usuario.getStatusConta}`);
}

// Função 10: Testar avaliação de serviço
function testarAvaliacaoDeServico(cliente: Usuario, contrato: Contratacao) {
    logSection("10. TESTANDO AVALIAÇÃO DE SERVIÇO");

    const avaliacao = new Avaliacao(contrato, 4, "Ótimo serviço, muito profissional!");
    avaliacao.registrar(4, "Ótimo serviço, muito profissional!"); // O método registrar também valida
    console.log(`- Avaliação (ID: ${avaliacao.getIdAvaliacao}) registrada para o serviço da contratação ${contrato.getIdContratacao}`);
    console.log(`  Nota: ${avaliacao.getNota} | Comentário: "${avaliacao.getComentario}"`);

    avaliacao.setNota = 5;
    avaliacao.editarComentario("Serviço impecável, superou as expectativas!");
    console.log(`- Avaliação atualizada: Nota ${avaliacao.getNota} | Comentário: "${avaliacao.getComentario}"`);

    try {
        avaliacao.setNota = 6; // Deve lançar erro
    } catch (error: any) {
        console.log(`✅ Erro esperado no setter (Nota da Avaliação): ${error.message}`);
    }
}

// Função principal que orquestra todos os testes
async function executarTestes() {
    console.log("=== INICIANDO DEMONSTRAÇÃO DE CLASSES DE DOMÍNIO - PROJETO HIVE ===\n");

    // Teste padrão do sistema...
    testeNormal();

    testarValidacoesDeIntegridade();

    const { cliente, carpinteiro } = criarPersonagensBase();

    const servicoCama = testarCadastroEGerenciamentoDeServico(carpinteiro);

    const indicacao = testarFluxoDeIndicacao(cliente, carpinteiro);

    const contrato = testarContratacaoComDesconto(cliente, servicoCama, indicacao);

    testarFaturamentoEFluxoDePagamento(contrato, cliente);

    // Para o registro financeiro, precisamos de uma fatura.
    // Em um cenário real, a fatura seria recuperada do contrato ou do banco.
    // Aqui, geramos uma nova para fins de demonstração.
    const faturaParaFinanceiro = contrato.gerarFatura();
    testarRegistroFinanceiroDoPrestador(carpinteiro, contrato, faturaParaFinanceiro);

    testarAtualizacaoDePerfilDoUsuario(cliente);

    testarInativacaoDeConta(cliente);

    testarAvaliacaoDeServico(cliente, contrato);

    console.log("\n=== DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO ===");
}

executarTestes().catch(err => {
    console.error("❌ Erro inesperado durante a execução dos testes:", err);
});