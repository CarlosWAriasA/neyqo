import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <main className="min-h-screen bg-canvas text-text">
      <Outlet />
    </main>
  );
}
