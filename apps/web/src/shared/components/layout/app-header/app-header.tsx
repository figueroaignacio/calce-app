import { LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administracion',
  SELLER: 'Ventas',
  WAREHOUSE: 'Deposito',
};

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 md:px-6">
      <span className="text-sm text-muted-foreground md:hidden">Calce</span>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden font-medium sm:inline">{user.name}</span>
            <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
        ) : null}

        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut aria-hidden />
          Salir
        </Button>
      </div>
    </header>
  );
}
