import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginView } from '@/features/auth/views/login-view';
import { CustomersListView } from '@/features/customers/views/customers-list-view';
import { ProductsListView } from '@/features/products/views/products-list-view';
import { AppShell } from '@/shared/components/layout/app-shell';
import { ProtectedRoute } from './protected-route';

/** Catalogo y clientes requieren sesion; las mutaciones de clientes exigen ADMIN en la API. */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginView /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/productos" replace /> },
          { path: '/productos', element: <ProductsListView /> },
          { path: '/clientes', element: <CustomersListView /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/productos" replace /> },
]);
