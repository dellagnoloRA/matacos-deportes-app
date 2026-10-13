import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function generateErdImage() {
  const erdMdPath = path.join(process.cwd(), 'docs', 'ERD.md');
  const erdContent = fs.readFileSync(erdMdPath, 'utf8');
  
  // Extraer el bloque mermaid
  const mermaidMatch = erdContent.match(/```mermaid([\s\S]*?)```/);
  if (!mermaidMatch) {
    throw new Error('No se encontró bloque mermaid en docs/ERD.md');
  }
  const mermaidCode = mermaidMatch[1].trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 30px;
      background-color: #ffffff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    #wrapper {
      display: inline-block;
      padding: 20px;
      background: #ffffff;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div id="wrapper">
    <div class="title">Matacos Deportes — Modelo Relacional de Base de Datos (PostgreSQL / Prisma)</div>
    <div class="subtitle">Generado automáticamente desde prisma/schema.prisma con prisma-erd-generator</div>
    <div id="diagram" class="mermaid">
${mermaidCode}
    </div>
  </div>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      er: {
        useMaxWidth: false
      }
    });
  </script>
</body>
</html>
  `;

  const tempHtmlPath = path.join(process.cwd(), 'scratch', 'erd-render.html');
  fs.mkdirSync(path.dirname(tempHtmlPath), { recursive: true });
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  console.log('Lanzando Microsoft Edge con puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 2 });
  
  await page.goto('file:///' + tempHtmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0'
  });

  console.log('Esperando renderizado SVG de Mermaid...');
  await page.waitForSelector('#diagram svg', { timeout: 15000 });

  // Obtener SVG renderizado
  const svgContent = await page.$eval('#diagram svg', el => el.outerHTML);
  const outSvgPath = path.join(process.cwd(), 'docs', 'modelo_relacional.svg');
  fs.writeFileSync(outSvgPath, svgContent, 'utf8');
  console.log('SVG guardado en:', outSvgPath);

  // Obtener dimensiones del wrapper y tomar captura de alta resolucion
  const wrapperElement = await page.$('#wrapper');
  if (wrapperElement) {
    const outPngPath = path.join(process.cwd(), 'docs', 'modelo_relacional.png');
    await wrapperElement.screenshot({
      path: outPngPath,
      omitBackground: false
    });
    console.log('PNG guardado en:', outPngPath);
  }

  await browser.close();
  console.log('¡Imagen del modelo relacional generada con éxito!');
}

generateErdImage().catch(err => {
  console.error('Error generando imagen:', err);
  process.exit(1);
});
