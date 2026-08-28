import type { UserRole } from '@calce/types';
import {
  BarChart3,
  Boxes,
  Car,
  ClipboardList,
  Package,
  Users,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Roles que ven la seccion. Vacio significa "todos los autenticados". */
  roles: UserRole[];
  /** Las secciones sin pantalla se muestran deshabilitadas, no ocultas: el
   * mapa del sistema tiene que estar completo desde el primer dia. */
  available: boolean;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Catalogo', to: '/productos', icon: Package, roles: [], available: true },
  { label: 'Pedidos', to: '/pedidos', icon: ClipboardList, roles: [], available: false },
  { label: 'Clientes', to: '/clientes', icon: Users, roles: [], available: false },
  { label: 'Stock', to: '/stock', icon: Boxes, roles: [], available: false },
  { label: 'Vehiculos', to: '/vehiculos', icon: Car, roles: [], available: false },
  {
    label: 'Reportes',
    to: '/reportes',
    icon: BarChart3,
    roles: ['ADMIN'],
    available: false,
  },
  { label: 'Usuarios', to: '/usuarios', icon: UserCog, roles: ['ADMIN'], available: false },
];
