import { NavLink } from '@/components/NavLink';
import { usePOS } from '@/contexts/POSContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  RefreshCw,
  DollarSign,
  FileText,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const allMenuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, roles: ['admin', 'user1', 'user2', 'user3'] },
  { title: 'Ventas', url: '/ventas', icon: ShoppingCart, roles: ['admin', 'user1', 'user2', 'user3'] },
  { title: 'Stock', url: '/stock', icon: Package, roles: ['admin', 'user1', 'user2', 'user3'] },
  { title: 'Cuentas Corrientes', url: '/cuentas', icon: Users, roles: ['admin', 'user1', 'user2', 'user3'] },
  { title: 'Devoluciones', url: '/devoluciones', icon: RefreshCw, roles: ['admin', 'user1', 'user2', 'user3'] },
  { title: 'Caja / Arqueo', url: '/caja', icon: DollarSign, roles: ['admin'] },
  { title: 'Registro de Ventas', url: '/registro-ventas', icon: FileText, roles: ['admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { currentUser } = usePOS();

  const menuItems = allMenuItems.filter((item) =>
    currentUser ? item.roles.includes(currentUser.role) : false
  );

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-16' : 'w-64'} border-r border-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      <div className="flex h-16 items-center px-6 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Sistema de gestión</span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
