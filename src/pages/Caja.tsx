import { usePOS } from '@/contexts/POSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Caja() {
  const { sales, currentUser } = usePOS();

  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return (
      saleDate.getDate() === today.getDate() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getFullYear() === today.getFullYear()
    );
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const stats = [
    {
      title: 'Caja Actual',
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: `${todaySales.length} ventas hoy`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Ventas del Día',
      value: todaySales.length,
      icon: ShoppingCart,
      description: 'Transacciones',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Ingresos Totales',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: `${totalTransactions} ventas`,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Promedio por Venta',
      value: `$${averageSale.toFixed(2)}`,
      icon: Calendar,
      description: 'Ticket promedio',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Caja y Arqueo</h1>
        <p className="text-muted-foreground mt-1">Panel de control financiero</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-xl p-2.5 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Historial de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Productos</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No hay ventas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  sales
                    .slice()
                    .reverse()
                    .map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
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
                                {item.product.name} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-semibold text-success">
                            ${sale.total.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {currentUser?.id === sale.userId ? 'Yo' : `Usuario ${sale.userId}`}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
