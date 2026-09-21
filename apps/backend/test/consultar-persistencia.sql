-- PostgreSQL: conecte-se ao banco TEST_DATABASE_URL pelo pgAdmin ou psql.
-- Substitua o UUID e execute na MESMA conexão. Somente consultas.
SELECT set_config('hive.execucao', 'COLE_O_UUID_AQUI', false);

SELECT "idUsuario", nome, email, "tipoUsuario", "statusConta"
FROM "Usuario" WHERE email IN (('cliente.' || current_setting('hive.execucao') || '@example.invalid'), ('prestador.' || current_setting('hive.execucao') || '@example.invalid'));

SELECT p.* FROM "Prestador" p JOIN "Usuario" u ON u."idUsuario" = p."idPrestador"
WHERE u.email = ('prestador.' || current_setting('hive.execucao') || '@example.invalid');

SELECT s.* FROM "Servico" s JOIN "Usuario" u ON u."idUsuario" = s."prestadorId"
WHERE u.email = ('prestador.' || current_setting('hive.execucao') || '@example.invalid');

SELECT i.* FROM "Indicacao" i JOIN "Usuario" u ON u."idUsuario" = i."indicadorId"
WHERE u.email = ('cliente.' || current_setting('hive.execucao') || '@example.invalid');

SELECT c.* FROM "Contratacao" c JOIN "Usuario" u ON u."idUsuario" = c."contratanteId"
WHERE u.email = ('cliente.' || current_setting('hive.execucao') || '@example.invalid');

SELECT f.* FROM "Fatura" f JOIN "Usuario" u ON u."idUsuario" = f."usuarioId"
WHERE u.email = ('cliente.' || current_setting('hive.execucao') || '@example.invalid');

SELECT a.* FROM "Avaliacao" a JOIN "Contratacao" c ON c."idContratacao" = a."contratacaoId"
JOIN "Usuario" u ON u."idUsuario" = c."contratanteId" WHERE u.email = ('cliente.' || current_setting('hive.execucao') || '@example.invalid');

SELECT f.* FROM "Financeiro" f JOIN "Contratacao" c ON c."idContratacao" = f."contratacaoId"
JOIN "Usuario" u ON u."idUsuario" = c."contratanteId" WHERE u.email = ('cliente.' || current_setting('hive.execucao') || '@example.invalid');
