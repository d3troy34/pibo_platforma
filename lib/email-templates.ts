/**
 * Centralized email templates for the Mipibo platform.
 * All HTML email content is defined here to keep API routes clean.
 *
 * NOTE: Prefer ASCII in templates to avoid encoding issues across email clients.
 */

export function confirmAccountEmail(fullName: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0F172A; color: #F0F9FF; padding: 40px 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 40px;">
      <h1 style="color: #7DD3FC; margin-bottom: 24px; font-size: 28px;">
        Confirma tu cuenta
      </h1>

      <p style="margin-bottom: 16px; line-height: 1.6; color: #CBD5E1;">
        Hola ${fullName},
      </p>

      <p style="margin-bottom: 32px; line-height: 1.6; color: #CBD5E1;">
        Haz clic en el boton de abajo para confirmar tu cuenta y entrar a la plataforma.
      </p>

      <a href="${confirmUrl}"
         style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
        Confirmar cuenta
      </a>

      <p style="margin-top: 24px; margin-bottom: 16px; line-height: 1.6; color: #94A3B8; font-size: 14px;">
        Si no creaste esta cuenta, puedes ignorar este email.
      </p>

      <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

      <p style="font-size: 12px; color: #64748B;">
        (c) ${new Date().getFullYear()} Mipibo. Todos los derechos reservados.
      </p>
    </div>
  </body>
</html>`
}

export function resetPasswordEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0F172A; color: #F0F9FF; padding: 40px 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 40px;">
      <h1 style="color: #7DD3FC; margin-bottom: 24px; font-size: 28px;">
        Restablecer contrasena
      </h1>

      <p style="margin-bottom: 24px; line-height: 1.6; color: #CBD5E1;">
        Haz clic en el boton de abajo para elegir una nueva contrasena.
      </p>

      <a href="${resetUrl}"
         style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
        Cambiar contrasena
      </a>

      <p style="margin-top: 24px; margin-bottom: 16px; line-height: 1.6; color: #94A3B8; font-size: 14px;">
        Si no solicitaste este cambio, puedes ignorar este email.
      </p>

      <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

      <p style="font-size: 12px; color: #64748B;">
        (c) ${new Date().getFullYear()} Mipibo. Todos los derechos reservados.
      </p>
    </div>
  </body>
</html>`
}

export function welcomeEmail(fullName: string, email: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0F172A; color: #F0F9FF; padding: 40px 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 40px;">
      <h1 style="color: #7DD3FC; margin-bottom: 24px; font-size: 28px;">
        Bienvenido a Mipibo, ${fullName}!
      </h1>

      <p style="margin-bottom: 24px; line-height: 1.6; color: #CBD5E1;">
        Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todo el contenido del curso.
      </p>

      <div style="background-color: #334155; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <h2 style="color: #7DD3FC; margin-top: 0; margin-bottom: 16px; font-size: 18px;">
          Configura tu contrasena:
        </h2>

        <p style="margin: 8px 0; color: #F0F9FF;">
          <strong>Email:</strong> ${email}
        </p>

        <p style="margin: 12px 0; color: #CBD5E1; font-size: 14px;">
          Haz clic en el boton de abajo para configurar tu contrasena y acceder al curso.
        </p>
      </div>

      <a href="${resetUrl}"
         style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
        Configurar Contrasena
      </a>

      <p style="margin-top: 24px; margin-bottom: 16px; line-height: 1.6; color: #94A3B8; font-size: 14px;">
        Este enlace expira en 24 horas. Si tienes problemas, puedes solicitar un nuevo enlace desde la pagina de inicio de sesion.
      </p>

      <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

      <p style="font-size: 12px; color: #64748B;">
        Si no solicitaste esta cuenta, puedes ignorar este email.
      </p>

      <p style="font-size: 12px; color: #64748B; margin-top: 16px;">
        (c) ${new Date().getFullYear()} Mipibo. Todos los derechos reservados.
      </p>
    </div>
  </body>
</html>`
}

export function invitationEmail(fullName: string | undefined, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0F172A; color: #F0F9FF; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 40px;">
      <h1 style="color: #7DD3FC; margin-bottom: 24px; font-size: 28px;">
        Bienvenido a Mipibo
      </h1>

      ${fullName ? `<p style="margin-bottom: 16px;">Hola ${fullName},</p>` : ""}

      <p style="margin-bottom: 24px; line-height: 1.6; color: #CBD5E1;">
        Has sido invitado a unirte a Mipibo, tu plataforma de preparacion para universidades argentinas.
      </p>

      <p style="margin-bottom: 32px; line-height: 1.6; color: #CBD5E1;">
        Haz clic en el boton de abajo para completar tu registro y acceder al curso:
      </p>

      <a href="${inviteUrl}"
         style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
        Aceptar Invitacion
      </a>

      <p style="margin-top: 32px; font-size: 14px; color: #94A3B8;">
        Este enlace expira en 7 dias.
      </p>

      <p style="margin-top: 16px; font-size: 14px; color: #94A3B8;">
        Si no esperabas este email, puedes ignorarlo.
      </p>

      <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

      <p style="font-size: 12px; color: #64748B;">
        (c) ${new Date().getFullYear()} Mipibo. Todos los derechos reservados.
      </p>
    </div>
  </body>
</html>`
}

export function announcementEmail(title: string, content: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mipibo.com"

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #60A5FA, #22D3EE); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Mipibo</h1>
    </div>

    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">\u{1F4E2} ${title}</h2>

        <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid #60A5FA; border-radius: 4px;">
          <p style="margin: 0; white-space: pre-wrap;">${content}</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${appUrl}/anuncios"
             style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
            Ver en la Plataforma
          </a>
        </div>
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
        Este es un anuncio oficial de Mipibo<br>
        <a href="${appUrl}" style="color: #60A5FA; text-decoration: none;">mipibo.com</a>
      </p>
    </div>
  </body>
</html>`
}
