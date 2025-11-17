import { useState } from 'react';
import { usePOS, CustomerAccount } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function CuentasCorrientes() {
  const { customerAccounts, addCustomerAccount, updateCustomerAccount, deleteCustomerAccount } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CustomerAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'al-dia' as CustomerAccount['status'],
    debt: '0',
  });

  const filteredAccounts = customerAccounts.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateCustomerAccount(editingAccount.id, {
        name: formData.name,
        status: formData.status,
        debt: parseFloat(formData.debt),
      });
      toast.success('Cuenta actualizada correctamente');
    } else {
      addCustomerAccount({
        name: formData.name,
        status: formData.status,
        debt: parseFloat(formData.debt),
        sales: [],
      });
      toast.success('Cuenta creada correctamente');
    }
    handleCloseSheet();
  };

  const handleEdit = (account: CustomerAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      status: account.status,
      debt: account.debt.toString(),
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCustomerAccount(id);
    toast.success('Cuenta eliminada correctamente');
  };

  const handleCloseSheet = () => {
    setIsOpen(false);
    setEditingAccount(null);
    setFormData({ name: '', status: 'al-dia', debt: '0' });
  };

  const getStatusBadge = (status: CustomerAccount['status']) => {
    const variants = {
      'al-dia': { variant: 'default' as const, label: 'Al Día' },
      'deuda': { variant: 'destructive' as const, label: 'Con Deuda' },
      'condicional': { variant: 'secondary' as const, label: 'Condicional' },
    };
    return variants[status];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cuentas Corrientes</h1>
          <p className="text-muted-foreground mt-1">Gestiona las cuentas de tus clientes</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="gap-2 shadow-md hover:shadow-lg transition-all"
              onClick={() => setEditingAccount(null)}
            >
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</SheetTitle>
              <SheetDescription>
                {editingAccount
                  ? 'Modifica los datos de la cuenta'
                  : 'Completa los datos para crear una nueva cuenta'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Cliente</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado de la Cuenta</Label>
                <Select value={formData.status} onValueChange={(value: CustomerAccount['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="al-dia">Al Día</SelectItem>
                    <SelectItem value="deuda">Con Deuda</SelectItem>
                    <SelectItem value="condicional">Condicional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="debt">Deuda Actual</Label>
                <Input
                  id="debt"
                  type="number"
                  step="0.01"
                  value={formData.debt}
                  onChange={(e) => setFormData({ ...formData, debt: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 rounded-xl">
                  {editingAccount ? 'Actualizar' : 'Crear Cuenta'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseSheet}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="p-6 border-border/50 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </Card>

      <Card className="border-border/50 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Deuda</TableHead>
                <TableHead className="font-semibold">Último Pago</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const statusBadge = getStatusBadge(account.status);
                return (
                  <TableRow key={account.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        {account.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={account.debt > 0 ? 'text-destructive font-semibold' : 'text-success'}>
                        ${account.debt.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.lastPaymentDate
                        ? new Date(account.lastPaymentDate).toLocaleDateString()
                        : 'Sin registro'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(account)}
                          className="rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(account.id)}
                          className="rounded-lg text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No se encontraron cuentas</p>
          </div>
        )}
      </Card>
    </div>
  );
}
