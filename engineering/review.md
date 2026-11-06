# Revisão independente

Receba o objetivo, a base do diff e critérios de aceite. Confirme a base no Git e considere mudanças rastreadas e arquivos novos quando a revisão incluir o working tree. Não use a explicação do implementador como prova de correção.

## Pontos de atenção no HIVE

- Conta A não deve ler/alterar dados privados da conta B. Identidade e permissões vêm da sessão/servidor.
- Respostas públicas não expõem credenciais, documentos, contatos privados ou relações internas desnecessárias.
- Escritas repetidas e concorrentes preservam unicidade e estados válidos; falhas não deixam operação e notificação inconsistentes.
- DTOs, respostas da API e validação em runtime no frontend concordam. Confirme efeitos em consumidores existentes.
- Migrations preservam dados; testes usam destino apropriado. Diferencie banco real, banco descartável e API simulada nas evidências.
- Fluxos visuais alterados contemplam teclado, celular, carregamento, erro recuperável e sessão expirada.
- Para instruções de agentes, confira referências, escopo, permissões, condição de parada e ausência de dependência obrigatória de arquivos locais ignorados.

## Resultado

Para cada problema: prioridade, arquivo/linha, cenário, impacto e correção sugerida. Não invente problemas para preencher categorias. Se não encontrar problemas, diga isso e registre o que não foi verificado.

O revisor inicialmente não edita. O coordenador avalia os achados, aplica correções do escopo e repete só as verificações afetadas. Não execute novas rodadas ilimitadas depois que os critérios estiverem satisfeitos.

Mudanças de regra de produto que afetam outros integrantes devem ter justificativa nos guias versionados pertinentes. Propostas para entregas futuras ficam separadas das correções desta branch.
