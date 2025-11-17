import { usePOS } from '@/contexts/POSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, ShoppingBag } from 'lucide-react';

export default function RegistroVentas() {
  const { sales } = usePOS();

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Registro de Ventas</h1>
        <p className="text-muted-foreground mt-1">Historial completo de todas las transacciones</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ventas
            </CardTitle>
            <div className="rounded-xl p-2.5 bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{sales.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Transacciones registradas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
            <div className="rounded-xl p-2.5 bg-success/10">
              <ShoppingBag className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ventas acumuladas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos Vendidos
            </CardTitle>
            <div className="rounded-xl p-2.5 bg-accent/10">
              <ShoppingBag className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades totales</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Historial Detallado</CardTitle>
          <CardDescription>Todas las ventas realizadas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Fecha y Hora</TableHead>
                  <TableHead className="font-semibold">Productos</TableHead>
                  <TableHead className="font-semibold">Cantidad</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">No hay ventas registradas</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales
                    .slice()
                    .reverse()
                    .map((sale) => {
                      const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                      return (
                        <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">#{sale.id}</TableCell>
                          <TableCell>
                            {new Date(sale.date).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.product.name}
                                  <span className="text-muted-foreground ml-1">
                                    (${item.product.price})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{totalQuantity} items</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold text-success">
                              ${sale.total.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Completada</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
