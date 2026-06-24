import type {
  EmailMessage,
  EmailTransactionParser,
  EmailTransactionParserStrategy,
  ParsedEmailTransactionEventType,
  ParsedEmailTransactionStatus,
  ParsedEmailTransaction,
} from './types';

export class StrategyEmailTransactionParser implements EmailTransactionParser {
  constructor(private readonly strategies: EmailTransactionParserStrategy[]) {}

  async parse(message: EmailMessage): Promise<ParsedEmailTransaction | null> {
    const strategy = this.strategies.find((candidate) => candidate.canParse(message));

    if (!strategy) {
      return null;
    }

    return strategy.parse(message);
  }
}

export class PendingEmailTransactionParser implements EmailTransactionParser {
  private readonly parser = new StrategyEmailTransactionParser([
    new BanescoEmailTransactionParserStrategy(),
    new QikEmailTransactionParserStrategy(),
  ]);

  async parse(_message: EmailMessage): Promise<ParsedEmailTransaction | null> {
    return this.parser.parse(_message);
  }
}

export class BanescoEmailTransactionParserStrategy implements EmailTransactionParserStrategy {
  readonly name = 'banesco-dominican-card-alert';

  canParse(message: EmailMessage): boolean {
    const text = normalizeEmailText(message);
    return /\bbanesco\b/i.test(text) && /\bterminada en\s+\d{4}\b/i.test(text);
  }

  async parse(message: EmailMessage): Promise<ParsedEmailTransaction | null> {
    const text = normalizeEmailText(message);
    const productName = findFirstMatch(text, /tu tarjeta\s+(.+?)\s+banesco\s+terminada en/i);
    const cardLastDigits = findFirstMatch(text, /terminada en\s+(\d{4})/i);
    const dateValue = findFirstMatch(text, /fecha\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
    const amountMatch = text.match(/(?:consumo|reverso|reversada|reversado|devoluci[oó]n|pago)\s+de\s+(RD\$|US\$|EUR\$?)\s*([\d,]+(?:\.\d{2})?)/i);
    const merchant = findFirstMatch(text, /presenta\s+(?:un|una)?\s*(?:consumo|reverso|reversada|reversado|devoluci[oó]n|pago)\s+de\s+(?:RD\$|US\$|EUR\$?)\s*[\d,]+(?:\.\d{2})?,\s+en\s+(.+?)\s+y su estado es/i);
    const statusText = findFirstMatch(text, /su estado es\s+([a-záéíóúñ]+)/i);

    if (!cardLastDigits || !dateValue || !amountMatch || !merchant) {
      return null;
    }

    const eventType = resolveEventType(text);

    return {
      userId: message.userId,
      provider: message.provider,
      externalMessageId: message.externalMessageId,
      bankCode: 'banesco',
      eventType,
      status: resolveStatus(statusText),
      productName: productName ? normalizeWhitespace(productName) : undefined,
      cardLastDigits,
      merchant: normalizeWhitespace(merchant),
      amount: parseAmount(amountMatch[2]),
      currency: resolveCurrency(amountMatch[1]),
      transactionDate: parseDominicanDate(dateValue),
      rawDescription: text,
      confidence: eventType === 'purchase' ? 0.95 : 0.86,
    };
  }
}

export class QikEmailTransactionParserStrategy implements EmailTransactionParserStrategy {
  readonly name = 'qik-dominican-card-alert';

  canParse(message: EmailMessage): boolean {
    const text = normalizeEmailText(message);
    return /\bqik\b/i.test(text) && /(?:tarjeta|termina en)\s+\d{2}\*+\d{4}/i.test(text);
  }

  async parse(message: EmailMessage): Promise<ParsedEmailTransaction | null> {
    const text = normalizeEmailText(message);
    const maskedCard = findFirstMatch(text, /(?:tarjeta|termina en)\s+(\d{2}\*+\d{4})/i);
    const cardLastDigits = maskedCard?.slice(-4);
    const merchant =
      findFirstMatch(text, /Localidad\s+(.+?)\s+Fecha y hora/i) ??
      findFirstMatch(text, /transacci[oó]n\s+de\s+(?:RD\$|US\$|EUR\$?)\s*[\d,]+(?:\.\d{2})?\s+en\s+(.+?)\s+con tu tarjeta/i);
    const dateValue = findFirstMatch(text, /Fecha y hora\s+(\d{1,2}-\d{1,2}-\d{4})\s+\d{1,2}:\d{2}\s*(?:AM|PM)/i);
    const amountMatch =
      text.match(/Monto\s+(RD\$|US\$|EUR\$?)\s*([\d,]+(?:\.\d{2})?)/i) ??
      text.match(/transacci[oó]n\s+de\s+(RD\$|US\$|EUR\$?)\s*([\d,]+(?:\.\d{2})?)/i);
    const productName = findFirstMatch(text, /con tu\s+(tarjeta\s+.+?\s+Qik)\s+que termina/i);

    if (!cardLastDigits || !merchant || !dateValue || !amountMatch) {
      return null;
    }

    return {
      userId: message.userId,
      provider: message.provider,
      externalMessageId: message.externalMessageId,
      bankCode: 'qik',
      eventType: resolveEventType(text),
      status: 'approved',
      productName: productName ? normalizeWhitespace(productName) : 'tarjeta Qik',
      cardLastDigits,
      merchant: normalizeWhitespace(merchant),
      amount: parseAmount(amountMatch[2]),
      currency: resolveCurrency(amountMatch[1]),
      transactionDate: parseMonthDayYearDate(dateValue),
      rawDescription: text,
      confidence: 0.93,
    };
  }
}

function normalizeEmailText(message: EmailMessage): string {
  return normalizeWhitespace(
    [message.subject, message.safeSnippet, message.bodyText]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' '),
  );
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function findFirstMatch(value: string, pattern: RegExp): string | undefined {
  return value.match(pattern)?.[1]?.trim();
}

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, ''));
}

function resolveCurrency(value: string): ParsedEmailTransaction['currency'] {
  const normalized = value.toUpperCase();

  if (normalized.startsWith('US')) {
    return 'USD';
  }

  if (normalized.startsWith('EUR')) {
    return 'EUR';
  }

  return 'DOP';
}

function parseDominicanDate(value: string): string {
  const [day, month, rawYear] = value.split('/').map(Number);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseMonthDayYearDate(value: string): string {
  const [month, day, year] = value.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function resolveEventType(value: string): ParsedEmailTransactionEventType {
  if (/revers[oa]|reversada|reversado|devoluci[oó]n/i.test(value)) {
    return 'reversal';
  }

  if (/\bpago\b/i.test(value)) {
    return 'payment';
  }

  if (/\bconsumo\b|\btransacci[oó]n\b/i.test(value)) {
    return 'purchase';
  }

  return 'unknown';
}

function resolveStatus(value: string | undefined): ParsedEmailTransactionStatus {
  if (!value) {
    return 'unknown';
  }

  if (/aprobad[ao]/i.test(value)) {
    return 'approved';
  }

  if (/rechazad[ao]|declinad[ao]|fallid[ao]/i.test(value)) {
    return 'declined';
  }

  if (/pendiente/i.test(value)) {
    return 'pending';
  }

  return 'unknown';
}
