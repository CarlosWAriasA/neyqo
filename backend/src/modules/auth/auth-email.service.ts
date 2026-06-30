import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';

interface AuthEmailPayload {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
}

interface WelcomeEmailPayload {
  to: string;
  fullName: string;
}

export class AuthEmailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly reason: 'recipientRejected' | 'deliveryFailed',
  ) {
    super(message);
    this.name = 'AuthEmailDeliveryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthEmailService {
  private readonly transporter: Transporter | null;

  constructor() {
    if (!env.smtpHost || !env.smtpFromEmail) {
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth:
        env.smtpUser && env.smtpPass
          ? {
              user: env.smtpUser,
              pass: env.smtpPass,
            }
          : undefined,
    });
  }

  async sendEmailVerificationCode(payload: AuthEmailPayload): Promise<void> {
    await this.sendCodeEmail({
      ...payload,
      subject: 'Confirma tu correo en Neyqo',
      intro: 'Usa este codigo para activar tu cuenta.',
      footer: 'Si no creaste esta cuenta, puedes ignorar este mensaje.',
    });
  }

  async sendPasswordResetCode(payload: AuthEmailPayload): Promise<void> {
    await this.sendCodeEmail({
      ...payload,
      subject: 'Restablece tu acceso en Neyqo',
      intro: 'Usa este codigo para cambiar tu contrasena.',
      footer: 'Si no solicitaste este cambio, ignora este correo.',
    });
  }

  async sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
    if (!this.transporter) {
      if (env.nodeEnv === 'development' || env.mailDevLogCodes) {
        console.info(`[AuthEmailService] Bienvenida de Neyqo enviada a ${payload.to}.`);
        return;
      }

      throw new Error('SMTP no esta configurado para enviar correos.');
    }

    const applicationUrl = this.getApplicationUrl();
    const safeApplicationUrl = this.escapeHtml(applicationUrl);
    const safeFullName = this.escapeHtml(payload.fullName.trim() || '');
    const greeting = safeFullName ? `Hola, ${safeFullName}` : 'Hola';
    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bienvenido a Neyqo</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f1f5f9; color:#0f172a; font-family:Arial, Helvetica, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Tu espacio financiero está listo. Registra tu primer gasto en Neyqo.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:24px; overflow:hidden; box-shadow:0 18px 45px rgba(15,23,42,0.10);">
            <tr>
              <td style="padding:28px 32px; background-color:#0f766e;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="48" height="48" align="center" valign="middle" style="width:48px; height:48px; border-radius:14px; background-color:#ccfbf1; color:#0f766e; font-size:24px; line-height:48px;">&#128179;</td>
                    <td style="padding-left:14px;">
                      <div style="font-size:22px; line-height:28px; font-weight:700; color:#ffffff;">Neyqo</div>
                      <div style="font-size:13px; line-height:18px; color:#ccfbf1;">Finanzas claras</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px 16px;">
                <p style="margin:0 0 14px; font-size:14px; line-height:20px; font-weight:700; color:#0f766e; text-transform:uppercase; letter-spacing:0.08em;">${greeting}</p>
                <h1 style="margin:0 0 18px; font-size:34px; line-height:41px; letter-spacing:-0.03em; color:#0f172a;">Tus finanzas empiezan con un primer movimiento.</h1>
                <p style="margin:0; font-size:17px; line-height:27px; color:#475569;">Tu cuenta ya está lista. Empieza registrando un gasto de hoy y Neyqo te ayudará a entender mejor a dónde va tu dinero.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="44" valign="top" style="padding:14px 0; border-bottom:1px solid #e2e8f0;">
                      <div style="width:40px; height:40px; border-radius:12px; background-color:#ccfbf1; color:#0f766e; font-size:20px; line-height:40px; text-align:center;">&#128179;</div>
                    </td>
                    <td valign="top" style="padding:14px 0 14px 14px; border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px; font-size:16px; line-height:22px; font-weight:700; color:#0f172a;">Añade tus cuentas</p>
                      <p style="margin:0; font-size:14px; line-height:21px; color:#64748b;">Organiza el dinero que manejas en efectivo, bancos o tarjetas.</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="44" valign="top" style="padding:14px 0; border-bottom:1px solid #e2e8f0;">
                      <div style="width:40px; height:40px; border-radius:12px; background-color:#dcfce7; color:#15803d; font-size:20px; line-height:40px; text-align:center;">&#129534;</div>
                    </td>
                    <td valign="top" style="padding:14px 0 14px 14px; border-bottom:1px solid #e2e8f0;">
                      <p style="margin:0 0 4px; font-size:16px; line-height:22px; font-weight:700; color:#0f172a;">Registra tu primer gasto</p>
                      <p style="margin:0; font-size:14px; line-height:21px; color:#64748b;">Anota una compra reciente para comenzar a ver tu actividad.</p>
                    </td>
                  </tr>
                  <tr>
                    <td width="44" valign="top" style="padding:14px 0;">
                      <div style="width:40px; height:40px; border-radius:12px; background-color:#dbeafe; color:#1d4ed8; font-size:20px; line-height:40px; text-align:center;">&#127919;</div>
                    </td>
                    <td valign="top" style="padding:14px 0 14px 14px;">
                      <p style="margin:0 0 4px; font-size:16px; line-height:22px; font-weight:700; color:#0f172a;">Define un presupuesto</p>
                      <p style="margin:0; font-size:14px; line-height:21px; color:#64748b;">Pon límites claros para las categorías que más te importan.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 40px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#0f766e" style="border-radius:12px;">
                      <a href="${safeApplicationUrl}" target="_blank" style="display:inline-block; padding:15px 24px; color:#ffffff; font-size:16px; line-height:20px; font-weight:700; text-decoration:none;">Ir a Neyqo&nbsp;&nbsp;&rarr;</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 0; font-size:13px; line-height:20px; color:#94a3b8;">Si el botón no funciona, abre este enlace:<br><a href="${safeApplicationUrl}" style="color:#0f766e; word-break:break-all;">${safeApplicationUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0;">
                <p style="margin:0; font-size:12px; line-height:19px; color:#64748b;">Recibes este correo porque acabas de crear una cuenta en Neyqo. La conexión con Gmail u otros proveedores de correo es opcional y se gestiona por separado desde la aplicación.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    const text = [
      payload.fullName.trim() ? `Hola, ${payload.fullName.trim()}` : 'Hola',
      'Tus finanzas empiezan con un primer movimiento.',
      'Tu cuenta ya está lista. Empieza registrando un gasto de hoy y Neyqo te ayudará a entender mejor a dónde va tu dinero.',
      'Primeros pasos:',
      '- Añade tus cuentas.',
      '- Registra tu primer gasto.',
      '- Define un presupuesto.',
      `Ir a Neyqo: ${applicationUrl}`,
    ].join('\n\n');

    const delivery = await this.sendMail({
      from: `${env.smtpFromName} <${env.smtpFromEmail}>`,
      to: payload.to,
      subject: 'Tu espacio financiero en Neyqo ya está listo',
      text,
      html,
    });

    this.ensureRecipientAccepted(payload.to, delivery);
    this.logDeliveryResult(payload.to, delivery);
  }

  private async sendCodeEmail(
    payload: AuthEmailPayload & {
      subject: string;
      intro: string;
      footer: string;
    },
  ): Promise<void> {
    if (env.nodeEnv === 'development' && env.mailDevLogCodes) {
      console.info(
        `[AuthEmailService] ${payload.subject} para ${payload.to}. Codigo: ${payload.code}`,
      );
    }

    if (!this.transporter) {
      if (env.nodeEnv === 'development' && env.mailDevLogCodes) {
        return;
      }

      throw new Error('SMTP no esta configurado para enviar correos.');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #142427;">
        <p>Hola ${this.escapeHtml(payload.fullName || '')}</p>
        <p>${payload.intro}</p>
        <p style="margin: 20px 0; font-size: 28px; font-weight: 700; letter-spacing: 0.22em;">
          ${payload.code}
        </p>
        <p>Este codigo expira en ${payload.expiresInMinutes} minutos.</p>
        <p>${payload.footer}</p>
      </div>
    `;

    const text = [
      `Hola ${payload.fullName || ''}`,
      payload.intro,
      `Codigo: ${payload.code}`,
      `Este codigo expira en ${payload.expiresInMinutes} minutos.`,
      payload.footer,
    ].join('\n\n');

    const delivery = await this.sendMail({
      from: `${env.smtpFromName} <${env.smtpFromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      text,
      html,
    });

    this.ensureRecipientAccepted(payload.to, delivery);
    this.logDeliveryResult(payload.to, delivery);
  }

  private async sendMail(message: Parameters<Transporter['sendMail']>[0]) {
    if (!this.transporter) {
      throw new AuthEmailDeliveryError('No hay un transporte SMTP disponible.', 'deliveryFailed');
    }

    try {
      return await this.transporter.sendMail(message);
    } catch {
      throw new AuthEmailDeliveryError(
        'No fue posible entregar el correo al proveedor SMTP.',
        'deliveryFailed',
      );
    }
  }

  private ensureRecipientAccepted(
    recipient: string,
    delivery: Awaited<ReturnType<Transporter['sendMail']>>,
  ): void {
    const acceptedCount = Array.isArray(delivery.accepted) ? delivery.accepted.length : 0;
    const rejectedCount = Array.isArray(delivery.rejected) ? delivery.rejected.length : 0;

    if (acceptedCount > 0 && rejectedCount === 0) {
      return;
    }

    throw new AuthEmailDeliveryError(
      `El proveedor SMTP rechazó el correo de destino ${recipient}.`,
      'recipientRejected',
    );
  }

  private logDeliveryResult(
    recipient: string,
    delivery: Awaited<ReturnType<Transporter['sendMail']>>,
  ): void {
    if (env.nodeEnv !== 'development' && !env.mailDevLogCodes) {
      return;
    }

    console.info(
      `[AuthEmailService] Correo aceptado por SMTP para ${recipient}. MessageId: ${delivery.messageId ?? 'n/a'}`,
    );
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private getApplicationUrl(): string {
    const configuredUrl = env.frontendUrl || env.appUrl || 'http://localhost:5173';
    return new URL('/app/dashboard', `${configuredUrl.replace(/\/+$/, '')}/`).toString();
  }
}
