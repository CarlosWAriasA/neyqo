import { Navigate } from 'react-router-dom';
import type { AuthModalMode } from '../components/forms/AuthModal';

export function AuthEntryRedirect({ mode }: { mode: AuthModalMode }) {
  return <Navigate to={`/?auth=${mode}`} replace />;
}
