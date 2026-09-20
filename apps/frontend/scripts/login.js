const btnLogin = document.getElementById('btn-login');

btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('Preencha o e-mail e a senha.');
        return;
    }

    try {
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.message || 'E-mail ou senha inválidos.');
            return;
        }

      alert(`Bem-vindo, ${dados.nome}!`);

console.log('Usuário autenticado:', dados);

window.location.href = './home.html';
        // Depois vamos decidir para qual página o usuário será enviado.
        // window.location.href = './alguma-pagina.html';

    } catch (erro) {
        console.error('Erro ao realizar login:', erro);
        alert('Não foi possível conectar ao servidor.');
    }
});