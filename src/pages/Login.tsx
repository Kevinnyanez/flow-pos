import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = authSchema.safeParse(form);

    if (!result.success) {
      const firstError = Object.values(result.error.flatten().fieldErrors)[0]?.[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success('Bienvenido al sistema');
        navigate('/');
      } else {
        const redirectTo = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success('Registro exitoso. Ahora puedes iniciar sesión.');
        setMode('login');
      }
    } finally {
      setLoading(false);
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
            {mode === 'login'
              ? 'Ingresa con tu email y contraseña para acceder al sistema'
              : 'Crea una cuenta para comenzar a usar el sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <Button
              type="button"
              variant={mode === 'login' ? 'default' : 'ghost'}
              className="w-full rounded-lg"
              onClick={() => setMode('login')}
            >
              Ingresar
            </Button>
            <Button
              type="button"
              variant={mode === 'signup' ? 'default' : 'ghost'}
              className="w-full rounded-lg"
              onClick={() => setMode('signup')}
            >
              Registrarse
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
              disabled={loading}
            >
              {mode === 'login' ? 'Ingresar al Sistema' : 'Crear Cuenta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
