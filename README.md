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

## 3. Acceso con correo y contraseña

1. Ejecuta `supabase-schema.sql` en Supabase SQL Editor (si no lo hiciste ya).
2. En Supabase > Authentication > Users crea un usuario mediante **Add user > Create new user**, con tu email y una contraseña segura, y activa **Auto Confirm User**. Si ya existe ese email, no crees una segunda cuenta: utiliza otro email nuevo, o configura contraseña del existente desde un método administrativo autorizado.
3. En Authentication > Providers > Email, mantén activado Email y desactiva el registro público de nuevos usuarios una vez creado el tuyo.
4. `config.js` ya contiene la URL y la clave publicable proporcionadas; nunca añadas aquí tu contraseña.
5. Publica el contenido de esta carpeta en tu GitHub Pages. Entra con tu correo y contraseña; no hace falta SMTP para login.

Las tablas mantienen políticas RLS para que solo tú accedas a tus registros. La aplicación no permite registro público.

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
