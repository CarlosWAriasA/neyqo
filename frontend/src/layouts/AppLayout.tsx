import { Outlet } from 'react-router-dom';
import { MobileNavigation } from '../components/navigation/MobileNavigation';
import { Sidebar } from '../components/navigation/Sidebar';
import { SeoMetadata } from '../components/seo/SeoMetadata';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-text lg:h-screen lg:overflow-hidden">
      <SeoMetadata
        title="Mi espacio financiero | Neyqo"
        description="Área privada de Neyqo."
        noIndex
      />
      <MobileNavigation />
      <div className="lg:flex lg:h-full lg:min-h-0">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:h-full lg:overflow-y-auto lg:px-10">
          <div className="mx-auto w-full max-w-7xl lg:h-full lg:min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
