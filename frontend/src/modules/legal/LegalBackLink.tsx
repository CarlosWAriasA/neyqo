import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';

type LegalRouteState = {
  returnTo?: unknown;
};

function getLegalReturnPath(state: unknown) {
  const returnTo = (state as LegalRouteState | null)?.returnTo;

  if (typeof returnTo === 'string' && returnTo.startsWith('/app/')) {
    return returnTo;
  }

  return '/';
}

export function LegalBackLink() {
  const location = useLocation();
  const returnPath = getLegalReturnPath(location.state);

  return (
    <Link to={returnPath}>
      <Button variant="secondary">Volver</Button>
    </Link>
  );
}
