// Fichier : prisma/seed.js
// Script de seed pour format JSON imbriqué (CommonJS pour Node)
const { PrismaClient } = require('@prisma/client');
const figurineData = require('../data/figurines.json');

const prisma = new PrismaClient();

async function main() {
  let count = 0;

  for (const col of figurineData) {
    const collectionName = col.collection;
    for (const sub of col.subSeries) {
      const seriesName = sub.series;
      for (const item of sub.items) {
        await prisma.figurine.upsert({
          where: {
            unique_figurine: {
              collection: collectionName,
              series: seriesName,
              name: item.name
            }
          },
          update: {
            imageRef: item.imageRef
          },
          create: {
            collection: collectionName,
            series: seriesName,
            name: item.name,
            imageRef: item.imageRef
          }
        });
        count++;
      }
    }
  }

  console.log(`✅ Seeded ${count} figurines across ${figurineData.length} collections.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
