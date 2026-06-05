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

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #142427;">
        <p>Hola ${this.escapeHtml(payload.fullName || '')}</p>
        <p>Te damos la bienvenida a Neyqo.</p>
        <p>Tu cuenta ya esta lista y puedes comenzar a usarla cuando quieras.</p>
      </div>
    `;

    const text = [
      `Hola ${payload.fullName || ''}`,
      'Te damos la bienvenida a Neyqo.',
      'Tu cuenta ya esta lista y puedes comenzar a usarla cuando quieras.',
    ].join('\n\n');

    const delivery = await this.sendMail({
      from: `${env.smtpFromName} <${env.smtpFromEmail}>`,
      to: payload.to,
      subject: 'Bienvenido a Neyqo',
      text,
      html,
    });

    this.ensureRecipientAccepted(payload.to, delivery);
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
}
