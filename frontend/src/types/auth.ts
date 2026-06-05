export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  providers: Array<'email' | 'google' | 'microsoft'>;
  emailVerified: boolean;
  hasPasswordAccess: boolean;
  hasGoogleAccess: boolean;
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
