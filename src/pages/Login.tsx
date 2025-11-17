import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS, User, UserRole } from '@/contexts/POSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';

const users: User[] = [
  { id: '1', name: 'Administrador', role: 'admin' },
  { id: '2', name: 'Usuario 1', role: 'user1' },
  { id: '3', name: 'Usuario 2', role: 'user2' },
  { id: '4', name: 'Usuario 3', role: 'user3' },
];

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { setCurrentUser } = usePOS();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (selectedUser) {
      setCurrentUser(selectedUser);
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <ShoppingCart className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">ModernPOS</CardTitle>
          <CardDescription className="text-base">
            Selecciona un usuario para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`group relative flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all hover:border-primary hover:shadow-md ${
                  selectedUser?.id === user.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card'
                }`}
              >
                <div>
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user.role === 'admin' ? 'Administrador' : user.role}
                  </p>
                </div>
                {selectedUser?.id === user.id && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            Ingresar al Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
