import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/shared/components/layout/app-header';
import { AppSidebar } from '@/shared/components/layout/app-sidebar';

/** Marco de la aplicacion autenticada: barra lateral, encabezado y contenido. */
export function AppShell() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
