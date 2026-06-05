import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { navigationItems } from '../../config/navigation';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { BrandMark } from './BrandMark';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border bg-surface lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <BrandMark />
        <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Abrir navegación">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {open ? (
        <nav className="grid gap-1 border-t border-border px-3 py-3" aria-label="Navegación móvil">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-panel px-3 py-2.5 text-sm font-medium text-subtle',
                  isActive && 'bg-primary-soft text-primary',
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
