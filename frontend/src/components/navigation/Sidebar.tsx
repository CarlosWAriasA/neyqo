import { NavLink } from 'react-router-dom';
import { navigationItems } from '../../config/navigation';
import { cn } from '../../utils/cn';
import { BrandMark } from './BrandMark';

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-border bg-surface px-4 py-5 lg:block">
      <BrandMark to="/app/dashboard" />
      <nav className="mt-8 grid gap-1" aria-label="Navegación principal">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-panel px-3 py-2.5 text-sm font-medium text-subtle transition hover:bg-muted hover:text-text',
                isActive && 'bg-primary-soft text-primary',
              )
            }
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
