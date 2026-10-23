# Instituto Técnico Nuestra Señora de Fátima

Sitio web del secundario diurno del Instituto Técnico Nuestra Señora de Fátima
(Secundaria Diurna A-893, Villa Soldati, CABA) y su panel de administración.

Sitio estático (HTML + CSS + JS sin framework) con datos en **Supabase**
(Postgres + Storage + Auth).

## Estructura

```
fatima-website/
├─ fatima-a893/            # aplicación (lo que se publica)
│  ├─ index.html           # inicio
│  ├─ galeria.html         # galería pública
│  ├─ proyectos.html       # proyectos
│  ├─ admin.html           # login
│  ├─ panel.html           # panel (dashboard)
│  ├─ panel-galeria.html   # ABM de fotos
│  ├─ panel-proyectos.html # ABM de proyectos
│  ├─ css/estilos.css      # estilos del sitio público
│  ├─ css/admin.css        # estilos del panel
│  ├─ js/
│  │  ├─ config.js         # cliente Supabase + configuración
│  │  ├─ galeria.js        # galería pública
│  │  ├─ proyectos.js      # proyectos públicos
│  │  ├─ admin.js          # login
│  │  ├─ panel.js          # sesión del panel
│  │  ├─ panel-galeria.js  # lógica del ABM de fotos
│  │  ├─ panel-proyectos.js
│  │  └─ copiar-correo.js
│  └─ img/                 # imágenes locales
├─ partials/               # barra superior, header y footer compartidos
├─ supabase/migrations/    # esquema versionado (SQL)
├─ scripts/                # build de parciales e imágenes
└─ README.md
```

## Stack

- HTML5, CSS3, JavaScript (vanilla, sin build obligatorio).
- [Bootstrap 5.3.3](https://getbootstrap.com/) vía CDN (solo el sitio público).
- [supabase-js v2](https://supabase.com/docs/reference/javascript) vía CDN.
- Base de datos, autenticación y almacenamiento: Supabase.

## Desarrollo local

Cualquier servidor estático sirve (no usar `file://` porque rompe módulos y CORS):

```powershell
# con Node instalado
npx serve fatima-a893
```

Abrir `http://localhost:3000`.

## Cabecera y pie compartidos

La barra superior, el header y el footer viven una sola vez en `partials/`.
`npm run build` los inyecta en `index.html`, `galeria.html` y `proyectos.html`
(el marcado entre `<!-- BARRA SUPERIOR -->` y `<main>`, y entre
`<!-- PIE -->` y `</footer>`). Es idempotente: podés correrlo las veces que
quieras y solo cambia si editaste un partial.

```powershell
npm install
npm run build
```

Para cambiar el menú, el logo o el pie: editar `partials/*.html` y correr
`npm run build`. No editar esas secciones a mano en las páginas.

## Configuración de Supabase

`fatima-a893/js/config.js` contiene la URL del proyecto y la **publishable key**
(es pública por diseño: la seguridad real depende de RLS).

```js
const SUPABASE_URL = 'https://<proyecto>.supabase.co';
const SUPABASE_KEY = 'sb_publishable_...';
```

### Tablas

| Tabla | Uso |
|---|---|
| `galeria_fotos` | fotos de la galería (`titulo`, `categoria`, `anio`, `lugar`, `descripcion`, `imagen_url`, `destacada`, `es_historica`, `orden`) |
| `proyectos` | proyectos (`nombre`, `descripcion`, `estado`, `imagen_url`, `orden`) |
| `categorias` | categorías editables (`nombre` único, `orden`) |

El esquema completo y las políticas RLS están en `supabase/migrations/`.
Aplicar con:

```powershell
npx supabase link --project-ref <ref>
npx supabase db push
```

### Storage

Bucket público `Fatima-website-imagenes`. Lectura pública; escritura/borrado
solo para usuarios autenticados.

### Autenticación

No hay registro público. Los usuarios del panel se crean a mano desde
**Authentication → Users** en Supabase.

## Panel de administración

- Entrar por `/admin.html`.
- **Galería**: alta individual, carga masiva (arrastrar y soltar con miniaturas),
  categorías desde el selector (`+ Añadir categoría…`), destacar, editar y borrar.
- **Proyectos**: alta/edición/borrado y orden manual.

## Datos de ejemplo / estados vacíos

Si una tabla está vacía o falla la consulta, el sitio muestra un estado vacío
(no inventa contenido).

## Deploy

El sitio es estático: se publica la carpeta `fatima-a893/` en cualquier hosting
(GitHub Pages, Netlify, Vercel, Cloudflare Pages). No requiere build.

## Mantenimiento

### Optimizar imágenes de la galería

Convierte a WebP (máx. 1600 px, calidad 80) y re-sube las fotos, actualizando
la base. En modo prueba solo descarga y convierte, sin tocar producción:

```powershell
npm run imagenes
```

Para aplicar (necesita una clave con permiso de escritura, nunca la publiques):

```powershell
$env:SUPABASE_WRITE_KEY = "sb_secret_..."
npm run imagenes -- --apply
```

Resultado medido con las 31 fotos actuales: **60,3 MB → 3,2 MB (95% menos)**.
Para archivos sueltos: poner los originales en `imagenes-originales/` y correr
`npm run imagenes -- --local` (genera `imagenes-webp/`).

## Seguridad

- La publishable key puede estar en el cliente; **nunca** subir la `service_role`.
- Toda escritura está protegida por RLS (solo `authenticated`).
- Antes de publicar cambios de RLS, probar que la publishable key no pueda
  insertar/actualizar/borrar.
