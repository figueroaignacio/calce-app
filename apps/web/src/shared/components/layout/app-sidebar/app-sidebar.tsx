import { Wrench } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/shared/lib/utils';
import { NAVIGATION_ITEMS } from './navigation-items';

/** Navegacion principal. Lista todas las secciones del sistema, incluidas las
 * que todavia no tienen pantalla. */
export function AppSidebar() {
  const { user } = useAuth();

  const items = NAVIGATION_ITEMS.filter(
    (item) => item.roles.length === 0 || (user && item.roles.includes(user.role)),
  );

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wrench className="size-4" aria-hidden />
        </div>
        <span className="text-base font-semibold tracking-tight">Calce</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;

          if (!item.available) {
            return (
              <span
                key={item.to}
                aria-disabled="true"
                title="Modulo pendiente de implementacion"
                className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm opacity-40"
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </span>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-sidebar-accent font-medium' : 'hover:bg-sidebar-accent/60',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <p className="px-4 py-3 text-xs opacity-50">Version 0.1.0</p>
    </aside>
  );
}
