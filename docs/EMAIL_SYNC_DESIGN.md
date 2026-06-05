# Email Sync Design

## Objective

Email sync will reduce manual transaction entry by detecting bank or card consumption messages sent to the user's email.

This feature is not fully implemented yet. The current UI and contracts are placeholders.

## Consent

Email-reading permission must be requested only from `/app/sync` or a clearly sync-specific flow. Authentication with Google or Microsoft must not request mail scopes.

## Gmail

Future Gmail integration should use server-side OAuth 2.0 with a separate redirect URI such as `GOOGLE_GMAIL_REDIRECT_URI`.

Potential future scope: `gmail.readonly`.

Before publishing, Google verification may be required depending on scopes and product status.

## Outlook

Future Outlook integration should use Microsoft Graph delegated permissions and incremental consent with `MICROSOFT_MAIL_REDIRECT_URI`.

## Token Storage

External provider tokens must not be stored in plaintext. Use `EXTERNAL_TOKEN_ENCRYPTION_KEY` or a managed secrets/key service to encrypt access and refresh tokens.

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
- `merchant`
- `amount`
- `currency`
- `transactionDate`
- `cardLastDigits`
- `rawDescription`
- `status`
- `createdAt`

## Avoid Full Email Storage

Avoid storing complete email bodies unless there is a specific technical need. Prefer message IDs, parsed metadata, and audit-safe excerpts.

## Future Duplicate Prevention

Use provider, source message ID, merchant, amount, currency, transaction date, and card last digits.

## Pending

- OAuth start/callback endpoints for Gmail and Outlook.
- Token encryption implementation.
- Manual sync endpoint.
- Sync run history endpoint.
- Bank email parsing rules.
- User review and import workflow.
