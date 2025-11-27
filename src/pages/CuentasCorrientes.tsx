import { useState } from 'react';
import { usePOS, Product } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Plus,
  UserPlus,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Minus,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CuentasCorrientes() {
  const { 
    customerAccounts, 
    addCustomerAccount, 
    addDebtToAccount, 
    updateDebt,
    deleteDebt,
    addPaymentToDebt,
    deletePayment,
    products
  } = usePOS();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debtsPerPage = 5;
  
  // Dialog states
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false);
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<string | null>(null);
  const [selectedDebtForEdit, setSelectedDebtForEdit] = useState<string | null>(null);
  
  // Alert dialog states
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ debtId: string; paymentId: string } | null>(null);

  // Form states
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNotes, setNewAccountNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [newDebtDescription, setNewDebtDescription] = useState('');
  const [editDebtAmount, setEditDebtAmount] = useState('');
  const [editDebtDescription, setEditDebtDescription] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDescription, setNewPaymentDescription] = useState('');

  const filteredAccounts = customerAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAccountData = customerAccounts.find((a) => a.id === selectedAccount);

  // Pagination logic
  const indexOfLastDebt = currentPage * debtsPerPage;
  const indexOfFirstDebt = indexOfLastDebt - debtsPerPage;
  const currentDebts = selectedAccountData?.debts.slice(indexOfFirstDebt, indexOfLastDebt) || [];
  const totalPages = Math.ceil((selectedAccountData?.debts.length || 0) / debtsPerPage);

  const handleAddAccount = () => {
    if (newAccountName.trim()) {
      addCustomerAccount({
        name: newAccountName,
        status: 'al-dia',
        totalDebt: 0,
        totalPaid: 0,
        totalRemaining: 0,
        debts: [],
        notes: newAccountNotes,
      });
      setNewAccountName('');
      setNewAccountNotes('');
      setIsNewAccountOpen(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      }
    } else {
      if (product.stock > 0) {
        setCart([...cart, { product, quantity: 1 }]);
      }
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.product.stock) return item;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleAddDebt = () => {
    if (selectedAccount && cart.length > 0 && newDebtDescription.trim()) {
      addDebtToAccount(selectedAccount, {
        date: new Date(),
        items: cart,
        description: newDebtDescription,
      });
      setCart([]);
      setNewDebtDescription('');
      setIsNewDebtOpen(false);
    }
  };

  const handleEditDebt = () => {
    if (selectedAccount && selectedDebtForEdit && editDebtAmount && editDebtDescription.trim()) {
      updateDebt(selectedAccount, selectedDebtForEdit, {
        amount: parseFloat(editDebtAmount),
        description: editDebtDescription,
      });
      setEditDebtAmount('');
      setEditDebtDescription('');
      setSelectedDebtForEdit(null);
      setIsEditDebtOpen(false);
    }
  };

  const handleDeleteDebt = () => {
    if (selectedAccount && debtToDelete) {
      deleteDebt(selectedAccount, debtToDelete);
      setDebtToDelete(null);
      // Reset to first page if current page becomes empty
      if (currentDebts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const handleAddPayment = () => {
    if (selectedAccount && selectedDebtForPayment && newPaymentAmount) {
      addPaymentToDebt(selectedAccount, selectedDebtForPayment, {
        date: new Date(),
        amount: parseFloat(newPaymentAmount),
        description: newPaymentDescription,
      });
      setNewPaymentAmount('');
      setNewPaymentDescription('');
      setSelectedDebtForPayment(null);
      setIsNewPaymentOpen(false);
    }
  };

  const handleDeletePayment = () => {
    if (selectedAccount && paymentToDelete) {
      deletePayment(selectedAccount, paymentToDelete.debtId, paymentToDelete.paymentId);
      setPaymentToDelete(null);
    }
  };

  const openEditDebtDialog = (debtId: string) => {
    const debt = selectedAccountData?.debts.find(d => d.id === debtId);
    if (debt) {
      setSelectedDebtForEdit(debtId);
      setEditDebtAmount(debt.amount.toString());
      setEditDebtDescription(debt.description);
      setIsEditDebtOpen(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'al-dia':
        return <Badge variant="default" className="bg-success"><CheckCircle2 className="w-3 h-3 mr-1" />Al Día</Badge>;
      case 'deuda':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Con Deuda</Badge>;
      case 'condicional':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Condicional</Badge>;
      default:
        return null;
    }
  };

  const getDebtStatusBadge = (status: string) => {
    switch (status) {
      case 'pagado':
        return <Badge variant="default" className="bg-success text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Pagado</Badge>;
      case 'pendiente':
        return <Badge variant="destructive" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'parcial':
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Parcial</Badge>;
      default:
        return null;
    }
  };

  if (selectedAccountData) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedAccount(null);
                setCurrentPage(1);
              }}
              className="mb-2"
            >
              ← Volver a la lista
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Ficha de Cliente</h1>
              {getStatusBadge(selectedAccountData.status)}
            </div>
            <p className="text-muted-foreground">{selectedAccountData.name}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isNewDebtOpen} onOpenChange={setIsNewDebtOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Venta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Venta (Deuda)</DialogTitle>
                  <DialogDescription>
                    Selecciona los productos que el cliente se llevó fiado
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Productos Disponibles</Label>
                      <div className="mt-3 space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                        {products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className="w-full flex items-center justify-between rounded-lg border-2 border-border p-3 text-left transition-all hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.code}</p>
                              <p className="text-sm font-bold text-primary mt-1">${product.price}</p>
                            </div>
                            <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                              {product.stock}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-accent/50">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Carrito
                      </Label>
                      {cart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Selecciona productos para agregar
                        </p>
                      ) : (
                        <div className="space-y-2 mt-3">
                          {cart.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex items-center gap-2 rounded-lg border p-2 bg-background"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">${item.product.price}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="h-6 w-6 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="pt-3 border-t">
                            <div className="flex justify-between items-center text-lg font-bold">
                              <span>Total:</span>
                              <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        placeholder="Ej: Compra en tienda - cliente habitual"
                        value={newDebtDescription}
                        onChange={(e) => setNewDebtDescription(e.target.value)}
                      />
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsNewDebtOpen(false);
                        setCart([]);
                        setNewDebtDescription('');
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddDebt} disabled={cart.length === 0}>
                        <Package className="w-4 h-4 mr-2" />
                        Registrar Venta
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Deuda Total</CardDescription>
              <CardTitle className="text-2xl">${selectedAccountData.totalDebt.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Total Pagado</CardDescription>
              <CardTitle className="text-2xl text-success">${selectedAccountData.totalPaid.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Saldo Pendiente</CardDescription>
              <CardTitle className="text-2xl text-destructive">${selectedAccountData.totalRemaining.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Total de Ventas</CardDescription>
              <CardTitle className="text-2xl">{selectedAccountData.debts.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {selectedAccountData.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{selectedAccountData.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historial de Ventas y Pagos</CardTitle>
                <CardDescription>
                  Cada venta y sus pagos asociados - Página {currentPage} de {totalPages || 1}
                </CardDescription>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedAccountData.debts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay ventas registradas para este cliente
                </p>
              ) : currentDebts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay ventas en esta página
                </p>
              ) : (
                currentDebts.map((debt) => (
                  <div key={debt.id} className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{debt.description}</h4>
                          {getDebtStatusBadge(debt.status)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(debt.date), 'dd/MM/yyyy')}
                        </p>
                        {debt.items && debt.items.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Productos:
                            </p>
                            {debt.items.map((item, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground ml-4">
                                • {item.product.name} x{item.quantity} - ${(item.product.price * item.quantity).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-lg font-bold">${debt.amount.toFixed(2)}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDebtDialog(debt.id)}
                            className="h-8 px-2"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDebtToDelete(debt.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {debt.status !== 'pagado' && (
                            <Dialog open={isNewPaymentOpen && selectedDebtForPayment === debt.id} onOpenChange={(open) => {
                              setIsNewPaymentOpen(open);
                              if (!open) setSelectedDebtForPayment(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => setSelectedDebtForPayment(debt.id)}
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Abonar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Registrar Pago</DialogTitle>
                                  <DialogDescription>
                                    Registra un pago parcial o total para esta venta
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-sm font-medium">Deuda: {debt.description}</p>
                                    <p className="text-sm text-muted-foreground">Monto original: ${debt.amount.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">Pagado: ${debt.paidAmount.toFixed(2)}</p>
                                    <p className="text-sm font-semibold text-destructive">Pendiente: ${debt.remainingAmount.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label htmlFor="payment-amount">Monto del Pago</Label>
                                    <Input
                                      id="payment-amount"
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      max={debt.remainingAmount}
                                      value={newPaymentAmount}
                                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="payment-description">Descripción (opcional)</Label>
                                    <Input
                                      id="payment-description"
                                      placeholder="Ej: Primera entrega"
                                      value={newPaymentDescription}
                                      onChange={(e) => setNewPaymentDescription(e.target.value)}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                      setIsNewPaymentOpen(false);
                                      setSelectedDebtForPayment(null);
                                    }}>
                                      Cancelar
                                    </Button>
                                    <Button onClick={handleAddPayment}>
                                      Registrar Pago
                                    </Button>
                                  </DialogFooter>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Pagado</p>
                        <p className="font-semibold text-success">${debt.paidAmount.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Pendiente</p>
                        <p className="font-semibold text-destructive">${debt.remainingAmount.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Progreso</p>
                        <p className="font-semibold">{debt.amount > 0 ? ((debt.paidAmount / debt.amount) * 100).toFixed(0) : 0}%</p>
                      </div>
                    </div>

                    {debt.payments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Pagos realizados
                          </h5>
                          <div className="space-y-1">
                            {debt.payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded group"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <DollarSign className="w-3 h-3 text-success" />
                                  <span className="text-muted-foreground">
                                    {format(new Date(payment.date), 'dd/MM/yyyy')}
                                  </span>
                                  {payment.description && (
                                    <span className="text-xs">- {payment.description}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-success">
                                    ${payment.amount.toFixed(2)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPaymentToDelete({ debtId: debt.id, paymentId: payment.id })}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Debt Dialog */}
        <Dialog open={isEditDebtOpen} onOpenChange={setIsEditDebtOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Venta</DialogTitle>
              <DialogDescription>
                Modifica los detalles de esta venta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-amount">Monto Total</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editDebtAmount}
                  onChange={(e) => setEditDebtAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Ej: Campera de cuero negra talle M"
                  value={editDebtDescription}
                  onChange={(e) => setEditDebtDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDebtOpen(false);
                  setSelectedDebtForEdit(null);
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleEditDebt}>
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Debt Alert Dialog */}
        <AlertDialog open={!!debtToDelete} onOpenChange={(open) => !open && setDebtToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta venta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la venta y todos sus pagos asociados. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDebt} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Payment Alert Dialog */}
        <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el pago seleccionado y recalculará el saldo de la deuda. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>
          <p className="text-muted-foreground">Gestión de clientes y sus deudas</p>
        </div>
        <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Crea una nueva cuenta corriente para un cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Cliente</Label>
                <Input
                  id="name"
                  placeholder="Nombre completo"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional sobre el cliente"
                  value={newAccountNotes}
                  onChange={(e) => setNewAccountNotes(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAccount}>
                  Crear Cliente
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Deuda Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell className="text-right">${account.totalDebt.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-success">${account.totalPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      ${account.totalRemaining.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{account.debts.length}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAccount(account.id)}
                      >
                        Ver Ficha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
