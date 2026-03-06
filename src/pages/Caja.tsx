import { useState, useEffect } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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

  // Calcular ganancias por día
  const dailyMap: Record<string, number> = {};
  sales.forEach((sale) => {
    const d = new Date(sale.date);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyMap[key] = (dailyMap[key] ?? 0) + sale.total;
  });

  const dailyRevenues = Object.entries(dailyMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Date range filter (default: last 7 days)
  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const defaultFrom = sevenDaysAgo.toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
  const [dateTo, setDateTo] = useState<string>(todayStr);
  const [dailyPage, setDailyPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const dailyRowsPerPage = 10;
  const salesRowsPerPage = 15;

  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase.rpc('get_users_with_roles');
        if (error) {
          console.warn('No se pudieron cargar usuarios:', error.message ?? error);
          return;
        }

        const map: Record<string, string> = {};
        (data || []).forEach((u: any) => {
          if (u?.id) map[u.id] = u.email;
        });
        setUsersMap(map);
      } catch (err) {
        console.warn('Error al cargar usuarios:', err);
      }
    };

    void loadUsers();
  }, []);

  const filteredDailyRevenues = dailyRevenues.filter((d) => {
    if (!dateFrom || !dateTo) return true;
    return d.date >= dateFrom && d.date <= dateTo;
  });
  const orderedSales = sales.slice().reverse();

  const totalDailyPages = Math.max(1, Math.ceil(filteredDailyRevenues.length / dailyRowsPerPage));
  const paginatedDailyRevenues = filteredDailyRevenues.slice(
    (dailyPage - 1) * dailyRowsPerPage,
    dailyPage * dailyRowsPerPage
  );

  const totalSalesPages = Math.max(1, Math.ceil(orderedSales.length / salesRowsPerPage));
  const paginatedSales = orderedSales.slice(
    (salesPage - 1) * salesRowsPerPage,
    salesPage * salesRowsPerPage
  );

  useEffect(() => {
    if (dailyPage > totalDailyPages) {
      setDailyPage(totalDailyPages);
    }
  }, [dailyPage, totalDailyPages]);

  useEffect(() => {
    if (salesPage > totalSalesPages) {
      setSalesPage(totalSalesPages);
    }
  }, [salesPage, totalSalesPages]);

  useEffect(() => {
    setDailyPage(1);
  }, [dateFrom, dateTo]);

  const resetRange = () => {
    setDateFrom(defaultFrom);
    setDateTo(todayStr);
  };

  const getUserLabel = (userId: string) => {
    if (!userId) return 'Sistema';
    if (userId === currentUser?.id) return 'Yo';
    return usersMap[userId] ?? `Usuario ${userId.slice(0, 8)}`;
  };

  // Desglose por método de pago
  const cashRevenue = todaySales
    .filter((sale) => sale.paymentMethod === 'efectivo')
    .reduce((sum, sale) => sum + sale.total, 0);
  const debitRevenue = todaySales
    .filter((sale) => sale.paymentMethod === 'debito')
    .reduce((sum, sale) => sum + sale.total, 0);
  const creditRevenue = todaySales
    .filter((sale) => sale.paymentMethod === 'credito')
    .reduce((sum, sale) => sum + sale.total, 0);

  const stats = [
    {
      title: 'Caja Actual',
      value: formatCurrency(todayRevenue),
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
          <CardTitle>Desglose por Método de Pago (Hoy)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Efectivo</span>
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(cashRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todaySales.filter((s) => s.paymentMethod === 'efectivo').length} ventas
              </p>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Débito</span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(debitRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todaySales.filter((s) => s.paymentMethod === 'debito').length} ventas
              </p>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Crédito</span>
                <DollarSign className="h-4 w-4 text-accent" />
              </div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(creditRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todaySales.filter((s) => s.paymentMethod === 'credito').length} ventas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Ganancias por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border p-1" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border p-1" />
            </div>
            <div className="ml-auto flex gap-2">
              <button type="button" className="btn" onClick={resetRange}>Últimos 7 días</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDailyRevenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">No hay datos</TableCell>
                  </TableRow>
                ) : (
                  paginatedDailyRevenues.map((d) => (
                    <TableRow key={d.date} className="hover:bg-muted/50 transition-colors">
                      <TableCell>{new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                      <TableCell>{formatCurrency(d.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredDailyRevenues.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {dailyPage} de {totalDailyPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDailyPage((prev) => Math.max(1, prev - 1))}
                  disabled={dailyPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDailyPage((prev) => Math.min(totalDailyPages, prev + 1))}
                  disabled={dailyPage === totalDailyPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <TableHead className="font-semibold">Método</TableHead>
                  <TableHead className="font-semibold">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No hay ventas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSales.map((sale) => (
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
                            {formatCurrency(sale.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize text-sm">
                              {sale.paymentMethod === 'efectivo'
                                ? 'Efectivo'
                                : sale.paymentMethod === 'debito'
                                ? 'Débito'
                                : 'Crédito'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getUserLabel(sale.userId)}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
          {sales.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {salesPage} de {totalSalesPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSalesPage((prev) => Math.max(1, prev - 1))}
                  disabled={salesPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSalesPage((prev) => Math.min(totalSalesPages, prev + 1))}
                  disabled={salesPage === totalSalesPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
