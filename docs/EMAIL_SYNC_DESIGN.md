# Email Sync Design

## Objective

Email sync will reduce manual transaction entry by detecting bank or card consumption messages sent to the user's email.

Email import rules, imported transaction review storage, automatic high-confidence expense creation, mail OAuth connection storage, and initial provider inbox fetching are implemented. The worker currently supports bounded Gmail and Outlook inbox reads for supported bank alert formats.

## Consent

Email-reading permission must be requested only from `/app/sync` or a clearly sync-specific flow. Authentication with Google or Microsoft must not request mail scopes.

## Gmail

Gmail integration uses server-side OAuth 2.0 with a separate redirect URI through `GOOGLE_GMAIL_REDIRECT_URI`.

Current mail sync scope: `gmail.readonly`, requested only from `/app/sync`.

Before publishing, Google verification may be required depending on scopes and product status.

## Outlook

Outlook integration uses Microsoft Graph delegated permissions with `MICROSOFT_MAIL_REDIRECT_URI`.

Current mail sync scope: `Mail.Read`, requested only from `/app/sync`.

## Token Storage

External provider tokens are stored encrypted with `EXTERNAL_TOKEN_ENCRYPTION_KEY`.

Do not expose provider tokens to the browser beyond what is strictly required by OAuth.

## Conceptual Entities

### ExternalConnection

- `id`
- `userId`
- `provider`
- `email`
- `status`
- `scopes`
- `encryptedAccessToken`
- `encryptedRefreshToken`
- `tokenExpiresAt`
- `lastSyncAt`
- `createdAt`
- `updatedAt`
- `revokedAt`

### EmailSyncRun

- `id`
- `externalConnectionId`
- `startedAt`
- `finishedAt`
- `status`
- `processedEmails`
- `detectedTransactions`
- `importedTransactions`
- `errorMessage`

### ImportedTransaction

- `id`
- `userId`
- `externalConnectionId`
- `sourceMessageId`
- `provider`
- `bankCode`
- `eventType`
- `merchant`
- `amount`
- `currency`
- `transactionDate`
- `cardLastDigits`
- `accountId`
- `categoryId`
- `confidence`
- `rawDescription`
- `status`
- `createdAt`

### EmailImportRule

Rules are created by the user from the web app and are the bridge between a bank email and a Neyqo account.

- `id`
- `userId`
- `bankCode`
- `accountId`
- `categoryId`
- `productKind`
- `cardLastDigits`
- `merchantPattern`
- `status`
- `createdAt`
- `updatedAt`

Initial Dominican bank codes:

- `popular`
- `qik`
- `santa_cruz`
- `banesco`
- `asociacion_popular`
- `lafise`
- `bhd`
- `banreservas`
- `bdi`
- `unknown`

## Parsing And Account Association

The worker should not guess the destination account from the email alone. It should parse stable metadata from the email and then resolve the account through user-owned import rules.

Recommended flow:

1. Provider fetches the email message in memory.
2. Bank-specific parser extracts `bankCode`, `eventType`, `amount`, `currency`, `transactionDate`, `merchant`, `cardLastDigits`, `status`, and `confidence`.
3. The sync service looks for an active `EmailImportRule` matching `userId`, `bankCode`, and optionally `cardLastDigits` or a merchant pattern.
4. High-confidence approved `purchase` events with a matching rule create a completed expense automatically using the shared transaction service and are marked `imported`.
5. `reversal`, `payment`, `deposit`, `withdrawal`, low-confidence, or unmatched events should be stored for user review before creating financial transactions.

For card emails, `cardLastDigits` is the strongest account association signal. Bank name alone is not enough because one user can have multiple cards or accounts from the same bank.

Initial parser coverage:

- `banesco`: card purchase alerts with product name, last four digits, amount, merchant, transaction date, and approval status.
- `qik`: card transaction alerts with masked card, location, amount, and `MM-DD-YYYY` email timestamp.

## Avoid Full Email Storage

Avoid storing complete email bodies unless there is a specific technical need. Prefer message IDs, parsed metadata, and audit-safe excerpts.

## Future Duplicate Prevention

Use provider, source message ID, merchant, amount, currency, transaction date, and card last digits.

## Pending

- User-facing manual sync endpoint.
- Sync run history endpoint.
- More bank email parsing strategies.
- User review import action for low-confidence transactions.
- Broader provider query tuning and pagination beyond the initial bounded fetch.
