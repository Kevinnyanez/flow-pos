import { useState } from 'react';
import { usePOS, CustomerAccount, Movement } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Users, DollarSign, History, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CuentasCorrientes() {
  const { customerAccounts, addCustomerAccount, updateCustomerAccount, deleteCustomerAccount, addMovementToAccount } =
    usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CustomerAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
  });

  // Estado para ver ficha del cliente
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Estado para agregar movimiento
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'abono' as Movement['type'],
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
        notes: formData.notes,
      });
      toast.success('Cuenta actualizada correctamente');
    } else {
      addCustomerAccount({
        name: formData.name,
        status: 'al-dia',
        debt: 0,
        movements: [],
        notes: formData.notes,
      });
      toast.success('Cuenta creada correctamente');
    }
    handleCloseSheet();
  };

  const handleEdit = (account: CustomerAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      notes: account.notes || '',
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
    setFormData({ name: '', notes: '' });
  };

  const handleViewDetail = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedAccount(null);
  };

  const handleOpenMovement = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setIsMovementOpen(true);
  };

  const handleCloseMovement = () => {
    setIsMovementOpen(false);
    setSelectedAccount(null);
    setMovementData({ type: 'abono', amount: '', description: '' });
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const amount = parseFloat(movementData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (movementData.type === 'abono' && amount > selectedAccount.debt) {
      toast.error('El abono no puede ser mayor a la deuda');
      return;
    }

    addMovementToAccount(selectedAccount.id, {
      date: new Date(),
      amount,
      type: movementData.type,
      description: movementData.description,
    });

    const message = movementData.type === 'venta' ? 'Venta registrada' : 'Abono registrado';
    toast.success(message);
    handleCloseMovement();
  };

  const getStatusBadge = (status: CustomerAccount['status']) => {
    const statusMap = {
      'al-dia': { label: 'Al Día', variant: 'default' as const },
      deuda: { label: 'Con Deuda', variant: 'destructive' as const },
      condicional: { label: 'Condicional', variant: 'secondary' as const },
    };
    const s = statusMap[status];
    return (
      <Badge variant={s.variant} className="text-xs">
        {s.label}
      </Badge>
    );
  };

  // Calcular estadísticas
  const totalAccounts = customerAccounts.length;
  const totalDebt = customerAccounts.reduce((sum, a) => sum + a.debt, 0);
  const accountsWithDebt = customerAccounts.filter((a) => a.debt > 0).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>
          <p className="text-muted-foreground">Gestión de cuentas y movimientos de clientes</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => handleCloseSheet()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</SheetTitle>
              <SheetDescription>
                {editingAccount
                  ? 'Actualiza la información de la cuenta'
                  : 'Completa los datos para crear una nueva cuenta'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Cliente</Label>
                <Input
                  id="name"
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional del cliente"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAccount ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseSheet}>
                  Cancelar
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <p className="text-xs text-muted-foreground">{accountsWithDebt} con deuda</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDebt.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Saldo pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Al Día</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts - accountsWithDebt}</div>
            <p className="text-xs text-muted-foreground">Sin deuda pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla de cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>Haz clic en un cliente para ver su ficha completa</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead className="text-right">Movimientos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell
                    className="font-medium"
                    onClick={() => handleViewDetail(account)}
                  >
                    {account.name}
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(account)}>
                    {getStatusBadge(account.status)}
                  </TableCell>
                  <TableCell
                    className="text-right font-mono"
                    onClick={() => handleViewDetail(account)}
                  >
                    ${account.debt.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className="text-right text-muted-foreground"
                    onClick={() => handleViewDetail(account)}
                  >
                    {account.movements.length}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de detalle de ficha */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ficha del Cliente
            </DialogTitle>
            <DialogDescription>
              Historial completo de movimientos
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-6">
              {/* Panel de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="text-lg font-semibold">{selectedAccount.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedAccount.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deuda Actual</p>
                  <p className="text-2xl font-bold text-destructive">
                    ${selectedAccount.debt.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Notas */}
              {selectedAccount.notes && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notas</p>
                  <p className="text-sm text-muted-foreground">{selectedAccount.notes}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleCloseDetail();
                    setMovementData({ type: 'venta', amount: '', description: '' });
                    handleOpenMovement(selectedAccount);
                  }}
                  className="gap-2"
                  variant="default"
                >
                  <TrendingUp className="h-4 w-4" />
                  Agregar Venta
                </Button>
                <Button
                  onClick={() => {
                    handleCloseDetail();
                    setMovementData({ type: 'abono', amount: '', description: '' });
                    handleOpenMovement(selectedAccount);
                  }}
                  className="gap-2"
                  variant="outline"
                >
                  <TrendingDown className="h-4 w-4" />
                  Registrar Abono
                </Button>
              </div>

              {/* Historial de movimientos */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Historial de Movimientos</h3>
                {selectedAccount.movements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-right">Saldo Resultante</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...selectedAccount.movements]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((movement) => (
                            <TableRow key={movement.id}>
                              <TableCell className="font-mono text-sm">
                                {format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={movement.type === 'venta' ? 'destructive' : 'default'}
                                  className="gap-1"
                                >
                                  {movement.type === 'venta' ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {movement.type === 'venta' ? 'Venta' : 'Abono'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {movement.description || '-'}
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono font-semibold ${
                                  movement.type === 'venta' ? 'text-destructive' : 'text-success'
                                }`}
                              >
                                {movement.type === 'venta' ? '+' : '-'}${movement.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                ${movement.resultingBalance.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar movimiento */}
      <Dialog open={isMovementOpen} onOpenChange={setIsMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementData.type === 'venta' ? 'Registrar Venta' : 'Registrar Abono'}
            </DialogTitle>
            <DialogDescription>
              {movementData.type === 'venta'
                ? 'Agrega una nueva venta a la cuenta del cliente'
                : 'Registra un pago parcial o total de la deuda'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Movimiento</Label>
              <Select
                value={movementData.type}
                onValueChange={(value: Movement['type']) =>
                  setMovementData({ ...movementData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta (Cargo)</SelectItem>
                  <SelectItem value="abono">Abono (Pago)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={movementData.amount}
                onChange={(e) => setMovementData({ ...movementData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Detalle del movimiento"
                value={movementData.description}
                onChange={(e) => setMovementData({ ...movementData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Registrar
              </Button>
              <Button type="button" variant="outline" onClick={handleCloseMovement}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
