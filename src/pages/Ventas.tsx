import { useEffect, useState } from 'react';
import { usePOS, Product } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Ventas() {
  const { products, addSale, currentUser, customerAccounts } = usePOS();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'debito' | 'credito' | 'transferencia' | 'mercado_pago' | 'bna' | 'dni' | 'otro'>('efectivo');
  const [description, setDescription] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [surchargePercent, setSurchargePercent] = useState<number>(0);
  const [roundUp, setRoundUp] = useState<boolean>(false);
  const [roundDown, setRoundDown] = useState<boolean>(false);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      } else {
        toast.error('No hay suficiente stock');
      }
    } else {
      if (product.stock > 0) {
        setCart([...cart, { product, quantity: 1 }]);
      } else {
        toast.error('Producto sin stock');
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
            if (newQuantity > item.product.stock) {
              toast.error('No hay suficiente stock');
              return item;
            }
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

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (discountPercent / 100);
    const surchargeAmount = subtotal * (surchargePercent / 100);
    let total = subtotal - discountAmount + surchargeAmount;
    
    if (roundUp) {
      total = Math.ceil(total / 100) * 100;
    } else if (roundDown) {
      total = Math.floor(total / 100) * 100;
    }
    
    return total;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 20;

const filteredProducts = products.filter((p) => {
  const term = searchTerm.toLowerCase();
  return (
    p.name.toLowerCase().includes(term) ||
    p.code?.toLowerCase().includes(term) ||
    p.category?.toLowerCase().includes(term) ||
    p.color?.toLowerCase().includes(term) ||
    p.material?.toLowerCase().includes(term) ||
    p.description?.toLowerCase().includes(term) ||
    p.brand?.toLowerCase().includes(term) ||
    p.model?.toLowerCase().includes(term) ||
    p.size?.toLowerCase().includes(term) ||
    p.gender?.toLowerCase().includes(term)
  );
});

  const filteredCustomers = customerAccounts.filter((account) =>
    account.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );

  useEffect(() => {
    setProductPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(totalProductPages);
    }
  }, [productPage, totalProductPages]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!currentUser) {
      toast.error('Error: Usuario no autenticado');
      return;
    }

    addSale({
      date: new Date(),
      items: cart,
      total: calculateTotal(),
      userId: currentUser.id,
      customerAccountId: selectedCustomer && selectedCustomer !== 'none' ? selectedCustomer : undefined,
      paymentMethod,
      description: description.trim() || undefined,
    });

    toast.success('Venta registrada correctamente');
    setCart([]);
    setSelectedCustomer('');
    setPaymentMethod('efectivo');
    setDescription('');
    setDiscountPercent(0);
    setSurchargePercent(0);
    setRoundUp(false);
    setRoundDown(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Punto de Venta</h1>
        <p className="text-muted-foreground mt-1">Selecciona productos y completa la venta</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Productos Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="col-span-2">
    <Input
      placeholder="Buscar por nombre, código, categoría, color, material, descripción..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="rounded-xl"
    />
  </div>
              {paginatedProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="flex items-center justify-between rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.code}</p>
                    <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
                  </div>
                  <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                    {product.stock}
                  </Badge>
                </button>
              ))}
              {filteredProducts.length > 0 && (
                <div className="col-span-2 flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Página {productPage} de {totalProductPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                      disabled={productPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((prev) => Math.min(totalProductPages, prev + 1))}
                      disabled={productPage === totalProductPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/50 shadow-lg sticky top-6">
            <CardHeader className="bg-primary/5 rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Carrito de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">El carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.product.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="h-7 w-7 p-0 rounded-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="h-7 w-7 p-0 rounded-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-7 w-7 p-0 rounded-lg text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Método de Pago
                      </label>
                      <Select value={paymentMethod} onValueChange={(value: 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'mercado_pago' | 'bna' | 'dni' | 'otro') => setPaymentMethod(value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="debito">Tarjeta de Débito</SelectItem>
                          <SelectItem value="credito">Tarjeta de Crédito</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                          <SelectItem value="bna">BNA+</SelectItem>
                          <SelectItem value="dni">Cuenta DNI</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Descripción / Nota (opcional)
                      </label>
                      <Input
                        placeholder="Ej: Posible cambio, Cliente Juan..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Cliente (opcional)
                      </label>
                      <Input
                        placeholder="Buscar cliente por nombre..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="rounded-xl mb-2"
                      />
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin cuenta corriente</SelectItem>
                          {filteredCustomers.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Descuento %
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={discountPercent || ''}
                            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Recargo %
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={surchargePercent || ''}
                            onChange={(e) => setSurchargePercent(parseFloat(e.target.value) || 0)}
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="roundUp"
                          checked={roundUp}
                          onChange={(e) => { setRoundUp(e.target.checked); if (e.target.checked) setRoundDown(false); }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <label htmlFor="roundUp" className="text-sm font-medium">
                          Redondear hacia arriba (centenas)
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="roundDown"
                          checked={roundDown}
                          onChange={(e) => { setRoundDown(e.target.checked); if (e.target.checked) setRoundUp(false); }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <label htmlFor="roundDown" className="text-sm font-medium">
                          Redondear hacia abajo (centenas)
                        </label>
                      </div>

                      <div className="flex items-center justify-between py-4 border-t border-border">
                        <span className="text-lg font-medium">Total:</span>
                        <span className="text-3xl font-bold text-primary">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full h-12 gap-2 rounded-xl shadow-md hover:shadow-lg"
                    >
                      <DollarSign className="h-5 w-5" />
                      Completar Venta
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
