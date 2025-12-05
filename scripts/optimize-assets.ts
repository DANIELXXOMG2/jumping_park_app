/**
 * Script de optimización de assets para Jumping Park
 * Convierte el logo a WebP optimizado y genera favicons
 * 
 * Uso: bun run scripts/optimize-assets.ts
 */

import sharp from "sharp";
import { existsSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(import.meta.dir, "../public");
const ASSETS_DIR = join(PUBLIC_DIR, "assets");
const LOGO_PATH = join(ASSETS_DIR, "jumping-park-logo.png");

async function optimizeAssets() {
  console.log("🎨 Iniciando optimización de assets...\n");

  // Verificar que el logo existe
  if (!existsSync(LOGO_PATH)) {
    console.error("❌ No se encontró el logo en:", LOGO_PATH);
    process.exit(1);
  }

  const logo = sharp(LOGO_PATH);
  const metadata = await logo.metadata();
  console.log(`📊 Logo original: ${metadata.width}x${metadata.height}px`);

  try {
    // 1. Logo WebP optimizado (máx 500px de ancho)
    console.log("\n1️⃣  Generando logo WebP optimizado (500px)...");
    await sharp(LOGO_PATH)
      .resize(500, null, { 
        withoutEnlargement: true,
        fit: "inside"
      })
      .webp({ quality: 85 })
      .toFile(join(ASSETS_DIR, "jumping-park-logo.webp"));
    console.log("   ✅ jumping-park-logo.webp creado");

    // 2. Logo PNG optimizado (para compatibilidad)
    console.log("\n2️⃣  Generando logo PNG optimizado (500px)...");
    await sharp(LOGO_PATH)
      .resize(500, null, { 
        withoutEnlargement: true,
        fit: "inside"
      })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(join(ASSETS_DIR, "jumping-park-logo-optimized.png"));
    console.log("   ✅ jumping-park-logo-optimized.png creado");

    // 3. Favicon ICO (multi-size: 16, 32, 48)
    console.log("\n3️⃣  Generando favicon.ico (16x16, 32x32, 48x48)...");
    // Sharp no soporta ICO directamente, generamos PNGs para cada tamaño
    const faviconSizes = [16, 32, 48];
    for (const size of faviconSizes) {
      await sharp(LOGO_PATH)
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(join(PUBLIC_DIR, `favicon-${size}x${size}.png`));
    }
    // Favicon 32x32 como principal
    await sharp(LOGO_PATH)
      .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(join(PUBLIC_DIR, "favicon.png"));
    console.log("   ✅ favicon.png y variantes creados");
    console.log("   ℹ️  Nota: Para .ico real, usa https://favicon.io o imagemagick");

    // 4. Apple Touch Icon (180x180)
    console.log("\n4️⃣  Generando apple-touch-icon.png (180x180)...");
    await sharp(LOGO_PATH)
      .resize(180, 180, { fit: "contain", background: { r: 46, g: 204, b: 113, alpha: 1 } }) // Fondo verde marca
      .png()
      .toFile(join(PUBLIC_DIR, "apple-touch-icon.png"));
    console.log("   ✅ apple-touch-icon.png creado");

    // 5. OG Image (1200x630 para redes sociales)
    console.log("\n5️⃣  Generando og-image.png (1200x630)...");
    // Crear imagen con fondo verde y logo centrado
    const ogWidth = 1200;
    const ogHeight = 630;
    const logoSize = 300;
    
    await sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
        channels: 4,
        background: { r: 46, g: 204, b: 113, alpha: 1 } // #2ECC71
      }
    })
      .composite([{
        input: await sharp(LOGO_PATH)
          .resize(logoSize, logoSize, { fit: "inside" })
          .toBuffer(),
        gravity: "center"
      }])
      .png()
      .toFile(join(PUBLIC_DIR, "og-image.png"));
    console.log("   ✅ og-image.png creado");

    // 6. Web manifest icons
    console.log("\n6️⃣  Generando íconos para manifest (192x192, 512x512)...");
    await sharp(LOGO_PATH)
      .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(join(PUBLIC_DIR, "icon-192.png"));
    
    await sharp(LOGO_PATH)
      .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(join(PUBLIC_DIR, "icon-512.png"));
    console.log("   ✅ icon-192.png e icon-512.png creados");

    // Resumen final
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡Optimización completada!");
    console.log("=".repeat(50));
    console.log("\n📁 Archivos generados:");
    console.log("   • public/assets/jumping-park-logo.webp");
    console.log("   • public/assets/jumping-park-logo-optimized.png");
    console.log("   • public/favicon.png");
    console.log("   • public/apple-touch-icon.png");
    console.log("   • public/og-image.png");
    console.log("   • public/icon-192.png");
    console.log("   • public/icon-512.png");
    console.log("\n💡 Recomendaciones:");
    console.log("   1. Actualiza las referencias de .png a .webp donde sea posible");
    console.log("   2. Para favicon.ico real, convierte favicon.png en https://favicon.io");
    console.log("   3. Puedes eliminar el logo original después de verificar");

  } catch (error) {
    console.error("❌ Error durante la optimización:", error);
    process.exit(1);
  }
}

optimizeAssets();
