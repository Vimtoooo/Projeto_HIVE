# Home HIVE

## Escopo

Apenas /home foi implementada nesta etapa, usando a paleta amarela/preta/clara
do login e os protótipos do grupo. A navegação lateral, o conteúdo central e o
painel de apoio ficam separados; em telas menores, a navegação abre em janela
modal e o conteúdo se reorganiza sem rolagem horizontal da página.

## O que funciona

- Saudação e perfil com nome retornado pelo login; visitante sem identificação.
- Busca por nome, profissão ou descrição, com normalização de acentos e caixa.
- Filtros de profissão e favoritos combináveis; limpar filtros e estado vazio.
- Perto de você: distância crescente; mais avaliados: nota decrescente, com
  desempate por número de avaliações; populares: serviços fictícios realizados.
- Ver todos/ver menos, favoritos e detalhes em janela com Escape e retorno do foco.
- Menu móvel, ajuda, aviso de recursos futuros e saída para o login.

## Dados e limites

DemoProfessionals.ts contém nove perfis fictícios editáveis, com iniciais no
lugar de fotografias de pessoas reais. Osasco é uma região ilustrativa; o app
não consulta GPS. Avaliações, distâncias, preços e popularidade não foram
verificados nem recebidos da API. Nenhuma contratação é criada pelos botões.

ViewerStore.ts armazena apenas ID e nome público recebidos no login. Os dados
ficam em sessionStorage, junto dos favoritos separados por ID. Não são usados
para autorizar operações; a Home continua pública. Não armazena senha, token,
CPF ou endereço. Armazenamento corrompido é ignorado; indisponível usa memória.
Ao sair, os dados de apresentação e favoritos do usuário atual são removidos.

## Organização

- HomeDashboard.tsx: estado e composição da Home.
- ProfessionalCard.tsx: cartão e ações do perfil.
- HomeDialog.tsx: janela nativa acessível, com foco e Escape.
- HomeIcon.tsx: ícones SVG locais, sem dependência ou download remoto.
- HomeCatalog.ts: filtros, ordenação e formatação, sem alterar a fonte.
- HomeTypes.ts: tipos do catálogo e identidade de apresentação.
- home-page.module.css: estilos isolados e responsivos.

## Demonstração ao orientador

1. Inicie PostgreSQL/backend e frontend conforme o README e entre com uma conta.
2. Confira a saudação, abra categorias e busque por eletrica, sem acento.
3. Limpe os filtros e salve um profissional no coração; abra Favoritos.
4. Abra os detalhes e feche com Escape. Recarregue para conferir os favoritos.
5. Use Ver todos e os itens de navegação marcados como Em breve.
6. Reduza a janela para largura de celular e abra o menu de navegação.

Os testes automatizados usam API de login simulada e não escrevem no banco.
