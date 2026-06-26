import { createDecipheriv, createHash, createCipheriv, randomBytes } from 'crypto';

export class ExternalTokenCipher {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (!secret.trim()) {
      throw new Error('EXTERNAL_TOKEN_ENCRYPTION_KEY es obligatorio para sincronizar correos.');
    }

    this.key = createHash('sha256').update(secret).digest();
  }

  encrypt(token: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
  }

  decrypt(encryptedToken: string): string {
    const [rawIv, rawTag, rawEncrypted] = encryptedToken.split('.');

    if (!rawIv || !rawTag || !rawEncrypted) {
      throw new Error('Token externo cifrado inválido.');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(rawIv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(rawTag, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(rawEncrypted, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
