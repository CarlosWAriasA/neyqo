import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationItems } from '../../config/navigation';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { BrandMark } from './BrandMark';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-surface lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <BrandMark to="/app/dashboard" />
        <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Abrir navegación">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.nav
            className="absolute inset-x-0 top-full z-50 grid gap-1 border-b border-t border-border bg-surface px-3 py-3 shadow-panel"
            aria-label="Navegación móvil"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
          >
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
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
