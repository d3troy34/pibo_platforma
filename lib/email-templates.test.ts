import { describe, expect, it } from "vitest"

import {
  invitationEmail,
  resetPasswordEmail,
  resetPasswordEmailText,
  welcomeEmail,
} from "./email-templates"

describe("resetPasswordEmail", () => {
  const resetUrl =
    "https://www.mipibo.com/auth/confirm?token_hash=abc123&type=recovery&next=%2Fupdate-password"

  it("uses the current Pibo brand and polished Spanish copy", () => {
    const html = resetPasswordEmail(resetUrl, "https://www.mipibo.com")

    expect(html).toContain('<html lang="es"')
    expect(html).toContain("Restablecé tu contraseña | Pibo")
    expect(html).toContain("Creá una contraseña nueva.")
    expect(html).toContain("no tenés que hacer nada")
    expect(html).toContain("#F4F0E8")
    expect(html).toContain("#3437D9")
    expect(html).not.toContain("#0F172A")
    expect(html).not.toContain("contrasena")
  })

  it("uses absolute, optional brand imagery without putting content in it", () => {
    const html = resetPasswordEmail(resetUrl, "https://preview.mipibo.com")

    expect(html).toContain(
      'src="https://preview.mipibo.com/brand/pibo-wordmark-email.png"'
    )
    expect(html).toContain(
      'src="https://preview.mipibo.com/brand/pibo-email-journey.jpg"'
    )
    expect(html).toContain('alt="" role="presentation"')
    expect(html).toContain("Crear contraseña nueva")
  })

  it("escapes the recovery URL before adding it to HTML attributes", () => {
    const unsafeUrl =
      'https://www.mipibo.com/auth/confirm?token=a&next=" onmouseover="alert(1)'
    const html = resetPasswordEmail(unsafeUrl)

    expect(html).toContain(
      "token=a&amp;next=&quot; onmouseover=&quot;alert(1)"
    )
    expect(html).not.toContain('next=" onmouseover="')
  })

  it("provides an accessible plain-text alternative", () => {
    const text = resetPasswordEmailText(resetUrl)

    expect(text).toContain("Creá una contraseña nueva")
    expect(text).toContain(resetUrl)
    expect(text).toContain("Tu contraseña seguirá siendo la misma.")
    expect(text).not.toContain("<")
  })
})

describe("legacy invitation and welcome emails", () => {
  it("escapes names, emails, and links before embedding them in HTML", () => {
    const unsafeName = '<img src=x onerror="alert(1)">'
    const unsafeEmail = 'buyer@example.com" onmouseover="alert(1)'
    const unsafeUrl = 'https://www.mipibo.com/invite/token&next=" onmouseover="alert(1)'

    const invitation = invitationEmail(unsafeName, unsafeUrl)
    const welcome = welcomeEmail(unsafeName, unsafeEmail, unsafeUrl)

    expect(invitation).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
    expect(invitation).toContain("token&amp;next=&quot; onmouseover=&quot;alert(1)")
    expect(invitation).not.toContain('<img src=x onerror="alert(1)">')
    expect(welcome).toContain("buyer@example.com&quot; onmouseover=&quot;alert(1)")
    expect(welcome).not.toContain('href="https://www.mipibo.com/invite/token&next="')
  })
})
