import { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function Devoluciones() {
  const { sales, products } = usePOS();
  const [selectedSale, setSelectedSale] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [newProduct, setNewProduct] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleSelectSale = (saleId: string) => {
    setSelectedSale(saleId);
    setStep(2);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProduct(productId);
    setStep(3);
  };

  const handleComplete = () => {
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

    if (difference < 0) {
      toast.success(`Devolución completada. Crédito generado: $${Math.abs(difference).toFixed(2)}`);
    } else if (difference > 0) {
      toast.success(`Devolución completada. Diferencia a pagar: $${difference.toFixed(2)}`);
    } else {
      toast.success('Devolución completada sin diferencias');
    }

    // Reset
    setSelectedSale('');
    setSelectedProduct('');
    setNewProduct('');
    setStep(1);
  };

  const sale = sales.find((s) => s.id === selectedSale);
  const oldProduct = products.find((p) => p.id === selectedProduct);
  const replacement = products.find((p) => p.id === newProduct);
  const difference = oldProduct && replacement ? replacement.price - oldProduct.price : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Devoluciones y Cambios</h1>
        <p className="text-muted-foreground mt-1">Gestiona devoluciones y cambios de productos</p>
      </div>

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
            <Select value={selectedSale} onValueChange={handleSelectSale} disabled={step > 1}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecciona una venta" />
              </SelectTrigger>
              <SelectContent>
                {sales.map((sale) => (
                  <SelectItem key={sale.id} value={sale.id}>
                    Venta {sale.id} - ${sale.total.toFixed(2)} - {new Date(sale.date).toLocaleDateString()}
                  </SelectItem>
                ))}
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
                    {item.product.name} - ${item.product.price} x{item.quantity}
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
            <Select value={newProduct} onValueChange={setNewProduct} disabled={step !== 3}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.price}
                  </SelectItem>
                ))}
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
                  <p className="text-2xl font-bold text-primary mt-2">${oldProduct.price}</p>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-accent" />
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Nuevo Producto</p>
                  <p className="font-semibold text-foreground">{replacement.name}</p>
                  <p className="text-2xl font-bold text-accent mt-2">${replacement.price}</p>
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
                        <span className="text-success">Crédito: ${Math.abs(difference).toFixed(2)}</span>
                      ) : (
                        <span className="text-warning">A pagar: ${difference.toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-primary" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setSelectedSale('');
                    setSelectedProduct('');
                    setNewProduct('');
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
    </div>
  );
}
