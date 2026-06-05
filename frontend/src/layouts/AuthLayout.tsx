import { Link, Outlet } from 'react-router-dom';
import { BrandMark } from '../components/navigation/BrandMark';

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-canvas text-text">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <Link to="/" aria-label="Volver a Neyqo">
            <BrandMark />
          </Link>
          <div className="mt-12 max-w-md">
            <p className="text-sm font-semibold text-primary">Tu espacio financiero</p>
            <h1 className="mt-3 text-4xl font-semibold text-text">
              Entra y sigue organizando tu dinero.
            </h1>
            <p className="mt-4 leading-7 text-subtle">
              Revisa tus movimientos, presupuestos y cuentas desde un panel sencillo y cómodo.
            </p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" aria-label="Volver a Neyqo">
              <BrandMark />
            </Link>
          </div>
          <Outlet />
        </section>
      </div>
    </main>
  );
}
