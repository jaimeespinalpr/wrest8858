# Ghetty Motor Home - Cuestionario interactivo

Proyecto preparado para la app/web del cuestionario de alquiler de motorhome de Ghetty Motor Home.

Estado: el ZIP completo está disponible en la conversación de ChatGPT y puede subirse a un hosting Node.js como Render, Railway o un VPS.

## Qué incluye

- Cuestionario interactivo con 50 preguntas.
- Opciones A, B y C por pregunta.
- Campo de respuesta personalizada.
- Revisión final antes de enviar.
- Backend Node.js/Express.
- Envío automático por email vía SMTP.
- Logo de Ghetty Motor Home integrado en la versión ZIP.

## Requisitos para publicar

- Node.js 18+
- Cuenta SMTP, por ejemplo Gmail con App Password, SendGrid, Mailgun, Outlook o Zoho.
- Variables de entorno:
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_SECURE
  - SMTP_USER
  - SMTP_PASS
  - SMTP_FROM
  - EMAIL_TO
  - DISPLAY_TIMEZONE

## Email destino sugerido

EMAIL_TO=jaimeespinalpr@gmail.com

## Nota

Este folder fue creado para separar el proyecto dentro del repositorio sin tocar otros archivos existentes.