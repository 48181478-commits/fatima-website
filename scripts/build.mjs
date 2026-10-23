import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.join(RAIZ, 'fatima-a893');
const PARTIALS = path.join(RAIZ, 'partials');

const PAGINAS = {
  'index.html': null,
  'galeria.html': 'galeria.html',
  'proyectos.html': 'proyectos.html'
};

const ETIQUETAS = {
  'galeria.html': 'Galería',
  'proyectos.html': 'Proyectos'
};

const RE_CABECERA = /[ \t]*<!-- BARRA SUPERIOR -->[\s\S]*?(?=\n[ \t]*<main>)/;
const RE_PIE = /[ \t]*<!-- PIE -->[\s\S]*?<\/footer>/;

const [barra, header, footer] = await Promise.all([
  fs.readFile(path.join(PARTIALS, 'barra-superior.html'), 'utf8'),
  fs.readFile(path.join(PARTIALS, 'header.html'), 'utf8'),
  fs.readFile(path.join(PARTIALS, 'footer.html'), 'utf8')
]);

function conActiva(html, archivo) {
  if (!archivo) return html;
  var etiqueta = ETIQUETAS[archivo];
  var plano = `<li><a href="${archivo}">${etiqueta}</a></li>`;
  var activo = `<li><a href="${archivo}" class="active" aria-current="page">${etiqueta}</a></li>`;
  return html.replace(plano, activo);
}

function enlacesLocales(html, archivo) {
  if (archivo !== 'index.html') return html;
  return html
    .replace(/href="index\.html#/g, 'href="#')
    .replace(/href="index\.html"/g, 'href="#inicio"');
}

let cambios = 0;

for (const [archivo, activa] of Object.entries(PAGINAS)) {
  const ruta = path.join(APP, archivo);
  const original = await fs.readFile(ruta, 'utf8');

  if (!RE_CABECERA.test(original) || !RE_PIE.test(original)) {
    console.warn(`  ${archivo}: no se encontraron los marcadores, se omite`);
    continue;
  }

  const cabecera = enlacesLocales(barra + '\n' + conActiva(header, activa), archivo);

  const salida = original
    .replace(RE_CABECERA, cabecera)
    .replace(RE_PIE, footer.trimEnd());

  if (salida !== original) {
    await fs.writeFile(ruta, salida, 'utf8');
    cambios++;
    console.log(`  actualizado: ${archivo}`);
  } else {
    console.log(`  sin cambios: ${archivo}`);
  }
}

console.log(`\nPáginas actualizadas: ${cambios}`);
