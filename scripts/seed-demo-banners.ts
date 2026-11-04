import { prisma } from "../src/lib/prisma";
import { invalidateLandingCache } from "../src/lib/landingCache";

async function main() {
  const isClean = process.argv.includes("--clean");

  if (isClean) {
    const deleted = await prisma.banner.deleteMany({
      where: {
        title: {
          in: [
            "Temporada Natación 2026",
            "Línea Crocs Oficial",
            "Vóley Profesional FIVB",
          ],
        },
      },
    });
    invalidateLandingCache("banner");
    console.log(`🧹 Se eliminaron ${deleted.count} banners demo y se revalidó la portada.`);
    return;
  }

  const demoBanners = [
    {
      title: "Temporada Natación 2026",
      subtitle: "Antiparras de competición, mallas y accesorios Speedo & Arena con 3 y 6 cuotas.",
      imageUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1920&q=80",
      mobileUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80",
      linkUrl: "/catalogo?disciplineSlug=natacion",
      order: 0,
      active: true,
    },
    {
      title: "Línea Crocs Oficial",
      subtitle: "Modelos Crocband, Classic y Sandalias para toda la familia con retiro en Saavedra 241.",
      imageUrl: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=1920&q=80",
      mobileUrl: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
      linkUrl: "/catalogo?disciplineSlug=crocs",
      order: 1,
      active: true,
    },
    {
      title: "Vóley Profesional FIVB",
      subtitle: "Balones oficiales Mikasa V200W e indumentaria técnica con envíos a todo el país.",
      imageUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1920&q=80",
      mobileUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80",
      linkUrl: "/catalogo?disciplineSlug=voley",
      order: 2,
      active: true,
    },
  ];

  console.log("🚀 Cargando banners de prueba en la base de datos...");

  for (const b of demoBanners) {
    const existing = await prisma.banner.findFirst({
      where: { title: b.title },
    });

    if (existing) {
      await prisma.banner.update({
        where: { id: existing.id },
        data: b,
      });
      console.log(`  ↻ Actualizado banner: "${b.title}"`);
    } else {
      await prisma.banner.create({
        data: b,
      });
      console.log(`  + Creado banner: "${b.title}"`);
    }
  }

  invalidateLandingCache("banner");

  console.log("\n✅ ¡Banners cargados con éxito!");
  console.log("👉 Abrí http://localhost:3000/ para ver el carrusel en vivo.");
  console.log("💡 Para quitarlos podés ejecutar: pnpm tsx scripts/seed-demo-banners.ts --clean\n");
}

main()
  .catch((e) => {
    console.error("Error al sembrar banners demo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
