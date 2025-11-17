import { useState } from 'react';
import { usePOS, CustomerAccount, Payment } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Search, Edit, Trash2, Users, DollarSign, History, CheckCircle } from 'lucide-react';
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
  const { customerAccounts, addCustomerAccount, updateCustomerAccount, deleteCustomerAccount, addPaymentToAccount } =
    usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CustomerAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'al-dia' as CustomerAccount['status'],
    debt: '0',
  });

  // Estado para modal de pagos
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [paymentData, setPaymentData] = useState({
    type: 'abono' as Payment['type'],
    amount: '',
    description: '',
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
        payments: [],
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

  const handleOpenPayment = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setIsPaymentOpen(true);
  };

  const handleClosePayment = () => {
    setIsPaymentOpen(false);
    setSelectedAccount(null);
    setPaymentData({ type: 'abono', amount: '', description: '' });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (paymentData.type === 'abono' && amount > selectedAccount.debt) {
      toast.error('El abono no puede ser mayor a la deuda');
      return;
    }

    addPaymentToAccount(selectedAccount.id, {
      date: new Date(),
      amount,
      type: paymentData.type,
      description: paymentData.description || undefined,
    });

    const typeLabels = {
      deuda: 'Deuda registrada',
      abono: 'Abono registrado',
      saldo: 'Deuda saldada',
    };

    toast.success(typeLabels[paymentData.type]);
    handleClosePayment();
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
                          onClick={() => handleOpenPayment(account)}
                          className="rounded-lg"
                          title="Gestionar pagos"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
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

      {/* Modal de Pagos */}
      <Sheet open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gestionar Cuenta - {selectedAccount?.name}</SheetTitle>
            <SheetDescription>
              Deuda actual: ${selectedAccount?.debt.toFixed(2)}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Formulario de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registrar Movimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Tipo de Movimiento</Label>
                    <Select
                      value={paymentData.type}
                      onValueChange={(value: Payment['type']) =>
                        setPaymentData({ ...paymentData, type: value })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deuda">Nueva Deuda</SelectItem>
                        <SelectItem value="abono">Abono</SelectItem>
                        <SelectItem value="saldo">Saldar Completamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentData.type !== 'saldo' && (
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        required
                        className="rounded-xl"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      value={paymentData.description}
                      onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                      className="rounded-xl"
                      placeholder="Notas sobre este movimiento..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 rounded-xl">
                      Registrar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClosePayment}
                      className="flex-1 rounded-xl"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Historial de pagos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAccount?.payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay movimientos registrados
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedAccount?.payments
                      .slice()
                      .reverse()
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-start gap-3 rounded-lg border border-border p-3"
                        >
                          <div
                            className={`rounded-lg p-2 ${
                              payment.type === 'deuda'
                                ? 'bg-destructive/10'
                                : payment.type === 'abono'
                                ? 'bg-primary/10'
                                : 'bg-success/10'
                            }`}
                          >
                            {payment.type === 'deuda' ? (
                              <DollarSign className="h-4 w-4 text-destructive" />
                            ) : payment.type === 'abono' ? (
                              <DollarSign className="h-4 w-4 text-primary" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">
                                {payment.type === 'deuda'
                                  ? 'Nueva Deuda'
                                  : payment.type === 'abono'
                                  ? 'Abono'
                                  : 'Saldo Completo'}
                              </p>
                              <span
                                className={`font-semibold ${
                                  payment.type === 'deuda'
                                    ? 'text-destructive'
                                    : 'text-success'
                                }`}
                              >
                                {payment.type === 'deuda' ? '+' : '-'}${payment.amount.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(payment.date).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {payment.description && (
                              <p className="text-sm text-muted-foreground mt-1">{payment.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
