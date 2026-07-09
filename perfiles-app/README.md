# Perfil de Atleta — Wrestling Performance Lab

Aplicación web independiente para **crear y editar el perfil de un atleta de lucha**. Es la sección de "crear perfil" de Wrestling Performance Lab extraída como app propia: formulario completo (Entrenamiento / Competencia / Resumen para Coach), foto de perfil con recorte, y guardado en Firebase.

Los perfiles se escriben en la **misma colección `users` del mismo proyecto de Firebase** que usa la app principal, así que cualquier atleta que complete su perfil aquí aparece automáticamente para los coaches en Wrestling Performance Lab.

## Flujo de la app

1. **Cuenta** — el atleta crea una cuenta (o inicia sesión si ya tiene una) con correo y contraseña vía Firebase Authentication.
2. **Perfil** — completa el formulario en tres secciones con barra de progreso:
   - *Entrenamiento*: datos básicos, rutinas, técnicas por defecto, retos actuales.
   - *Competencia*: estilo, nivel, arquetipo, plan de combate, experiencia internacional.
   - *Resumen para Coach*: lectura rápida, palabras clave, vista de esquina, top 3 movimientos.
3. **Guardado** — el perfil se escribe en `/users/{uid}` con `role: "athlete"`. Si el usuario vuelve a entrar, su perfil se carga y puede seguir editándolo.

La foto de perfil se puede subir desde el dispositivo o pegar como URL; se recorta (arrastrar + zoom) y se comprime automáticamente a un tamaño seguro para Firestore.

> **Nota de seguridad:** las reglas de Firestore del proyecto exigen que el usuario esté autenticado y solo pueda escribir su propio documento (`request.auth.uid == uid`). Por eso el flujo empieza con la creación de cuenta. No se modificó ninguna regla del proyecto original.

## Publicar con GitHub Pages

La app es 100% estática (sin build), así que se publica directamente:

1. En GitHub, abre **Settings → Pages** de este repositorio.
2. En **Source**, elige **Deploy from a branch**.
3. Selecciona la rama **`main`** y la carpeta **`/ (root)`**, y guarda.
4. En 1–2 minutos la app queda disponible en:
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`

> Si el inicio de sesión diera problemas en el dominio publicado, agrega ese dominio (`<tu-usuario>.github.io`) en Firebase Console → Authentication → Settings → **Authorized domains**.

## Ejecutar localmente

No requiere dependencias. Sirve los archivos con cualquier servidor estático:

```bash
npx serve .
```

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Marcado: paso de cuenta (crear/iniciar sesión), formulario de perfil en 3 pestañas, pantalla de éxito y modal de recorte de foto. |
| `styles.css` | Estilos (tema oscuro, tarjetas, stepper, barra de progreso, modal de recorte, responsive). |
| `app.js` | Lógica: Firebase Auth + Firestore, reanudación de sesión, precarga del perfil existente, recorte de foto (drag + zoom + canvas), progreso y guardado. |
| `firebase-config.public.js` | Configuración pública de Firebase (mismo proyecto que la app principal). |

## Cambiar de proyecto de Firebase

Para apuntar esta app a otro proyecto, reemplaza los valores de `firebase-config.public.js`. La configuración es pública por diseño (así funciona Firebase Web); la protección real de los datos está en las reglas de seguridad de Firestore.
