import { useState, useEffect } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, ArrowRight, DollarSign, CreditCard, Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CustomerCredit {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  amount: number;
  remaining_amount: number;
  origin_sale_id: string | null;
  origin_product_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface CreditRedemption {
  id: string;
  credit_id: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export default function Devoluciones() {
  const { sales, products } = usePOS();
  const [selectedSale, setSelectedSale] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [newProduct, setNewProduct] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // Credits state
  const [credits, setCredits] = useState<CustomerCredit[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CustomerCredit | null>(null);
  const [redemptionAmount, setRedemptionAmount] = useState<string>('');
  const [redemptionDescription, setRedemptionDescription] = useState<string>('');

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    setLoadingCredits(true);
    const { data, error } = await supabase
      .from('customer_credits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar créditos');
      console.error(error);
    } else {
      setCredits(data || []);
    }
    setLoadingCredits(false);
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSale(saleId);
    setProductSearch('');
    setStep(2);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProduct(productId);
    setStep(3);
  };

  // Search filters
  const [saleSearch, setSaleSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');

  const filteredSales = sales.filter((s) => {
    const q = saleSearch.trim().toLowerCase();
    if (!q) return true;
    const inDesc = s.description?.toLowerCase().includes(q);
    const inDate = new Date(s.date).toLocaleDateString().toLowerCase().includes(q);
    const inTotal = s.total?.toString().includes(q);
    const inProducts = s.items?.some(i => i.product.name.toLowerCase().includes(q));
    return !!(inDesc || inDate || inTotal || inProducts);
  });

  const saleItems = sales.find((s) => s.id === selectedSale)?.items || [];

  const filteredReplacementProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q));
  });

  const handleComplete = async () => {
    if (!selectedProduct || !newProduct) {
      toast.error('Completa todos los pasos');
      return;
    }

    const sale = sales.find((s) => s.id === selectedSale);
    const oldProduct = products.find((p) => p.id === selectedProduct);
    const replacement = products.find((p) => p.id === newProduct);

    if (!sale || !oldProduct || !replacement) {
      toast.error('Error en la selección');
      return;
    }

    const difference = replacement.price - oldProduct.price;

    // Helper to check if a string is a valid UUID
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // If there's credit (customer gets money back), save it to the database
    if (difference < 0 && customerName.trim()) {
      const { error } = await supabase.from('customer_credits').insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        amount: Math.abs(difference),
        remaining_amount: Math.abs(difference),
        origin_sale_id: isValidUUID(sale.id) ? sale.id : null,
        origin_product_id: isValidUUID(oldProduct.id) ? oldProduct.id : null,
        status: 'activo',
        notes: `Cambio de ${oldProduct.name} por ${replacement.name}`
      });

      if (error) {
        toast.error('Error al registrar el crédito');
        console.error(error);
        return;
      }

      toast.success(`Cambio completado. Crédito de ${formatCurrency(Math.abs(difference))} registrado para ${customerName}`);
      loadCredits();
    } else if (difference < 0) {
      toast.warning('Ingresa el nombre del cliente para registrar el crédito');
      return;
    } else if (difference > 0) {
      toast.success(`Cambio completado. Diferencia a pagar: ${formatCurrency(difference)}`);
    } else {
      toast.success('Cambio completado sin diferencias');
    }

    // Reset
    setSelectedSale('');
    setSelectedProduct('');
    setNewProduct('');
    setCustomerName('');
    setCustomerPhone('');
    setStep(1);
  };

  const handleRedeemCredit = async () => {
    if (!selectedCredit || !redemptionAmount) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const amount = parseFloat(redemptionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Monto inválido');
      return;
    }

    if (amount > selectedCredit.remaining_amount) {
      toast.error('El monto excede el crédito disponible');
      return;
    }

    // Insert redemption record
    const { error: redemptionError } = await supabase.from('credit_redemptions').insert({
      credit_id: selectedCredit.id,
      amount: amount,
      description: redemptionDescription.trim() || null
    });

    if (redemptionError) {
      toast.error('Error al registrar el cobro');
      console.error(redemptionError);
      return;
    }

    // Update credit remaining amount and status
    const newRemaining = selectedCredit.remaining_amount - amount;
    const newStatus = newRemaining <= 0 ? 'usado' : 'parcial';

    const { error: updateError } = await supabase
      .from('customer_credits')
      .update({
        remaining_amount: newRemaining,
        status: newStatus
      })
      .eq('id', selectedCredit.id);

    if (updateError) {
      toast.error('Error al actualizar el crédito');
      console.error(updateError);
      return;
    }

    toast.success(`Cobro de ${formatCurrency(amount)} registrado correctamente`);
    setRedemptionDialogOpen(false);
    setSelectedCredit(null);
    setRedemptionAmount('');
    setRedemptionDescription('');
    loadCredits();
  };

  const openRedemptionDialog = (credit: CustomerCredit) => {
    setSelectedCredit(credit);
    setRedemptionAmount(credit.remaining_amount.toString());
    setRedemptionDialogOpen(true);
  };

  const sale = sales.find((s) => s.id === selectedSale);
  const oldProduct = products.find((p) => p.id === selectedProduct);
  const replacement = products.find((p) => p.id === newProduct);
  const difference = oldProduct && replacement ? replacement.price - oldProduct.price : 0;

  const activeCredits = credits.filter(c => c.status === 'activo' || c.status === 'parcial');
  const usedCredits = credits.filter(c => c.status === 'usado');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo':
        return <Badge className="bg-success/20 text-success border-success/30">Activo</Badge>;
      case 'parcial':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Parcial</Badge>;
      case 'usado':
        return <Badge variant="secondary">Usado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Devoluciones y Cambios</h1>
        <p className="text-muted-foreground mt-1">Gestiona devoluciones, cambios y créditos de clientes</p>
      </div>

      <Tabs defaultValue="cambios" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cambios" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Cambios
          </TabsTrigger>
          <TabsTrigger value="creditos" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Créditos ({activeCredits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cambios" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Step 1 */}
            <Card className={`border-border/50 shadow-md ${step >= 1 ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      1
                    </div>
                    Seleccionar Venta
                  </CardTitle>
                  {step > 1 && <Badge variant="default">Completado</Badge>}
                </div>
                <CardDescription>Elige la venta que deseas procesar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Label className="text-sm">Buscar Venta</Label>
                  <Input
                    placeholder="Buscar por descripción, fecha, total o producto..."
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    className="rounded-xl mt-2"
                  />
                </div>
                <Select value={selectedSale} onValueChange={handleSelectSale} disabled={step > 1}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona una venta" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {filteredSales.length === 0 ? (
                      <SelectItem value="__no_sales" disabled>No se encontraron ventas</SelectItem>
                    ) : (
                      filteredSales.map((sale) => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.description ? `${sale.description} - ` : ''}{formatCurrency(sale.total)} - {new Date(sale.date).toLocaleDateString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {sales.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    No hay ventas registradas
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className={`border-border/50 shadow-md ${step >= 2 ? 'ring-2 ring-primary/20' : 'opacity-50'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      2
                    </div>
                    Producto a Devolver
                  </CardTitle>
                  {step > 2 && <Badge variant="default">Completado</Badge>}
                </div>
                <CardDescription>Selecciona el producto de la venta</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct} onValueChange={handleSelectProduct} disabled={step !== 2}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {sale?.items.map((item) => (
                      <SelectItem key={item.product.id} value={item.product.id}>
                        {item.product.name} - {formatCurrency(item.product.price)} x{item.quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className={`border-border/50 shadow-md ${step >= 3 ? 'ring-2 ring-primary/20' : 'opacity-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    3
                  </div>
                  Nuevo Producto
                </CardTitle>
                <CardDescription>Elige el producto de reemplazo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Label className="text-sm">Buscar Nuevo Producto</Label>
                  <Input
                    placeholder="Filtrar productos por nombre o código..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="rounded-xl mt-2"
                    disabled={step !== 3}
                  />
                </div>
                <Select value={newProduct} onValueChange={setNewProduct} disabled={step !== 3}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredReplacementProducts.length === 0 ? (
                      <SelectItem value="__no_products_replace" disabled>No se encontraron productos</SelectItem>
                    ) : (
                      filteredReplacementProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {step === 3 && oldProduct && replacement && (
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="bg-primary/5 rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Resumen del Cambio
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-xl border border-border p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">Producto Original</p>
                      <p className="font-semibold text-foreground">{oldProduct.name}</p>
                      <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(oldProduct.price)}</p>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-8 w-8 text-accent" />
                    </div>

                    <div className="rounded-xl border border-border p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">Nuevo Producto</p>
                      <p className="font-semibold text-foreground">{replacement.name}</p>
                      <p className="text-2xl font-bold text-accent mt-2">{formatCurrency(replacement.price)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Diferencia</p>
                        <p className="text-3xl font-bold">
                          {difference === 0 ? (
                            <span className="text-foreground">Sin diferencia</span>
                          ) : difference < 0 ? (
                            <span className="text-success">Crédito: {formatCurrency(Math.abs(difference))}</span>
                          ) : (
                            <span className="text-warning">A pagar: {formatCurrency(difference)}</span>
                          )}
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-primary" />
                    </div>
                  </div>

                  {/* Customer info for credit */}
                  {difference < 0 && (
                    <div className="rounded-xl border border-border p-4 bg-success/5">
                      <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Datos del cliente para registrar crédito
                      </p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="customerName">Nombre del cliente *</Label>
                          <Input
                            id="customerName"
                            placeholder="Nombre completo"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
                          <Input
                            id="customerPhone"
                            placeholder="Teléfono de contacto"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        setSelectedSale('');
                        setSelectedProduct('');
                        setNewProduct('');
                        setCustomerName('');
                        setCustomerPhone('');
                        setStep(1);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button className="flex-1 rounded-xl gap-2 shadow-md hover:shadow-lg" onClick={handleComplete}>
                      <RefreshCw className="h-4 w-4" />
                      Completar Cambio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="creditos" className="space-y-6 mt-6">
          {/* Active Credits */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-success" />
                Créditos Activos
              </CardTitle>
              <CardDescription>Créditos pendientes de cobrar por los clientes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCredits ? (
                <p className="text-center text-muted-foreground py-8">Cargando créditos...</p>
              ) : activeCredits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay créditos activos</p>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Cliente</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead className="text-right">Monto Original</TableHead>
                        <TableHead className="text-right">Restante</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCredits.map((credit) => (
                        <TableRow key={credit.id}>
                          <TableCell className="font-medium">{credit.customer_name}</TableCell>
                          <TableCell>{credit.customer_phone || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(credit.amount)}</TableCell>
                          <TableCell className="text-right font-bold text-success">
                            {formatCurrency(credit.remaining_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(credit.status)}</TableCell>
                          <TableCell>{new Date(credit.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1"
                              onClick={() => openRedemptionDialog(credit)}
                            >
                              <DollarSign className="h-3 w-3" />
                              Cobrar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Used Credits History */}
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Historial de Créditos Usados
              </CardTitle>
              <CardDescription>Créditos que ya fueron completamente cobrados</CardDescription>
            </CardHeader>
            <CardContent>
              {usedCredits.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay créditos usados</p>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usedCredits.map((credit) => (
                        <TableRow key={credit.id}>
                          <TableCell className="font-medium">{credit.customer_name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(credit.amount)}</TableCell>
                          <TableCell>{getStatusBadge(credit.status)}</TableCell>
                          <TableCell>{new Date(credit.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-muted-foreground">{credit.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Registrar Cobro de Crédito
            </DialogTitle>
            <DialogDescription>
              Registra el cobro del crédito para {selectedCredit?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Crédito disponible:</span>
                <span className="text-xl font-bold text-success">
                  ${selectedCredit?.remaining_amount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="redemptionAmount">Monto a cobrar *</Label>
              <Input
                id="redemptionAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={redemptionAmount}
                onChange={(e) => setRedemptionAmount(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redemptionDescription">Descripción (opcional)</Label>
              <Input
                id="redemptionDescription"
                placeholder="Ej: Compra de remera"
                value={redemptionDescription}
                onChange={(e) => setRedemptionDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedemptionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRedeemCredit} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Confirmar Cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div> 
  );
}
