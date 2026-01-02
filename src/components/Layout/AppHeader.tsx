import { usePOS } from '@/contexts/POSContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const { currentUser } = usePOS();
  const navigate = useNavigate();

  const { setCurrentUser } = usePOS();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Ensure immediate UI logout
      setCurrentUser(null);
      if (error) {
        console.error('Logout error:', error);
      }
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setCurrentUser(null);
      navigate('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card px-6 shadow-sm">
      <SidebarTrigger className="text-foreground" />

      <div className="flex-1" />

      {currentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
             <DropdownMenuLabel className="font-normal">
               <div className="flex flex-col space-y-1">
                 <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                 <p className="text-xs leading-none text-muted-foreground capitalize">
                   {currentUser.role === 'admin' ? 'Administrador' : 'Usuario'}
                 </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
