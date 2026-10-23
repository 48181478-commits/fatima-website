import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const BUCKET = 'Fatima-website-imagenes';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bagbcjwgmgplxofbabxk.supabase.co';
const READ_KEY = process.env.SUPABASE_KEY || 'sb_publishable_PGosapc2SnXka8hNaX0qqA_8xFVD4yP';
const WRITE_KEY = process.env.SUPABASE_WRITE_KEY || '';

const args = process.argv.slice(2);
const aplicar = args.includes('--apply');
const soloLocal = args.includes('--local');
const maxAncho = Number(process.env.MAX_WIDTH || 1600);
const calidad = Number(process.env.QUALITY || 80);

const RAIZ = process.cwd();
const entrada = path.join(RAIZ, 'imagenes-originales');
const salida = path.join(RAIZ, 'imagenes-webp');

function aKB(bytes) {
  return (bytes / 1024).toFixed(0) + ' KB';
}

async function leerFotos() {
  const url = `${SUPABASE_URL}/rest/v1/galeria_fotos?select=id,titulo,imagen_url&order=orden.asc`;
  const res = await fetch(url, { headers: { apikey: READ_KEY, Authorization: `Bearer ${READ_KEY}` } });
  if (!res.ok) throw new Error(`No se pudo leer galeria_fotos: ${res.status} ${await res.text()}`);
  return res.json();
}

function rutaEnBucket(url) {
  const marca = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
}

async function convertir(buffer, destino) {
  await fs.mkdir(path.dirname(destino), { recursive: true });
  const info = await sharp(buffer)
    .rotate()
    .resize({ width: maxAncho, withoutEnlargement: true })
    .webp({ quality: calidad, effort: 5 })
    .toFile(destino);
  return info.size;
}

async function subir(ruta, buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WRITE_KEY}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true'
    },
    body: buffer
  });
  if (!res.ok) throw new Error(`Subida fallida ${ruta}: ${res.status} ${await res.text()}`);
}

async function actualizarUrl(id, url) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/galeria_fotos?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: WRITE_KEY,
      Authorization: `Bearer ${WRITE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ imagen_url: url })
  });
  if (!res.ok) throw new Error(`Update fallido ${id}: ${res.status} ${await res.text()}`);
}

async function local() {
  let archivos = [];
  try {
    archivos = (await fs.readdir(entrada)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  } catch {
    throw new Error(`No existe la carpeta ${entrada}. Poné ahí las imágenes a convertir.`);
  }
  let antes = 0;
  let despues = 0;
  for (const archivo of archivos) {
    const origen = path.join(entrada, archivo);
    const buffer = await fs.readFile(origen);
    const destino = path.join(salida, archivo.replace(/\.(jpe?g|png)$/i, '.webp'));
    const tam = await convertir(buffer, destino);
    antes += buffer.length;
    despues += tam;
    console.log(`${archivo.padEnd(32)} ${aKB(buffer.length).padStart(8)} -> ${aKB(tam).padStart(8)}`);
  }
  console.log(`\nTOTAL ${aKB(antes)} -> ${aKB(despues)} (${(100 - (despues / antes) * 100).toFixed(0)}% menos)`);
  console.log(`Salida: ${salida}`);
}

async function remoto() {
  if (aplicar && !WRITE_KEY) {
    throw new Error('Falta SUPABASE_WRITE_KEY (service_role o usuario autenticado) para subir y actualizar la base.');
  }
  const fotos = await leerFotos();
  console.log(`Fotos en la base: ${fotos.length}\n`);
  let antes = 0;
  let despues = 0;
  let procesadas = 0;

  for (const foto of fotos) {
    const ruta = rutaEnBucket(foto.imagen_url || '');
    if (!ruta || !/\.(jpe?g|png)$/i.test(ruta)) continue;

    const res = await fetch(foto.imagen_url);
    if (!res.ok) { console.warn(`  salteada (${res.status}): ${foto.titulo}`); continue; }
    const buffer = Buffer.from(await res.arrayBuffer());

    const destino = path.join(salida, ruta.replace(/\.(jpe?g|png)$/i, '.webp'));
    const tam = await convertir(buffer, destino);
    antes += buffer.length;
    despues += tam;
    procesadas++;

    const nuevaRuta = ruta.replace(/\.(jpe?g|png)$/i, '.webp');
    console.log(`${String(procesadas).padStart(2)}. ${aKB(buffer.length).padStart(8)} -> ${aKB(tam).padStart(8)}  ${nuevaRuta}`);

    if (aplicar) {
      const webp = await fs.readFile(destino);
      await subir(nuevaRuta, webp);
      await actualizarUrl(foto.id, `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${nuevaRuta}`);
    }
  }

  console.log(`\nProcesadas: ${procesadas}`);
  console.log(`TOTAL ${aKB(antes)} -> ${aKB(despues)} (${(100 - (despues / antes) * 100).toFixed(0)}% menos)`);
  console.log(aplicar ? 'Cambios aplicados en Storage y base.' : 'Modo prueba: no se subió nada. Usá --apply para aplicar.');
}

if (soloLocal) await local();
else await remoto();
