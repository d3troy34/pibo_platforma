/**
 * Centralized email templates for the Mipibo platform.
 * All HTML email content is defined here to keep API routes clean.
 */

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character)
}

const DEFAULT_APP_URL = "https://www.mipibo.com"

function brandAssetUrl(path: string, appUrl?: string): string {
  const baseUrl = appUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL

  try {
    const url = new URL(baseUrl)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return new URL(path, DEFAULT_APP_URL).toString()
    }
    return new URL(path, url).toString()
  } catch {
    return new URL(path, DEFAULT_APP_URL).toString()
  }
}

function purchaseEmailShell(preview: string, content: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(preview)}</title>
  </head>
  <body style="margin: 0; padding: 32px 16px; background: #F4F0E8; color: #171717; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preview)}</div>
    <div style="max-width: 600px; margin: 0 auto; overflow: hidden; border: 1px solid #D8D0C2; border-radius: 24px; background: #FFFCF7;">
      <div style="padding: 24px 32px; border-bottom: 1px solid #E8E0D4;">
        <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.04em;">PIBO</span>
        <span style="float: right; color: #6657D9; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">Tu camino a Argentina</span>
      </div>
      <div style="padding: 40px 32px 36px;">${content}</div>
      <div style="padding: 20px 32px; border-top: 1px solid #E8E0D4; color: #756E65; font-size: 12px; line-height: 1.6;">
        Pibo · Acompañamiento para estudiar en Argentina<br>
        Si no reconoces esta compra, responde este correo para que podamos ayudarte.
      </div>
    </div>
  </body>
</html>`
}

export function purchaseInvitationEmail(
  fullName: string | undefined,
  inviteUrl: string,
): string {
  const greeting = fullName ? `Hola ${escapeHtml(fullName)},` : "Hola,"
  const safeInviteUrl = escapeHtml(inviteUrl)

  return purchaseEmailShell(
    "Tu compra fue aprobada. Crea tu acceso a Pibo.",
    `<p style="margin: 0 0 12px; color: #6657D9; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Pago aprobado</p>
      <h1 style="margin: 0 0 20px; font-size: 36px; line-height: 1.1; letter-spacing: -0.04em;">Tu curso ya es tuyo.</h1>
      <p style="margin: 0 0 16px; color: #514B44; font-size: 17px; line-height: 1.7;">${greeting}</p>
      <p style="margin: 0 0 28px; color: #514B44; font-size: 17px; line-height: 1.7;">Confirmamos tu compra. Falta un solo paso: crea tu contraseña y completa tus datos para entrar al campus.</p>
      <a href="${safeInviteUrl}" style="display: inline-block; padding: 15px 24px; border-radius: 999px; background: #6657D9; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none;">Crear mi acceso</a>
      <p style="margin: 24px 0 0; color: #756E65; font-size: 13px; line-height: 1.6;">El enlace vence en 7 dias. Si vence, puedes pedirnos uno nuevo sin perder tu compra.</p>`,
  )
}

export function courseReadyEmail(
  fullName: string | undefined,
  courseUrl: string,
): string {
  const greeting = fullName ? `Hola ${escapeHtml(fullName)},` : "Hola,"
  const safeCourseUrl = escapeHtml(courseUrl)

  return purchaseEmailShell(
    "Confirmamos tu compra. Ya puedes entrar a tu curso.",
    `<p style="margin: 0 0 12px; color: #2E806D; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Acceso habilitado</p>
      <h1 style="margin: 0 0 20px; font-size: 36px; line-height: 1.1; letter-spacing: -0.04em;">Todo listo para continuar.</h1>
      <p style="margin: 0 0 16px; color: #514B44; font-size: 17px; line-height: 1.7;">${greeting}</p>
      <p style="margin: 0 0 28px; color: #514B44; font-size: 17px; line-height: 1.7;">La compra quedo asociada a tu cuenta y el curso ya esta habilitado. Entra con el mismo email que usaste al pagar.</p>
      <a href="${safeCourseUrl}" style="display: inline-block; padding: 15px 24px; border-radius: 999px; background: #171717; color: #FFFFFF; font-size: 16px; font-weight: 700; text-decoration: none;">Entrar a mi curso</a>`,
  )
}

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

export function resetPasswordEmail(resetUrl: string, appUrl?: string): string {
  const safeResetUrl = escapeHtml(resetUrl)
  const safeWordmarkUrl = escapeHtml(
    brandAssetUrl("/brand/pibo-wordmark-email.png", appUrl)
  )
  const safeJourneyUrl = escapeHtml(
    brandAssetUrl("/brand/pibo-email-journey.jpg", appUrl)
  )
  const preview = "Usá este enlace seguro para crear una contraseña nueva."

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <title>Restablecé tu contraseña | Pibo</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      :root { color-scheme: light only; supported-color-schemes: light; }
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; display: block; height: auto; line-height: 100%; outline: none; text-decoration: none; }
      table { border-collapse: collapse !important; }
      a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

      @media only screen and (max-width: 620px) {
        .email-shell { width: 100% !important; }
        .email-gutter { padding-left: 24px !important; padding-right: 24px !important; }
        .email-heading { font-size: 34px !important; line-height: 38px !important; }
        .email-tagline { display: none !important; }
        .email-button { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="width: 100% !important; margin: 0; padding: 0; background-color: #F4F0E8; color: #171717; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
      ${preview}
      &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #F4F0E8;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; overflow: hidden; background-color: #FFFCF7; border: 1px solid #D8D0C2; border-radius: 24px;">
            <tr>
              <td class="email-gutter" style="padding: 20px 32px; border-bottom: 1px solid #E8E0D4;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" valign="middle">
                      <img src="${safeWordmarkUrl}" width="125" alt="Pibo" style="width: 125px; max-width: 125px;">
                    </td>
                    <td class="email-tagline" align="right" valign="middle" style="color: #6657D9; font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;">
                      Tu camino a Argentina
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td>
                <img src="${safeJourneyUrl}" width="600" alt="" role="presentation" style="width: 100%; max-width: 600px;">
              </td>
            </tr>

            <tr>
              <td class="email-gutter" style="padding: 38px 40px 34px;">
                <p style="margin: 0 0 12px; color: #6657D9; font-size: 12px; font-weight: 700; letter-spacing: 1.8px; line-height: 18px; text-transform: uppercase;">
                  Seguridad de tu cuenta
                </p>

                <h1 class="email-heading" style="margin: 0 0 20px; color: #171717; font-size: 40px; font-weight: 700; letter-spacing: -1.6px; line-height: 44px;">
                  Creá una contraseña nueva.
                </h1>

                <p style="margin: 0 0 14px; color: #514B44; font-size: 17px; line-height: 28px;">
                  Hola,
                </p>

                <p style="margin: 0 0 26px; color: #514B44; font-size: 17px; line-height: 28px;">
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta de Pibo. Para continuar, usá el siguiente botón:
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="border-radius: 999px; background-color: #3437D9;">
                      <!--[if mso]>
                      <v:roundrect href="${safeResetUrl}" style="height: 52px; v-text-anchor: middle; width: 258px;" arcsize="50%" strokecolor="#3437D9" fillcolor="#3437D9">
                        <w:anchorlock/>
                        <center style="color: #FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700;">
                          Crear contraseña nueva
                        </center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-->
                      <a class="email-button" href="${safeResetUrl}" style="display: inline-block; padding: 16px 24px; border: 1px solid #3437D9; border-radius: 999px; background-color: #3437D9; color: #FFFFFF; font-size: 16px; font-weight: 700; line-height: 18px; text-decoration: none;">
                        Crear contraseña nueva
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                  <tr>
                    <td style="padding: 18px 20px; border-left: 3px solid #F51881; background-color: #F8F4EC;">
                      <p style="margin: 0; color: #514B44; font-size: 14px; line-height: 22px;">
                        Si no pediste este cambio, no tenés que hacer nada. Tu contraseña seguirá siendo la misma.
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 28px 0 0; color: #756E65; font-size: 12px; line-height: 19px;">
                  ¿El botón no funciona?
                  <a href="${safeResetUrl}" style="color: #3437D9; font-weight: 700; text-decoration: underline;">Abrí el enlace seguro.</a>
                </p>
              </td>
            </tr>

            <tr>
              <td class="email-gutter" style="padding: 22px 32px; border-top: 1px solid #E8E0D4; background-color: #F8F4EC;">
                <p style="margin: 0 0 4px; color: #514B44; font-size: 12px; font-weight: 700; line-height: 18px;">
                  Pibo · Tu camino a Argentina
                </p>
                <p style="margin: 0; color: #756E65; font-size: 11px; line-height: 17px;">
                  © ${new Date().getFullYear()} Pibo. Este es un correo automático relacionado con la seguridad de tu cuenta.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function resetPasswordEmailText(resetUrl: string): string {
  return `Creá una contraseña nueva

Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta de Pibo.

Para crear una contraseña nueva, abrí este enlace seguro:
${resetUrl}

Si no pediste este cambio, no tenés que hacer nada. Tu contraseña seguirá siendo la misma.

Pibo · Tu camino a Argentina`
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
