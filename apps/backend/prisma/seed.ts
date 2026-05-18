import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpa os dados existentes para evitar erros de duplicidade ao rodar o seed várias vezes
  await prisma.contract.deleteMany()
  await prisma.service.deleteMany()
  await prisma.user.deleteMany()

  // 1. Criar um usuário que é Prestador de Serviço
  const provider = await prisma.user.create({
    data: {
      name: 'Carlos Marceneiro',
      email: 'carlos@hive.com',
      password: 'senha_criptografada_aqui', // Lembre-se de usar bcrypt no futuro
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
  })

  // 2. Criar um usuário que é Cliente
  const client = await prisma.user.create({
    data: {
      name: 'Ana Souza',
      email: 'ana.souza@email.com',
      password: 'outra_senha_segura',
      isProvider: false,
    },
  })

  console.log({ provider, client })
  console.log('Seed finalizado com sucesso! 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
