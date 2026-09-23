const form = document.getElementById('registerForm');
const erroSpan = document.getElementById('erro');
const btnSubmit = document.getElementById('btn-register-submit');

// Máscara de CPF
const cpfInput = document.getElementById('cpf');
cpfInput.addEventListener('input', () => {
    let v = cpfInput.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    cpfInput.value = v;
});

// Máscara de telefone
const telefoneInput = document.getElementById('telefone');
telefoneInput.addEventListener('input', () => {
    let v = telefoneInput.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    telefoneInput.value = v;
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroSpan.textContent = '';
    const nome = document.getElementById('nome').value.trim();
    const cpf = cpfInput.value.replace(/\D/g, '');
    const telefone = telefoneInput.value.replace(/\D/g, '');
    const endereco = document.getElementById('endereco').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    if (nome.length < 3) {
        erroSpan.textContent = 'Informe seu nome completo.';
        return;
    }
    if (cpf.length !== 11) {
        erroSpan.textContent = 'CPF inválido.';
        return;
    }
    if (telefone.length < 10 || telefone.length > 11) {
        erroSpan.textContent = 'Telefone inválido.';
        return;
    }
    if (endereco.length < 5) {
        erroSpan.textContent = 'Endereço muito curto.';
        return;
    }
    if (senha !== confirmarSenha) {
        erroSpan.textContent = 'As senhas não coincidem.';
        return;
    }
    if (senha.length < 8) {
        erroSpan.textContent = 'A senha deve ter no mínimo 8 caracteres.';
        return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Cadastrando...';

    try {
        const resposta = await fetch((window.HIVE_API_BASE_URL || 'http://localhost:3000') + '/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, telefone, cpf, endereco })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
            erroSpan.textContent = dados.message || 'Erro ao cadastrar. Verifique os dados.';
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Cadastrar';
            return;
        }
        alert('Cadastro realizado com sucesso!');
        window.location.href = './Hive.html';
    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);
        erroSpan.textContent = 'Não foi possível conectar ao servidor.';
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Cadastrar';
    }
});