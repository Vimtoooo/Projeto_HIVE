# Migração do frontend para TypeScript

## Decisões

As telas passaram de HTML com listeners DOM para rotas Next.js e componentes
React tipados. O build do Next.js transpila e empacota; tsc --noEmit verifica
tipos. Não existe uma segunda compilação para arquivos legados. A configuração
strict permanece ativa, e lint agora cobre toda a aplicação TypeScript.

LoginForm e RegistrationForm mantêm o visual e usam FormEvent<HTMLFormElement>,
FormData, estado de erro/envio e uma referência que impede submissões concorrentes.
As mensagens de erro ficam em role=alert. Sucesso usa navegação do Next.js.

ApiTypes define entradas e usuário público. ApiClient trata JSON como unknown,
valida o contrato antes de navegar e converte erros NestJS em mensagens legíveis.
Não se usa as PublicUser para confiar cegamente no JSON. Timeout de 15 segundos
libera o formulário; no cadastro, se a resposta se perder após gravar, uma nova
tentativa pode retornar conflito. O frontend não garante idempotência da API.

FormValidation mantém limites e máscaras existentes, corrige a máscara de
telefone fixo e normaliza espaços/dígitos antes do POST. A senha não é aparada.
A confirmação fica somente no navegador. CPF é validado pelo tamanho, não pelo
algoritmo dos dígitos verificadores. As regras do backend continuam autoritativas.

CSS Modules evitam colisão entre .logo da Home e do formulário. O conteúdo e
CSS da Home que estavam modificados localmente foram incorporados à rota /home.
Ela permanece um protótipo público, sem sessão/autorização. Login social e
recuperação de senha continuam sem implementação.

## Compatibilidade e nomes

A raiz vai para /login; cadastro e Home usam /cadastro e /home. URLs .html antigas
redirecionam para essas rotas. Não se deve editar páginas em public ou usar Python.
As imagens são fontes versionadas em public/images, com nomes em kebab-case.
Arquivos próprios TS/TSX usam PascalCase; CSS usa kebab-case. Os nomes reservados
do Next.js e os arquivos de configuração mantêm as convenções das ferramentas.

## Verificação

Consulte o [guia de testes](../test/README.md). Os testes unitários e os testes
de navegador usam dados fictícios e HTTP simulado; não confirmam disponibilidade
do PostgreSQL, autenticação real ou persistência. Para isso, execute também o
roteiro manual do [README](../README.md), com uma conta no banco da API.
