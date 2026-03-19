import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendVerificationEmail(toEmail, name, code) {
  const transporter = createTransport()

  await transporter.sendMail({
    from: `"Intelisale Project Tracker" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Verifikacioni kod — Intelisale Project Tracker',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #111318; border-radius: 12px; color: #E8EBF2;">
        <h2 style="font-size: 20px; margin-bottom: 8px; color: #E8EBF2;">Zdravo, ${name}!</h2>
        <p style="color: #6B7A99; font-size: 14px; margin-bottom: 28px;">
          Hvala što si se registrovao na Intelisale Project Tracker. Unesi kod ispod da verifikuješ svoj nalog.
        </p>
        <div style="background: #15181F; border: 1px solid #1E2433; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-family: 'DM Mono', monospace; font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #4F8EF7;">
            ${code}
          </div>
        </div>
        <p style="color: #6B7A99; font-size: 13px; text-align: center;">
          Kod važi <strong style="color: #E8EBF2;">15 minuta</strong>. Ako nisi ti, ignoriši ovaj email.
        </p>
      </div>
    `,
    text: `Tvoj verifikacioni kod je: ${code}\nKod važi 15 minuta.`,
  })
}
