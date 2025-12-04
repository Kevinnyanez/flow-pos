import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, ShieldOff } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  is_admin: boolean;
}

export default function GestionUsuarios() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_users_with_roles');

    if (error) {
      toast.error('Error al cargar usuarios: ' + error.message);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const toggleAdminRole = async (userId: string, currentIsAdmin: boolean) => {
    if (currentIsAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        toast.error('Error al quitar rol de admin: ' + error.message);
        return;
      }

      toast.success('Rol de admin eliminado correctamente');
    } else {
      // Add admin role
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });

      if (error) {
        toast.error('Error al asignar rol de admin: ' + error.message);
        return;
      }

      toast.success('Rol de admin asignado correctamente');
    }

    await loadUsers();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Gestión de Usuarios</CardTitle>
          <CardDescription>
            Administra los roles de los usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay usuarios registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="text-center">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          <Shield className="h-3 w-3" />
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          Usuario
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.is_admin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, true)}
                        >
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Quitar Admin
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, false)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Hacer Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
