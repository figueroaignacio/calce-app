import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginView } from '@/features/auth/views/login-view';
import { ProductsListView } from '@/features/products/views/products-list-view';
import { AppShell } from '@/shared/components/layout/app-shell';
import { ProtectedRoute } from './protected-route';

/**
 * Mapa de rutas.
 *
 * Todo lo que cuelga de `ProtectedRoute` exige sesion; el prop `roles` agrega
 * la restriccion por rol donde hace falta. Las secciones todavia sin pantalla
 * aparecen en la barra lateral deshabilitadas, no como rutas rotas.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginView />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/productos" replace /> },
          { path: '/productos', element: <ProductsListView /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/productos" replace />,
  },
]);
