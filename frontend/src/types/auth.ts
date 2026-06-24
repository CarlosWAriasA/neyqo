export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  providers: Array<'email' | 'google' | 'microsoft'>;
  emailVerified: boolean;
  hasPasswordAccess: boolean;
  hasGoogleAccess: boolean;
  hasMicrosoftAccess: boolean;
  avatarUrl?: string;
  initialDataNoticeShown: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export interface AuthSessionDevice {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  current: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}
