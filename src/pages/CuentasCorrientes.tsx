import { useEffect, useState } from 'react';
import { usePOS, Product, PaymentMethod, DebtStatus } from '@/contexts/POSContext';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Download,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { exportCustomersToExcel, importCustomersFromExcel } from '@/lib/excel-utils';

interface CartItem {
  product: Product;
  quantity: number;
}

type ManualAdjustmentType = 'ninguno' | 'descuento' | 'recargo';

export default function CuentasCorrientes() {
  const { 
    customerAccounts, 
    addCustomerAccount, 
    addDebtToAccount, 
    updateDebt,
    updateDebtStatus,
    deleteDebt,
    addPaymentToDebt,
    deletePayment,
    products
  } = usePOS();
  
  const handleExportExcel = () => {
    try {
      exportCustomersToExcel(customerAccounts);
      toast.success('Clientes exportados a Excel correctamente');
    } catch (error) {
      toast.error('Error al exportar los clientes');
      console.error(error);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedCustomers = await importCustomersFromExcel(file);
      
      if (importedCustomers.length === 0) {
        toast.error('No se encontraron clientes válidos en el archivo');
        return;
      }

      // Agregar cada cliente importado
      let added = 0;
      
      for (const customer of importedCustomers) {
        addCustomerAccount({
          ...customer,
          debts: [],
        });
        added++;
      }

      toast.success(`Importación completada: ${added} clientes agregados`);
      
      // Limpiar el input
      event.target.value = '';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al importar el archivo Excel');
      console.error(error);
      event.target.value = '';
    }
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsPage, setAccountsPage] = useState(1);
  const debtsPerPage = 5;
  const accountsPerPage = 15;
  
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
  const [productSearch, setProductSearch] = useState('');
  const [newDebtDescription, setNewDebtDescription] = useState('');
  const [editDebtAmount, setEditDebtAmount] = useState('');
  const [editDebtDescription, setEditDebtDescription] = useState('');
  const [editDebtAdjustmentType, setEditDebtAdjustmentType] = useState<ManualAdjustmentType>('ninguno');
  const [editDebtAdjustmentValue, setEditDebtAdjustmentValue] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentAdjustmentType, setNewPaymentAdjustmentType] = useState<ManualAdjustmentType>('ninguno');
  const [newPaymentAdjustmentValue, setNewPaymentAdjustmentValue] = useState('');
  const [newPaymentDescription, setNewPaymentDescription] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [newDebtStatus, setNewDebtStatus] = useState<DebtStatus>('pendiente');

  const filteredAccounts = customerAccounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalAccountsPages = Math.max(1, Math.ceil(filteredAccounts.length / accountsPerPage));
  const paginatedAccounts = filteredAccounts.slice(
    (accountsPage - 1) * accountsPerPage,
    accountsPage * accountsPerPage
  );

  const selectedAccountData = customerAccounts.find((a) => a.id === selectedAccount);

  // Pagination logic
  const indexOfLastDebt = currentPage * debtsPerPage;
  const indexOfFirstDebt = indexOfLastDebt - debtsPerPage;
  const currentDebts = selectedAccountData?.debts.slice(indexOfFirstDebt, indexOfLastDebt) || [];
  const totalPages = Math.ceil((selectedAccountData?.debts.length || 0) / debtsPerPage);

  useEffect(() => {
    if (accountsPage > totalAccountsPages) {
      setAccountsPage(totalAccountsPages);
    }
  }, [accountsPage, totalAccountsPages]);

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

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getSignedAdjustment = (type: ManualAdjustmentType, percent: number, baseAmount: number) => {
    const normalizedPercent = Math.max(0, percent);
    const adjustmentAmount = (baseAmount * normalizedPercent) / 100;
    if (type === 'descuento') return -Math.abs(adjustmentAmount);
    if (type === 'recargo') return Math.abs(adjustmentAmount);
    return 0;
  };

  const stripManualAdjustmentTag = (description: string) =>
    description.replace(/\s\[(Descuento|Recargo):\s[^[]+\]$/i, '').trim();

  const appendManualAdjustmentTag = (
    description: string,
    type: ManualAdjustmentType,
    value: number
  ) => {
    const cleanDescription = stripManualAdjustmentTag(description);
    if (type === 'ninguno' || value <= 0) return cleanDescription;

    const label = type === 'descuento' ? 'Descuento' : 'Recargo';
    return `${cleanDescription} [${label}: ${value.toFixed(2)}%]`;
  };

  const newDebtSubtotal = calculateSubtotal();

  const handleAddDebt = () => {
    if (selectedAccount && cart.length > 0 && newDebtDescription.trim()) {
      addDebtToAccount(selectedAccount, {
        date: new Date(),
        items: cart,
        description: newDebtDescription.trim(),
        status: newDebtStatus,
      });
      setCart([]);
      setProductSearch('');
      setNewDebtDescription('');
      setNewDebtStatus('pendiente');
      setIsNewDebtOpen(false);
    }
  };

  const handleEditDebt = async () => {
    if (selectedAccount && selectedDebtForEdit && editDebtAmount && editDebtDescription.trim()) {
      const parsedEditAdjustmentValue = Math.max(0, parseFloat(editDebtAdjustmentValue) || 0);
      const finalDescription = appendManualAdjustmentTag(
        editDebtDescription,
        editDebtAdjustmentType,
        parsedEditAdjustmentValue
      );

      await updateDebt(selectedAccount, selectedDebtForEdit, {
        amount: Math.max(0, parseFloat(editDebtAmount)),
        description: finalDescription,
      });
      setEditDebtAmount('');
      setEditDebtDescription('');
      setEditDebtAdjustmentType('ninguno');
      setEditDebtAdjustmentValue('');
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

  const handleAddPayment = async () => {
    if (selectedAccount && selectedDebtForPayment && newPaymentAmount) {
      const debt = selectedAccountData?.debts.find((d) => d.id === selectedDebtForPayment);
      if (!debt) return;

      const parsedAdjustmentPercent = Math.max(0, parseFloat(newPaymentAdjustmentValue) || 0);
      const signedAdjustment = getSignedAdjustment(
        newPaymentAdjustmentType,
        parsedAdjustmentPercent,
        debt.remainingAmount
      );
      const adjustedRemainingAmount = Math.max(0, debt.remainingAmount + signedAdjustment);
      const updatedDebtAmount = debt.paidAmount + adjustedRemainingAmount;
      const adjustmentApplied =
        newPaymentAdjustmentType !== 'ninguno' &&
        parsedAdjustmentPercent > 0 &&
        Math.abs(signedAdjustment) > 0.001;
      const updatedDebtDescription = adjustmentApplied
        ? appendManualAdjustmentTag(debt.description, newPaymentAdjustmentType, parsedAdjustmentPercent)
        : debt.description;

      if (Math.abs(updatedDebtAmount - debt.amount) > 0.001) {
        await updateDebt(selectedAccount, selectedDebtForPayment, {
          amount: updatedDebtAmount,
          description: updatedDebtDescription,
        });
      }

      const updatedRemainingAmount = Math.max(0, updatedDebtAmount - debt.paidAmount);
      const parsedPaymentAmount = Math.max(0, parseFloat(newPaymentAmount));

      if (parsedPaymentAmount > updatedRemainingAmount) {
        toast.error(`El pago supera el saldo pendiente (${formatCurrency(updatedRemainingAmount)})`);
        return;
      }

      const autoAdjustmentNote = adjustmentApplied
        ? `${newPaymentAdjustmentType === 'descuento' ? 'Pago con descuento' : 'Pago con recargo'} ${parsedAdjustmentPercent.toFixed(2)}% (${signedAdjustment >= 0 ? '+' : '-'}${formatCurrency(Math.abs(signedAdjustment))}). Deuda ajustada: ${formatCurrency(debt.amount)} -> ${formatCurrency(updatedDebtAmount)}.`
        : '';
      const userNote = newPaymentDescription.trim();
      const finalPaymentDescription = [autoAdjustmentNote, userNote].filter(Boolean).join(' ');

      addPaymentToDebt(selectedAccount, selectedDebtForPayment, {
        date: new Date(),
        amount: parsedPaymentAmount,
        description: finalPaymentDescription || undefined,
      }, newPaymentMethod);
      setNewPaymentAmount('');
      setNewPaymentAdjustmentType('ninguno');
      setNewPaymentAdjustmentValue('');
      setNewPaymentDescription('');
      setNewPaymentMethod('efectivo');
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
      setEditDebtDescription(stripManualAdjustmentTag(debt.description));
      const baseAmount = debt.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const diff = debt.amount - baseAmount;
      if (Math.abs(diff) < 0.01) {
        setEditDebtAdjustmentType('ninguno');
        setEditDebtAdjustmentValue('');
      } else if (diff < 0) {
        setEditDebtAdjustmentType('descuento');
        setEditDebtAdjustmentValue(baseAmount > 0 ? ((Math.abs(diff) / baseAmount) * 100).toFixed(2) : '0');
      } else {
        setEditDebtAdjustmentType('recargo');
        setEditDebtAdjustmentValue(baseAmount > 0 ? ((Math.abs(diff) / baseAmount) * 100).toFixed(2) : '0');
      }
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

  const getDebtStatusBadge = (status: DebtStatus) => {
    switch (status) {
      case 'pagado':
        return <Badge variant="default" className="bg-success text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Pagado</Badge>;
      case 'pendiente':
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'deuda':
        return <Badge variant="destructive" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Deuda</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="text-xs text-muted-foreground"><Trash2 className="w-3 h-3 mr-1" />Cancelado</Badge>;
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

                      <div className="mt-3">
                        <Input
                          placeholder="Buscar producto por nombre, código, color o material..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="rounded-xl mb-3"
                        />
                      </div>

                      <div className="mt-3 space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                        {products.filter((product) => {
                          const q = productSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            product.name.toLowerCase().includes(q) ||
                            product.code?.toLowerCase().includes(q) ||
                            product.color?.toLowerCase().includes(q) ||
                            product.material?.toLowerCase().includes(q) ||
                            (product.description || '').toLowerCase().includes(q) ||
                            (product.brand || '').toLowerCase().includes(q)
                          );
                        }).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className="w-full flex items-center justify-between rounded-lg border-2 border-border p-3 text-left transition-all hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.code}</p>
                              <p className="text-sm font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
                            </div>
                            <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                              {product.stock}
                            </Badge>
                          </button>
                        ))}

                        {products.filter((product) => {
                          const q = productSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            product.name.toLowerCase().includes(q) ||
                            product.code?.toLowerCase().includes(q) ||
                            product.color?.toLowerCase().includes(q) ||
                            product.material?.toLowerCase().includes(q) ||
                            (product.description || '').toLowerCase().includes(q) ||
                            (product.brand || '').toLowerCase().includes(q)
                          );
                        }).length === 0 && (
                          <p className="text-center text-muted-foreground py-6">No se encontraron productos</p>
                        )}
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
                              <span className="text-primary">{formatCurrency(newDebtSubtotal)}</span>
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

                    <div>
                      <Label htmlFor="debt-status">Estado de la prenda</Label>
                      <Select value={newDebtStatus} onValueChange={(value) => setNewDebtStatus(value as DebtStatus)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente (el cliente lo prueba)</SelectItem>
                          <SelectItem value="deuda">Deuda (el cliente se lo lleva fiado)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {newDebtStatus === 'pendiente' 
                          ? 'El cliente se lleva la prenda pero aún no confirma. Si cancela, el stock se recupera.'
                          : 'El cliente confirmó la compra a crédito. El stock se descuenta.'
                        }
                      </p>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsNewDebtOpen(false);
                        setCart([]);
                        setProductSearch('');
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
              <CardTitle className="text-2xl">{formatCurrency(selectedAccountData.totalDebt)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Total Pagado</CardDescription>
              <CardTitle className="text-2xl text-success">{formatCurrency(selectedAccountData.totalPaid)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription>Saldo Pendiente</CardDescription>
              <CardTitle className="text-2xl text-destructive">{formatCurrency(selectedAccountData.totalRemaining)}</CardTitle>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{debt.description}</h4>
                          {getDebtStatusBadge(debt.status)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(debt.date), 'dd/MM/yyyy')}
                        </p>
                        {/* Status change buttons */}
                        {debt.status !== 'cancelado' && debt.status !== 'pagado' && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {debt.status === 'pendiente' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => selectedAccount && updateDebtStatus(selectedAccount, debt.id, 'deuda')}
                                  className="h-7 text-xs"
                                >
                                  Confirmar Deuda
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => selectedAccount && updateDebtStatus(selectedAccount, debt.id, 'cancelado')}
                                  className="h-7 text-xs text-muted-foreground"
                                >
                                  Cancelar (Devolver)
                                </Button>
                              </>
                            )}

                          </div>
                        )}
                        {debt.items && debt.items.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Productos:
                            </p>
                            {debt.items.map((item, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground ml-4">
                                • {item.product.name} x{item.quantity} - {formatCurrency(item.product.price * item.quantity)}
                              </p>
                            ))}
                            {(() => {
                              const baseAmount = debt.items.reduce(
                                (sum, item) => sum + item.product.price * item.quantity,
                                0
                              );
                              const diff = debt.amount - baseAmount;
                              if (Math.abs(diff) < 0.01) return null;
                              return (
                                <p className="text-xs ml-4 font-medium text-muted-foreground">
                                  • Ajuste manual: {diff > 0 ? '+' : '-'} {formatCurrency(Math.abs(diff))}
                                </p>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-lg font-bold">{formatCurrency(debt.amount)}</p>
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
                                  onClick={() => {
                                    setSelectedDebtForPayment(debt.id);
                                    const baseAmount = debt.items.reduce(
                                      (sum, item) => sum + item.product.price * item.quantity,
                                      0
                                    );
                                    const diff = debt.amount - baseAmount;
                                    if (Math.abs(diff) < 0.01) {
                                      setNewPaymentAdjustmentType('ninguno');
                                      setNewPaymentAdjustmentValue('');
                                    } else if (diff < 0) {
                                      setNewPaymentAdjustmentType('descuento');
                                      setNewPaymentAdjustmentValue(
                                        debt.remainingAmount > 0
                                          ? ((Math.abs(diff) / debt.remainingAmount) * 100).toFixed(2)
                                          : '0'
                                      );
                                    } else {
                                      setNewPaymentAdjustmentType('recargo');
                                      setNewPaymentAdjustmentValue(
                                        debt.remainingAmount > 0
                                          ? ((Math.abs(diff) / debt.remainingAmount) * 100).toFixed(2)
                                          : '0'
                                      );
                                    }
                                  }}
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
                                    <p className="text-sm text-muted-foreground">Monto original: {formatCurrency(debt.amount)}</p>
                                    <p className="text-sm text-muted-foreground">Pagado: {formatCurrency(debt.paidAmount)}</p>
                                    <p className="text-sm font-semibold text-destructive">Pendiente: {formatCurrency(debt.remainingAmount)}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label>Ajuste antes de cobrar</Label>
                                      <Select
                                        value={newPaymentAdjustmentType}
                                        onValueChange={(value) => setNewPaymentAdjustmentType(value as ManualAdjustmentType)}
                                      >
                                        <SelectTrigger className="rounded-xl">
                                          <SelectValue placeholder="Sin ajuste" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="ninguno">Sin ajuste</SelectItem>
                                          <SelectItem value="descuento">Descuento</SelectItem>
                                          <SelectItem value="recargo">Recargo</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="payment-adjustment-value">Ajuste (%)</Label>
                                      <Input
                                        id="payment-adjustment-value"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={newPaymentAdjustmentValue}
                                        onChange={(e) => setNewPaymentAdjustmentValue(e.target.value)}
                                        disabled={newPaymentAdjustmentType === 'ninguno'}
                                      />
                                    </div>
                                  </div>
                                  <div className="rounded-lg border p-3 text-sm space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">Ajuste aplicado:</span>
                                      <span>
                                        {(() => {
                                          const parsedAdjustmentPercent = Math.max(0, parseFloat(newPaymentAdjustmentValue) || 0);
                                          const signedAdjustment = getSignedAdjustment(
                                            newPaymentAdjustmentType,
                                            parsedAdjustmentPercent,
                                            debt.remainingAmount
                                          );
                                          return signedAdjustment >= 0
                                            ? `+ ${parsedAdjustmentPercent.toFixed(2)}% (${formatCurrency(signedAdjustment)})`
                                            : `- ${parsedAdjustmentPercent.toFixed(2)}% (${formatCurrency(Math.abs(signedAdjustment))})`;
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between font-medium">
                                      <span>Total deuda ajustada:</span>
                                      <span>
                                        {(() => {
                                          const parsedAdjustmentPercent = Math.max(0, parseFloat(newPaymentAdjustmentValue) || 0);
                                          const signedAdjustment = getSignedAdjustment(
                                            newPaymentAdjustmentType,
                                            parsedAdjustmentPercent,
                                            debt.remainingAmount
                                          );
                                          const adjustedDebtAmount = debt.paidAmount + Math.max(0, debt.remainingAmount + signedAdjustment);
                                          return formatCurrency(adjustedDebtAmount);
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between font-medium text-destructive">
                                      <span>Nuevo saldo pendiente:</span>
                                      <span>
                                        {(() => {
                                          const parsedAdjustmentPercent = Math.max(0, parseFloat(newPaymentAdjustmentValue) || 0);
                                          const signedAdjustment = getSignedAdjustment(
                                            newPaymentAdjustmentType,
                                            parsedAdjustmentPercent,
                                            debt.remainingAmount
                                          );
                                          return formatCurrency(Math.max(0, debt.remainingAmount + signedAdjustment));
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="payment-amount">Monto del Pago</Label>
                                    <Input
                                      id="payment-amount"
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      max={(() => {
                                        const parsedAdjustmentPercent = Math.max(0, parseFloat(newPaymentAdjustmentValue) || 0);
                                        const signedAdjustment = getSignedAdjustment(
                                          newPaymentAdjustmentType,
                                          parsedAdjustmentPercent,
                                          debt.remainingAmount
                                        );
                                        return Math.max(0, debt.remainingAmount + signedAdjustment);
                                      })()}
                                      value={newPaymentAmount}
                                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="payment-method">Método de Pago</Label>
                                    <Select value={newPaymentMethod} onValueChange={(value) => setNewPaymentMethod(value as PaymentMethod)}>
                                      <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Seleccionar método" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="efectivo">Efectivo</SelectItem>
                                        <SelectItem value="debito">Débito</SelectItem>
                                        <SelectItem value="credito">Crédito</SelectItem>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                        <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                                        <SelectItem value="bna">BNA</SelectItem>
                                        <SelectItem value="dni">DNI</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                      </SelectContent>
                                    </Select>
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
                                      setNewPaymentAdjustmentType('ninguno');
                                      setNewPaymentAdjustmentValue('');
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
                        <p className="font-semibold text-success">{formatCurrency(debt.paidAmount)}</p>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Pendiente</p>
                        <p className="font-semibold text-destructive">{formatCurrency(debt.remainingAmount)}</p>
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
                                    {formatCurrency(payment.amount)}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ajuste manual</Label>
                  <Select
                    value={editDebtAdjustmentType}
                    onValueChange={(value) => setEditDebtAdjustmentType(value as ManualAdjustmentType)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sin ajuste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguno">Sin ajuste</SelectItem>
                      <SelectItem value="descuento">Descuento</SelectItem>
                      <SelectItem value="recargo">Recargo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-adjustment-value">Ajuste (%)</Label>
                  <Input
                    id="edit-adjustment-value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={editDebtAdjustmentValue}
                    onChange={(e) => setEditDebtAdjustmentValue(e.target.value)}
                    disabled={editDebtAdjustmentType === 'ninguno'}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const selectedDebt = selectedAccountData?.debts.find((d) => d.id === selectedDebtForEdit);
                  if (!selectedDebt) return;
                  const baseAmount = selectedDebt.items.reduce(
                    (sum, item) => sum + item.product.price * item.quantity,
                    0
                  );
                  const adjustmentPercent = Math.max(0, parseFloat(editDebtAdjustmentValue) || 0);
                  const signedAdjustment = getSignedAdjustment(editDebtAdjustmentType, adjustmentPercent, baseAmount);
                  setEditDebtAmount(Math.max(0, baseAmount + signedAdjustment).toFixed(2));
                }}
              >
                Aplicar % al monto
              </Button>
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
                  setEditDebtAdjustmentType('ninguno');
                  setEditDebtAdjustmentValue('');
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExcel}
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <label htmlFor="import-excel-customers">
            <Button
              variant="outline"
              className="gap-2 cursor-pointer"
              asChild
            >
              <span>
                <Upload className="h-4 w-4" />
                Importar Excel
              </span>
            </Button>
          </label>
          <input
            id="import-excel-customers"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAccountsPage(1);
                }}
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
                paginatedAccounts.map((account) => (
                  <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.totalDebt)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(account.totalPaid)}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      {formatCurrency(account.totalRemaining)}
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
          {filteredAccounts.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {accountsPage} de {totalAccountsPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAccountsPage((prev) => Math.max(1, prev - 1))}
                  disabled={accountsPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAccountsPage((prev) => Math.min(totalAccountsPages, prev + 1))}
                  disabled={accountsPage === totalAccountsPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
