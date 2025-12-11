import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  size?: string;
  color?: string;
  brand?: string;
  model?: string;
  category?: string;
  material?: string;
  gender?: string;
}

export type PaymentMethod = 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'mercado_pago' | 'bna' | 'dni' | 'otro';

export interface Sale {
  id: string;
  date: Date;
  items: { product: Product; quantity: number }[];
  total: number;
  userId: string;
  customerAccountId?: string;
  paymentMethod: PaymentMethod;
  description?: string;
}

export interface Payment {
  id: string;
  date: Date;
  amount: number;
  description?: string;
}

export type DebtStatus = 'pendiente' | 'deuda' | 'pagado' | 'cancelado';

export interface Debt {
  id: string;
  date: Date;
  items: { product: Product; quantity: number }[];
  amount: number;
  description: string;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  payments: Payment[];
}

export interface CustomerAccount {
  id: string;
  name: string;
  status: 'al-dia' | 'deuda' | 'condicional';
  totalDebt: number;
  totalPaid: number;
  totalRemaining: number;
  lastMovementDate?: Date;
  debts: Debt[];
  notes?: string;
}

export interface CashRegister {
  id: string;
  date: Date;
  openingBalance: number;
  closingBalance: number;
  totalSales: number;
  userId: string;
}

interface POSContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  authInitialized: boolean;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  customerAccounts: CustomerAccount[];
  setCustomerAccounts: React.Dispatch<React.SetStateAction<CustomerAccount[]>>;
  cashRegisters: CashRegister[];
  setCashRegisters: React.Dispatch<React.SetStateAction<CashRegister[]>>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id'>) => void;
  addCustomerAccount: (account: Omit<CustomerAccount, 'id'>) => void;
  updateCustomerAccount: (id: string, account: Partial<CustomerAccount>) => void;
  deleteCustomerAccount: (id: string) => void;
  addDebtToAccount: (accountId: string, debt: Omit<Debt, 'id' | 'amount' | 'paidAmount' | 'remainingAmount' | 'payments'> & { status: DebtStatus }) => void;
  updateDebt: (accountId: string, debtId: string, updates: { amount?: number; description?: string }) => void;
  updateDebtStatus: (accountId: string, debtId: string, newStatus: DebtStatus) => void;
  deleteDebt: (accountId: string, debtId: string) => void;
  addPaymentToDebt: (accountId: string, debtId: string, payment: Omit<Payment, 'id'>, paymentMethod?: PaymentMethod) => void;
  deletePayment: (accountId: string, debtId: string, paymentId: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const initialProducts: Product[] = [];


const initialCustomerAccounts: CustomerAccount[] = [];

export function POSProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>(initialCustomerAccounts);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      if (!authUser) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser({
        id: authUser.id,
        name: authUser.email ?? 'Usuario',
        role: 'user',
      });

      setTimeout(() => {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error || !data) return;
            const appRole = data.role as 'admin' | 'moderator' | 'user';
            const mappedRole: UserRole = appRole === 'admin' ? 'admin' : 'user';
            setCurrentUser((prev) =>
              prev
                ? { ...prev, role: mappedRole }
                : {
                    id: authUser.id,
                    name: authUser.email ?? 'Usuario',
                    role: mappedRole,
                  }
            );
          });
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const authUser = session?.user ?? null;
        if (!authUser) {
          setCurrentUser(null);
          return;
        }

        setCurrentUser({
          id: authUser.id,
          name: authUser.email ?? 'Usuario',
          role: 'user',
        });

        setTimeout(() => {
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)
            .maybeSingle()
            .then(({ data, error }) => {
              if (error || !data) return;
              const appRole = data.role as 'admin' | 'moderator' | 'user';
              const mappedRole: UserRole = appRole === 'admin' ? 'admin' : 'user';
              setCurrentUser((prev) =>
                prev
                  ? { ...prev, role: mappedRole }
                  : {
                      id: authUser.id,
                      name: authUser.email ?? 'Usuario',
                      role: mappedRole,
                    }
              );
            });
        }, 0);
      })
      .finally(() => {
        setAuthInitialized(true);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error || !data) return;

      setProducts(
        data.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          price: Number(p.price),
          stock: p.stock ?? 0,
          size: p.size ?? undefined,
          color: p.color ?? undefined,
          brand: p.brand ?? undefined,
          model: p.model ?? undefined,
          category: p.category ?? undefined,
          material: p.material ?? undefined,
          gender: p.gender ?? undefined,
        }))
      );
    };

    void loadProducts();
  }, []);
  // Load customer accounts from database
  useEffect(() => {
    const loadCustomerAccounts = async () => {
      const { data: accountsData, error: accountsError } = await supabase
        .from('customer_accounts')
        .select('*')
        .order('name');

      if (accountsError || !accountsData) return;

      // Load all debts with their items and payments
      const { data: debtsData } = await supabase
        .from('debts')
        .select('*')
        .order('date', { ascending: false });

      const { data: debtItemsData } = await supabase
        .from('debt_items')
        .select('*');

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      const accounts: CustomerAccount[] = accountsData.map((acc: any) => {
        const accountDebts = (debtsData || [])
          .filter((d: any) => d.customer_account_id === acc.id)
          .map((debt: any) => {
            const items = (debtItemsData || [])
              .filter((item: any) => item.debt_id === debt.id)
              .map((item: any) => {
                const product = products.find(p => p.id === item.product_id);
                return {
                  product: product || { id: item.product_id, name: 'Producto eliminado', code: '', price: item.unit_price, stock: 0 },
                  quantity: item.quantity,
                };
              });

            const debtPayments = (paymentsData || [])
              .filter((p: any) => p.debt_id === debt.id)
              .map((p: any) => ({
                id: p.id,
                date: new Date(p.date),
                amount: Number(p.amount),
                description: p.description || undefined,
              }));

            return {
              id: debt.id,
              date: new Date(debt.date),
              items,
              amount: Number(debt.amount),
              description: debt.description,
              paidAmount: Number(debt.paid_amount),
              remainingAmount: Number(debt.remaining_amount),
              status: debt.status as DebtStatus,
              payments: debtPayments,
            };
          });

        return {
          id: acc.id,
          name: acc.name,
          status: acc.status as CustomerAccount['status'],
          totalDebt: Number(acc.total_debt),
          totalPaid: Number(acc.total_paid),
          totalRemaining: Number(acc.total_remaining),
          lastMovementDate: acc.last_movement_at ? new Date(acc.last_movement_at) : undefined,
          debts: accountDebts,
          notes: acc.notes || undefined,
        };
      });

      setCustomerAccounts(accounts);
    };

    // Wait for products to be loaded before loading accounts
    if (products.length > 0 || authInitialized) {
      void loadCustomerAccounts();
    }
  }, [products, authInitialized]);

  // Load sales from database
  useEffect(() => {
    const loadSales = async () => {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });

      if (salesError || !salesData) return;

      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select('*');

      const loadedSales: Sale[] = salesData.map((sale: any) => {
        const items = (saleItemsData || [])
          .filter((item: any) => item.sale_id === sale.id)
          .map((item: any) => {
            const product = products.find(p => p.id === item.product_id);
            return {
              product: product || { id: item.product_id, name: 'Producto eliminado', code: '', price: item.unit_price, stock: 0 },
              quantity: item.quantity,
            };
          });

        return {
          id: sale.id,
          date: new Date(sale.date),
          items,
          total: Number(sale.total),
          userId: sale.user_id || '',
          customerAccountId: sale.customer_account_id || undefined,
          paymentMethod: sale.payment_method as PaymentMethod,
          description: sale.description || undefined,
        };
      });

      setSales(loadedSales);
    };

    if (products.length > 0 || authInitialized) {
      void loadSales();
    }
  }, [products, authInitialized]);

  // Load cash registers from database
  useEffect(() => {
    const loadCashRegisters = async () => {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) return;

      setCashRegisters(
        data.map((cr: any) => ({
          id: cr.id,
          date: new Date(cr.date),
          openingBalance: Number(cr.opening_balance),
          closingBalance: Number(cr.closing_balance),
          totalSales: Number(cr.total_sales),
          userId: cr.user_id || '',
        }))
      );
    };

    void loadCashRegisters();
  }, []);


  const addProduct = (product: Omit<Product, 'id'>) => {
    supabase
      .from('products')
      .insert({
        name: product.name,
        code: product.code,
        price: product.price,
        stock: product.stock,
        size: product.size || null,
        color: product.color || null,
        brand: product.brand || null,
        model: product.model || null,
        category: product.category || null,
        material: product.material || null,
        gender: product.gender || null,
      })
      .select('*')
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;

        const newProduct: Product = {
          id: data.id,
          name: data.name,
          code: data.code,
          price: Number(data.price),
          stock: data.stock ?? 0,
          size: data.size ?? undefined,
          color: data.color ?? undefined,
          brand: data.brand ?? undefined,
          model: data.model ?? undefined,
          category: data.category ?? undefined,
          material: data.material ?? undefined,
          gender: data.gender ?? undefined,
        };

        setProducts((prev) => [...prev, newProduct]);
      });
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    // Update local state optimistically
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...product } : p)));

    const payload: Record<string, unknown> = {};
    if (product.name !== undefined) payload.name = product.name;
    if (product.code !== undefined) payload.code = product.code;
    if (product.price !== undefined) payload.price = product.price;
    if (product.stock !== undefined) payload.stock = product.stock;
    if (product.size !== undefined) payload.size = product.size || null;
    if (product.color !== undefined) payload.color = product.color || null;
    if (product.brand !== undefined) payload.brand = product.brand || null;
    if (product.model !== undefined) payload.model = product.model || null;
    if (product.category !== undefined) payload.category = product.category || null;
    if (product.material !== undefined) payload.material = product.material || null;
    if (product.gender !== undefined) payload.gender = product.gender || null;

    if (Object.keys(payload).length === 0) return;

    // Wait for database update to complete
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    
    if (error) {
      console.error('Error updating product:', error);
      // Reload products from database to sync state
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setProducts((prev) => prev.map((p) => 
          p.id === id ? {
            id: data.id,
            name: data.name,
            code: data.code,
            price: Number(data.price),
            stock: data.stock ?? 0,
            size: data.size ?? undefined,
            color: data.color ?? undefined,
            brand: data.brand ?? undefined,
            model: data.model ?? undefined,
            category: data.category ?? undefined,
            material: data.material ?? undefined,
            gender: data.gender ?? undefined,
          } : p
        ));
      }
    }
  };

  const deleteProduct = async (id: string) => {
    // 1. borrar en Supabase
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error("Error al borrar en Supabase:", error);
      throw error; // así handleDelete lo captura
    }
  
    // 2. actualizar estado local recién después
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };
  

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    // Insert sale to database
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        date: sale.date.toISOString(),
        total: sale.total,
        user_id: sale.userId || null,
        customer_account_id: sale.customerAccountId || null,
        payment_method: sale.paymentMethod,
        description: sale.description || null,
      })
      .select('*')
      .single();

    if (saleError || !saleData) return;

    // Insert sale items
    if (sale.items.length > 0) {
      const saleItemsToInsert = sale.items.map(item => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      await supabase.from('sale_items').insert(saleItemsToInsert);
    }

    const newSale: Sale = {
      id: saleData.id,
      date: new Date(saleData.date),
      items: sale.items,
      total: Number(saleData.total),
      userId: saleData.user_id || '',
      customerAccountId: saleData.customer_account_id || undefined,
      paymentMethod: saleData.payment_method as PaymentMethod,
      description: saleData.description || undefined,
    };

    setSales((prev) => [newSale, ...prev]);

    // Update stock for each item - wait for all updates to complete
    await Promise.all(
      sale.items.map(async ({ product, quantity }) => {
        const currentProduct = products.find(p => p.id === product.id);
        if (currentProduct) {
          await updateProduct(product.id, { stock: currentProduct.stock - quantity });
        }
      })
    );
  };

  const addCustomerAccount = async (account: Omit<CustomerAccount, 'id'>) => {
    const { data, error } = await supabase
      .from('customer_accounts')
      .insert({
        name: account.name,
        status: account.status,
        total_debt: account.totalDebt,
        total_paid: account.totalPaid,
        total_remaining: account.totalRemaining,
        last_movement_at: account.lastMovementDate?.toISOString() || null,
        notes: account.notes || null,
      })
      .select('*')
      .single();

    if (error || !data) return;

    const newAccount: CustomerAccount = {
      id: data.id,
      name: data.name,
      status: data.status as CustomerAccount['status'],
      totalDebt: Number(data.total_debt),
      totalPaid: Number(data.total_paid),
      totalRemaining: Number(data.total_remaining),
      lastMovementDate: data.last_movement_at ? new Date(data.last_movement_at) : undefined,
      debts: [],
      notes: data.notes || undefined,
    };

    setCustomerAccounts((prev) => [...prev, newAccount]);
  };

  const updateCustomerAccount = async (id: string, account: Partial<CustomerAccount>) => {
    setCustomerAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...account } : a)));

    const payload: Record<string, unknown> = {};
    if (account.name !== undefined) payload.name = account.name;
    if (account.status !== undefined) payload.status = account.status;
    if (account.totalDebt !== undefined) payload.total_debt = account.totalDebt;
    if (account.totalPaid !== undefined) payload.total_paid = account.totalPaid;
    if (account.totalRemaining !== undefined) payload.total_remaining = account.totalRemaining;
    if (account.lastMovementDate !== undefined) payload.last_movement_at = account.lastMovementDate?.toISOString() || null;
    if (account.notes !== undefined) payload.notes = account.notes || null;

    if (Object.keys(payload).length === 0) return;

    await supabase.from('customer_accounts').update(payload).eq('id', id);
  };

  const deleteCustomerAccount = async (id: string) => {
    setCustomerAccounts((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('customer_accounts').delete().eq('id', id);
  };

  const addDebtToAccount = async (accountId: string, debt: Omit<Debt, 'id' | 'amount' | 'paidAmount' | 'remainingAmount' | 'payments'> & { status: DebtStatus }) => {
    // Calculate total from items
    const calculatedAmount = debt.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Update stock for pendiente or deuda (item is taken by customer)
    if (debt.status === 'pendiente' || debt.status === 'deuda') {
      await Promise.all(
        debt.items.map(async ({ product, quantity }) => {
          await updateProduct(product.id, { stock: product.stock - quantity });
        })
      );
    }

    // Insert debt to database
    const { data: debtData, error: debtError } = await supabase
      .from('debts')
      .insert({
        customer_account_id: accountId,
        date: debt.date.toISOString(),
        description: debt.description,
        amount: calculatedAmount,
        paid_amount: 0,
        remaining_amount: calculatedAmount,
        status: debt.status,
      })
      .select('*')
      .single();

    if (debtError || !debtData) return;

    // Insert debt items
    const debtItemsToInsert = debt.items.map(item => ({
      debt_id: debtData.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
    }));

    await supabase.from('debt_items').insert(debtItemsToInsert);

    const newDebt: Debt = {
      id: debtData.id,
      date: new Date(debtData.date),
      items: debt.items,
      amount: calculatedAmount,
      description: debtData.description,
      paidAmount: 0,
      remainingAmount: calculatedAmount,
      status: debtData.status as DebtStatus,
      payments: [],
    };

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = [...account.debts, newDebt];
          const activeDebts = updatedDebts.filter(d => d.status !== 'cancelado');
          const newTotalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);
          const newTotalRemaining = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
          }
          if (updatedDebts.some(d => d.status === 'pendiente')) {
            newStatus = 'condicional';
          }

          // Update account in database
          void supabase.from('customer_accounts').update({
            total_debt: newTotalDebt,
            total_remaining: newTotalRemaining,
            status: newStatus,
            last_movement_at: new Date().toISOString(),
          }).eq('id', accountId);

          return {
            ...account,
            debts: updatedDebts,
            totalDebt: newTotalDebt,
            totalRemaining: newTotalRemaining,
            status: newStatus,
            lastMovementDate: new Date(),
          };
        }
        return account;
      })
    );
  };

  const updateDebt = (accountId: string, debtId: string, updates: { amount?: number; description?: string }) => {
    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.map((debt) => {
            if (debt.id === debtId) {
              const newAmount = updates.amount !== undefined ? updates.amount : debt.amount;
              const newRemainingAmount = Math.max(0, newAmount - debt.paidAmount);

              return {
                ...debt,
                ...(updates.amount !== undefined && { amount: newAmount }),
                ...(updates.description !== undefined && { description: updates.description }),
                remainingAmount: newRemainingAmount,
              };
            }
            return debt;
          });

          const activeDebts = updatedDebts.filter(d => d.status !== 'cancelado');
          const newTotalDebt = activeDebts.reduce((sum, debt) => sum + debt.amount, 0);
          const newTotalRemaining = activeDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
          }
          if (updatedDebts.some(d => d.status === 'pendiente')) {
            newStatus = 'condicional';
          }

          return {
            ...account,
            debts: updatedDebts,
            totalDebt: newTotalDebt,
            totalRemaining: newTotalRemaining,
            status: newStatus,
            lastMovementDate: new Date(),
          };
        }
        return account;
      })
    );
  };

  const updateDebtStatus = async (accountId: string, debtId: string, newStatus: DebtStatus) => {
    const account = customerAccounts.find(a => a.id === accountId);
    const debt = account?.debts.find(d => d.id === debtId);
    if (!debt) return;

    const oldStatus = debt.status;

    // Handle stock changes based on status transitions
    if (newStatus === 'cancelado' && (oldStatus === 'pendiente' || oldStatus === 'deuda')) {
      await Promise.all(
        debt.items.map(async ({ product, quantity }) => {
          const currentProduct = products.find(p => p.id === product.id);
          if (currentProduct) {
            await updateProduct(product.id, { stock: currentProduct.stock + quantity });
          }
        })
      );
    }

    // Update debt in database
    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'pagado') {
      updatePayload.paid_amount = debt.amount;
      updatePayload.remaining_amount = 0;
    }
    await supabase.from('debts').update(updatePayload).eq('id', debtId);

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.map((d) => {
            if (d.id === debtId) {
              if (newStatus === 'pagado') {
                return { ...d, status: newStatus, paidAmount: d.amount, remainingAmount: 0 };
              }
              return { ...d, status: newStatus };
            }
            return d;
          });

          const activeDebts = updatedDebts.filter(d => d.status !== 'cancelado');
          const newTotalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);
          const newTotalPaid = activeDebts.reduce((sum, d) => sum + d.paidAmount, 0);
          const newTotalRemaining = activeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

          let accountStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            accountStatus = 'al-dia';
          }
          if (updatedDebts.some(d => d.status === 'pendiente')) {
            accountStatus = 'condicional';
          }

          // Update account in database
          void supabase.from('customer_accounts').update({
            total_debt: newTotalDebt,
            total_paid: newTotalPaid,
            total_remaining: newTotalRemaining,
            status: accountStatus,
            last_movement_at: new Date().toISOString(),
          }).eq('id', accountId);

          return {
            ...account,
            debts: updatedDebts,
            totalDebt: newTotalDebt,
            totalPaid: newTotalPaid,
            totalRemaining: newTotalRemaining,
            status: accountStatus,
            lastMovementDate: new Date(),
          };
        }
        return account;
      })
    );
  };

  const deleteDebt = async (accountId: string, debtId: string) => {
    // Delete debt items first, then debt
    await supabase.from('debt_items').delete().eq('debt_id', debtId);
    await supabase.from('payments').delete().eq('debt_id', debtId);
    await supabase.from('debts').delete().eq('id', debtId);

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.filter((debt) => debt.id !== debtId);

          const newTotalDebt = updatedDebts.reduce((sum, debt) => sum + debt.amount, 0);
          const newTotalPaid = updatedDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
          const newTotalRemaining = updatedDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
          }

          // Update account in database
          void supabase.from('customer_accounts').update({
            total_debt: newTotalDebt,
            total_paid: newTotalPaid,
            total_remaining: newTotalRemaining,
            status: newStatus,
            last_movement_at: new Date().toISOString(),
          }).eq('id', accountId);

          return {
            ...account,
            debts: updatedDebts,
            totalDebt: newTotalDebt,
            totalPaid: newTotalPaid,
            totalRemaining: newTotalRemaining,
            status: newStatus,
            lastMovementDate: new Date(),
          };
        }
        return account;
      })
    );
  };

  const addPaymentToDebt = async (accountId: string, debtId: string, payment: Omit<Payment, 'id'>, paymentMethod: PaymentMethod = 'efectivo') => {
    const account = customerAccounts.find(a => a.id === accountId);
    const debt = account?.debts.find(d => d.id === debtId);
    
    if (account && debt) {
      const paymentSale: Omit<Sale, 'id'> = {
        date: payment.date,
        items: [],
        total: payment.amount,
        userId: currentUser?.id || '',
        customerAccountId: accountId,
        paymentMethod: paymentMethod,
        description: `Abono de ${account.name} - ${debt.description}${payment.description ? ` (${payment.description})` : ''}`,
      };
      addSale(paymentSale);
    }

    // Insert payment to database
    const { data: paymentData, error } = await supabase
      .from('payments')
      .insert({
        debt_id: debtId,
        amount: payment.amount,
        date: payment.date.toISOString(),
        description: payment.description || null,
      })
      .select('*')
      .single();

    if (error || !paymentData) return;

    const newPaidAmount = (debt?.paidAmount || 0) + payment.amount;
    const newRemainingAmount = Math.max(0, (debt?.amount || 0) - newPaidAmount);
    let newDebtStatus: DebtStatus = debt?.status || 'deuda';
    if (newRemainingAmount === 0) {
      newDebtStatus = 'pagado';
    } else if (debt?.status === 'pendiente' || debt?.status === 'deuda') {
      newDebtStatus = 'deuda';
    }

    // Update debt in database
    await supabase.from('debts').update({
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      status: newDebtStatus,
    }).eq('id', debtId);

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.map((debt) => {
            if (debt.id === debtId) {
              const newPayment: Payment = {
                id: paymentData.id,
                date: new Date(paymentData.date),
                amount: Number(paymentData.amount),
                description: paymentData.description || undefined,
              };

              return {
                ...debt,
                payments: [...debt.payments, newPayment],
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newDebtStatus,
              };
            }
            return debt;
          });

          const newTotalPaid = updatedDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
          const newTotalRemaining = updatedDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
          }

          // Update account in database
          void supabase.from('customer_accounts').update({
            total_paid: newTotalPaid,
            total_remaining: newTotalRemaining,
            status: newStatus,
            last_movement_at: new Date().toISOString(),
          }).eq('id', accountId);

          return {
            ...account,
            debts: updatedDebts,
            totalPaid: newTotalPaid,
            totalRemaining: newTotalRemaining,
            status: newStatus,
            lastMovementDate: new Date(),
          };
        }
        return account;
      })
    );
  };

  const deletePayment = async (accountId: string, debtId: string, paymentId: string) => {
    // Delete payment from database
    await supabase.from('payments').delete().eq('id', paymentId);

    const account = customerAccounts.find(a => a.id === accountId);
    const debt = account?.debts.find(d => d.id === debtId);
    const paymentToDelete = debt?.payments.find(p => p.id === paymentId);
    
    const newPaidAmount = (debt?.paidAmount || 0) - (paymentToDelete?.amount || 0);
    const newRemainingAmount = Math.max(0, (debt?.amount || 0) - newPaidAmount);
    let newDebtStatus: DebtStatus = debt?.status || 'deuda';
    if (newRemainingAmount === 0) {
      newDebtStatus = 'pagado';
    } else if (newPaidAmount === 0) {
      newDebtStatus = 'deuda';
    }

    // Update debt in database
    await supabase.from('debts').update({
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      status: newDebtStatus,
    }).eq('id', debtId);

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.map((debt) => {
            if (debt.id === debtId) {
              const updatedPayments = debt.payments.filter((p) => p.id !== paymentId);
              return {
                ...debt,
                payments: updatedPayments,
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newDebtStatus,
              };
            }
            return debt;
          });

          const newTotalPaid = updatedDebts.reduce((sum, debt) => sum + debt.paidAmount, 0);
          const newTotalRemaining = updatedDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
          }

          // Update account in database
          void supabase.from('customer_accounts').update({
            total_paid: newTotalPaid,
            total_remaining: newTotalRemaining,
            status: newStatus,
            last_movement_at: new Date().toISOString(),
          }).eq('id', accountId);

          return {
            ...account,
            debts: updatedDebts,
            totalPaid: newTotalPaid,
            totalRemaining: newTotalRemaining,
            status: newStatus,
            lastMovementDate: new Date(),
          };
        }
        return account;
      })
    );
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authInitialized,
        products,
        setProducts,
        sales,
        setSales,
        customerAccounts,
        setCustomerAccounts,
        cashRegisters,
        setCashRegisters,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        addCustomerAccount,
        updateCustomerAccount,
        deleteCustomerAccount,
        addDebtToAccount,
        updateDebt,
        updateDebtStatus,
        deleteDebt,
        addPaymentToDebt,
        deletePayment,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
