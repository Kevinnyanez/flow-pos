import { usePOS } from '@/contexts/POSContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { currentUser, products, sales, customerAccounts } = usePOS();

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 10).length;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const debtAccounts = customerAccounts.filter((a) => a.status === 'deuda').length;
  const totalOutstanding = customerAccounts.reduce((sum, a) => sum + (a.totalRemaining || 0), 0);

  const stats = [
    {
      title: 'Total Productos',
      value: totalProducts,
      icon: Package,
      description: `${lowStockProducts} con stock bajo`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Ventas Hoy',
      value: totalSales,
      icon: ShoppingCart,
      description: 'Transacciones completadas',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      description: 'Ventas acumuladas',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'En la Calle',
      value: formatCurrency(totalOutstanding),
      icon: DollarSign,
      description: `${debtAccounts} cuentas con deuda`,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Cuentas con Deuda',
      value: debtAccounts,
      icon: AlertCircle,
      description: `de ${customerAccounts.length} cuentas`,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bienvenido, {currentUser?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Panel de control de tu punto de venta
        </p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Productos con Stock Bajo
            </CardTitle>
            <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products
                .filter((p) => p.stock < 10)
                .slice(0, 5)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
                    </div>
                    <Badge variant={product.stock < 5 ? 'destructive' : 'secondary'}>
                      Stock: {product.stock}
                    </Badge>
                  </div>
                ))}
              {products.filter((p) => p.stock < 10).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  ¡Todos los productos tienen stock suficiente!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Cuentas Corrientes
            </CardTitle>
            <CardDescription>Estado de las cuentas de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerAccounts.slice(0, 5).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.status === 'al-dia' && 'Al día'}
                      {account.status === 'deuda' && `Deuda: ${formatCurrency(account.totalRemaining || 0)}` }
                      {account.status === 'condicional' && 'Condicional'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      account.status === 'al-dia'
                        ? 'default'
                        : account.status === 'deuda'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {account.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
