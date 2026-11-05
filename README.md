# Cloud Director Cockpit v2 — Pipeline + Proyectos

Web estática y responsive. Sin frameworks, compilaciones ni servidores propios.

## Funciones

- **Pipeline**: registrar pliegos, RFPs y oportunidades con importe estimado, fecha límite de oferta, fecha prevista de decisión y estado.
- **Cierre de oportunidades**: marcar **Ganada** o **Perdida**. Una oportunidad ganada puede convertirse en un proyecto con un botón, sin duplicarlo.
- **Proyectos**: nombre, cliente, estado, fecha inicial/final y **% de avance**. El % se introduce manualmente.
- **Resumen en cada vista**: importe de pipeline abierto, oportunidades ganadas/perdidas, proyectos en curso y avance medio.
- Búsqueda, filtros, editar, eliminar, backup JSON y restaurar demo.
- Instalación en la pantalla de inicio del iPhone desde Safari (PWA).

Los nombres e importes precargados son **ficticios**.

## 1. Probar la versión de demostración

El archivo `config.js` ya viene con ambos campos vacíos: se utiliza `localStorage` del navegador.

Para servirla en tu equipo, descomprime la carpeta y ejecuta:

```bash
python -m http.server 8000
```

Abre http://localhost:8000/ desde ese equipo. Si intentas abrir `index.html` como archivo local (`file://`), los módulos ES pueden ser bloqueados: usa el pequeño servidor o GitHub Pages.

## 2. Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube **el contenido** de esta carpeta a la raíz.
2. En el repositorio, **Settings → Pages → Build and deployment**.
3. Configura **Deploy from a branch**, rama `main`, carpeta `/(root)`.
4. Abre la dirección publicada, normalmente `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.
5. En Safari iOS, pulsa Compartir → Añadir a pantalla de inicio.

La demo guarda información **solo en el navegador y dispositivo utilizado**. Para usar los mismos datos en iPhone y PC, activa Supabase.

## 3. Activar Supabase para sincronizar

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor** y ejecuta `supabase-schema.sql` (crea solo dos tablas: `opportunities`, `projects`, ambas con RLS).
3. En Authentication habilita un mecanismo de acceso por email OTP/magic link. Configura **Site URL** y **Redirect URLs** con la URL exacta publicada en GitHub Pages (incluyendo la ruta del repositorio). Para una herramienta personal, limita los registros nuevos desde Authentication.
4. Edita `config.js`:

```js
window.COCKPIT_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabasePublishableKey: 'TU_CLAVE_PUBLICABLE_O_ANON'
};
```

5. Publica de nuevo los archivos en GitHub. Recarga la página y utiliza tu email para acceder.

**No coloques nunca una `service_role`, `secret key` ni claves privadas en `config.js`**. Es un archivo público. La seguridad de los datos depende de Auth y RLS. No desactives las políticas SQL.

El modo Supabase empieza vacío: no inserta automáticamente los datos ficticios. La importación JSON está prevista solamente para la demo local.

## Qué pasa al convertir una oportunidad ganada

1. En Pipeline, pulsa `Ganada` (o selecciona `Ganada` al editar).
2. Aparece la opción `Crear proyecto`.
3. Se abre el formulario del proyecto con nombre, cliente y notas precargadas; se inicia en 0%.
4. Al guardarlo aparecerá en la pestaña Proyectos, y la oportunidad seguirá en el histórico de Pipeline como ganada.

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz.
- `data.js`: modo demo, persistencia local, y conexión Supabase opcional.
- `config.js`: configuración pública.
- `supabase-schema.sql`: tablas y RLS.
- `manifest.webmanifest`, `sw.js` e `icons/`: PWA.

## Privacidad

No introduzcas en un proyecto personal externo información confidencial de tu empresa o de sus clientes sin autorización. Un repositorio público o GitHub Pages hace accesible el código de la aplicación, aunque los datos estén protegidos por RLS cuando se utiliza Supabase.
