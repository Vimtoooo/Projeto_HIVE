"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.contract.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
    const provider = await prisma.user.create({
        data: {
            name: 'Carlos Marceneiro',
            email: 'carlos@hive.com',
            password: 'senha_criptografada_aqui',
            isProvider: true,
            services: {
                create: {
                    title: 'Restauração de Móveis Antigos',
                    description: 'Especialista em restauração de móveis de madeira maciça com acabamento em verniz.',
                    price: 250.00,
                },
            },
        },
        include: { services: true }
    });
    const client = await prisma.user.create({
        data: {
            name: 'Ana Souza',
            email: 'ana.souza@email.com',
            password: 'outra_senha_segura',
            isProvider: false,
        },
    });
    console.log({ provider, client });
    console.log('Seed finalizado com sucesso! 🌱');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map