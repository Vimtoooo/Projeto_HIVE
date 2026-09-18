# Remoção de credenciais do histórico

A auditoria encontrou `apps/backend/.env` no histórico da main publicada.
Ele continha configuração de conexão e `JWT_SECRET`. A limpeza anterior dos
arquivos `.example` não havia removido esse arquivo real.

O histórico da main foi reescrito sem `.env`, `.env.example` e
`.env.test.example`. O envio usou verificação do commit remoto esperado, e o
ruleset da main foi reativado após a operação, com suas regras preservadas.
O histórico local foi alinhado à mesma base; as alterações da funcionalidade
permanecem na branch `feat/persistencia-prisma`.

A verificação incluiu nomes de arquivos, padrões comuns de credenciais e busca
pelos valores locais de senha/JWT sem exibi-los. Não é uma garantia de que toda
forma possível de segredo foi detectada. Os arquivos locais foram preservados
e agora são ignorados pelo Git; exemplos fictícios estão na documentação.

## Ações necessárias para a equipe

1. Trocar a senha do banco que foi publicada e qualquer senha reutilizada.
2. Trocar `JWT_SECRET` e invalidar tokens eventualmente assinados pela chave
   antiga. Atualizar as configurações locais sem incluí-las em commits.
3. Guardar alterações locais e obter uma nova cópia do repositório saneado.
   Não mesclar nem enviar branches antigas: isso pode reintroduzir os segredos.
4. Cópias de terceiros e caches do GitHub não são eliminados por force-push.
   Se necessário, solicitar ao suporte do GitHub a remoção de referências e
   visualizações antigas. A rotação das credenciais é indispensável.

Referência: [remoção de dados sensíveis no GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

As credenciais não foram trocadas automaticamente para não interromper outras
aplicações que possam compartilhar a mesma conta MySQL. O usuário deve realizar
a rotação e atualizar seus ambientes.
