const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.secciones.createMany({
    data: [
      { nombre_seccion: 'Nacionales', slug_seccion: 'nacionales' },
      { nombre_seccion: 'Regionales', slug_seccion: 'regionales' },
      { nombre_seccion: 'Deportes', slug_seccion: 'deportes' },
      { nombre_seccion: 'Internacionales', slug_seccion: 'internacionales' },
      { nombre_seccion: 'Cultura', slug_seccion: 'cultura' },
      { nombre_seccion: 'Redes Sociales', slug_seccion: 'redes-sociales' },
      // Puedes agregar más secciones si lo deseas
    ],
    skipDuplicates: true, // Evita errores si ya existen
  });

  console.log('Secciones creadas exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });