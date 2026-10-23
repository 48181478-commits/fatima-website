# Instituto Técnico Nuestra Señora de Fátima

Sitio web del secundario diurno del Instituto Técnico Nuestra Señora de Fátima
(Secundaria Diurna A-893, Villa Soldati, CABA) y su panel de administración.

Sitio estático generado con **Astro**. Los datos (fotos, proyectos, categorías,
usuarios) viven en **Supabase**: Postgres + Storage + Auth. No hay backend
propio: Supabase es el backend.

## Stack

- [Astro 5](https://astro.build/) (salida estática, sin servidor).
- [Bootstrap 5.3.3](https://getbootstrap.com/) por CDN (solo sitio público).
- [supabase-js v2](https://supabase.com/docs/reference/javascript) por CDN.
- Postgres, Storage y Auth de Supabase.

## Estructura

```
fatima-website/
├─ src/
│  ├─ pages/                 # una página por ruta
│  │  ├─ index.astro
│  │  ├─ galeria.astro
│  │  ├─ proyectos.astro
│  │  ├─ 404.astro
│  │  ├─ robots.txt.ts       # robots generado con la URL del sitio
│  │  ├─ admin.astro         # login
│  │  ├─ panel.astro
│  │  ├─ panel-galeria.astro
│  │  └─ panel-proyectos.astro
│  ├─ layouts/Base.astro     # <head>, SEO, estilos y <body>
│  ├─ components/
│  │  ├─ Header.astro        # barra superior + header + menú
│  │  └─ Footer.astro
│  └─ contenido/             # fragmentos HTML del contenido de cada página
├─ public/                   # se copia tal cual a dist/
│  ├─ css/  ├─ js/  └─ img/
├─ supabase/migrations/      # esquema versionado (SQL)
├─ scripts/optimizar-imagenes.mjs
├─ .github/workflows/deploy.yml
└─ astro.config.mjs
```

## Requisitos

- Node 20 o superior.

## Desarrollo

```powershell
npm install
npm run dev
```

Abrir `http://localhost:4321`.

```powershell
npm run build     # genera dist/
npm run preview   # sirve dist/ localmente
```

## Editar contenido

- **Cabecera, menú y pie**: `src/components/Header.astro` y `Footer.astro`.
  Son la única copia: se usan en las tres páginas públicas.
- **Contenido de cada página**: `src/contenido/<pagina>.html`. Son fragmentos
  HTML que se insertan dentro de `<main>` (o del `<body>` en el panel).
- **SEO por página**: props de `Base` en cada archivo de `src/pages/`
  (`title`, `description`, `image`, `noindex`). Canonical, Open Graph, Twitter y
  `og:image` se generan solos.
- **Datos de fotos/proyectos/categorías**: se administran desde el panel.

## SEO

- `Base.astro` genera canonical, `og:*`, `twitter:*` y permite JSON-LD.
- `index.astro` incluye JSON-LD de tipo `School`.
- `@astrojs/sitemap` genera `sitemap-index.xml` / `sitemap-0.xml` y excluye el
  panel.
- `src/pages/robots.txt.ts` genera `robots.txt` con la URL del sitio.
- `404.astro` genera `404.html`.
- Las páginas del panel llevan `noindex, nofollow`.

## URL del sitio

`astro.config.mjs` toma dos variables de entorno:

| Variable | Default | Uso |
|---|---|---|
| `SITE_URL` | `https://fatimarem.edu.ar` | Dominio para canonical, OG y sitemap |
| `BASE_PATH` | `/` | Subruta si se publica en `usuario.github.io/repo` |

Ejemplo para GitHub Pages sin dominio propio:

```powershell
$env:SITE_URL = "https://48181478-commits.github.io"
$env:BASE_PATH = "/fatima-website"
npm run build
```

## Deploy en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica `dist/` en cada
push a `main`.

1. En el repo: **Settings → Pages → Source: GitHub Actions**.
2. Opcional: **Settings → Secrets and variables → Actions → Variables** para
   definir `SITE_URL` y `BASE_PATH`.
3. Push a `main` (o correr el workflow a mano).

Si más adelante usan un dominio propio, cargarlo en **Settings → Pages** y
poner `SITE_URL` con ese dominio.

## Base de datos (Supabase)

`public/js/config.js` contiene la URL del proyecto y la **publishable key**
(pública por diseño: la seguridad depende de RLS).

### Tablas

| Tabla | Uso |
|---|---|
| `galeria_fotos` | fotos (`titulo`, `categoria`, `anio`, `lugar`, `descripcion`, `imagen_url`, `destacada`, `es_historica`, `orden`) |
| `proyectos` | proyectos (`nombre`, `descripcion`, `estado`, `imagen_url`, `orden`) |
| `categorias` | categorías editables (`nombre` único, `orden`) |

### Migraciones

El esquema completo y las políticas RLS están en `supabase/migrations/`.
Aplicar con Supabase CLI:

```powershell
npx supabase link --project-ref bagbcjwgmgplxofbabxk
npx supabase db push
```

También se pueden pegar los `.sql` en **SQL Editor** del dashboard. No editar
el esquema a mano sin agregar la migración correspondiente.

### Storage

Bucket público `Fatima-website-imagenes`. Lectura pública; escritura y borrado
solo para usuarios autenticados.

### Autenticación

No hay registro público. Los usuarios del panel se crean desde
**Authentication → Users** en Supabase.

## Panel

- Entrar por `/admin.html`.
- **Galería**: alta individual, carga masiva (arrastrar y soltar), categorías
  desde el selector (`+ Añadir categoría…`), destacar, editar y borrar.
- **Proyectos**: alta/edición/borrado.

## Imágenes

`npm run imagenes` descarga las fotos de Supabase, las convierte a WebP
(máx. 1600 px, calidad 80) y re-sube. En modo prueba no toca producción:

```powershell
npm run imagenes
```

Para aplicar (clave con permiso de escritura, nunca publicarla):

```powershell
$env:SUPABASE_WRITE_KEY = "sb_secret_..."
npm run imagenes -- --apply
Remove-Item Env:SUPABASE_WRITE_KEY
```

Resultado con las 31 fotos originales: **60,3 MB → 3,2 MB (95% menos)**.
Para archivos sueltos: `imagenes-originales/` + `npm run imagenes -- --local`.

## Ramas

Ramas por funcionalidad (`feat/...`, `fix/...`), no por capa: no hay backend
separado. Los cambios de base se versionan en `supabase/migrations/`.

## Seguridad

- La publishable key puede estar en el cliente; **nunca** subir la
  `service_role` ni claves secretas al repo.
- Toda escritura está protegida por RLS (solo `authenticated`).
- Rotar cualquier clave que se haya compartido fuera del dashboard.
