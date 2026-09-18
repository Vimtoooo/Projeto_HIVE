-- No Workbench, selecione antes o banco configurado em TEST_DATABASE_URL.
-- Substitua o UUID abaixo pelo ID exibido por npm run test:persistencia:visualizar.
SET @execucao = 'COLE_O_UUID_AQUI';
SET @cliente = CONCAT('cliente.', @execucao, '@example.invalid');
SET @prestador = CONCAT('prestador.', @execucao, '@example.invalid');

SELECT idUsuario, nome, email, tipoUsuario, statusConta
FROM Usuario WHERE email IN (@cliente, @prestador);

SELECT p.* FROM Prestador p JOIN Usuario u ON u.idUsuario = p.idPrestador
WHERE u.email = @prestador;

SELECT s.* FROM Servico s JOIN Usuario u ON u.idUsuario = s.prestadorId
WHERE u.email = @prestador;

SELECT i.* FROM Indicacao i JOIN Usuario u ON u.idUsuario = i.indicadorId
WHERE u.email = @cliente;

SELECT c.* FROM Contratacao c JOIN Usuario u ON u.idUsuario = c.contratanteId
WHERE u.email = @cliente;

SELECT f.* FROM Fatura f JOIN Usuario u ON u.idUsuario = f.usuarioId
WHERE u.email = @cliente;

SELECT a.* FROM Avaliacao a JOIN Contratacao c ON c.idContratacao = a.contratacaoId
JOIN Usuario u ON u.idUsuario = c.contratanteId WHERE u.email = @cliente;

SELECT f.* FROM Financeiro f JOIN Contratacao c ON c.idContratacao = f.contratacaoId
JOIN Usuario u ON u.idUsuario = c.contratanteId WHERE u.email = @cliente;
