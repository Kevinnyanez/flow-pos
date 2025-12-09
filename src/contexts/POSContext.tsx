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
  updateProduct: (id: string, product: Partial<Product>) => void;
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

  const updateProduct = (id: string, product: Partial<Product>) => {
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

    void supabase.from('products').update(payload).eq('id', id);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    void supabase.from('products').delete().eq('id', id);
  };

  const addSale = (sale: Omit<Sale, 'id'>) => {
    const newSale = { ...sale, id: Date.now().toString() };
    setSales((prev) => [...prev, newSale]);

    // Update stock
    sale.items.forEach(({ product, quantity }) => {
      updateProduct(product.id, { stock: product.stock - quantity });
    });
  };

  const addCustomerAccount = (account: Omit<CustomerAccount, 'id'>) => {
    const newAccount = { ...account, id: Date.now().toString() };
    setCustomerAccounts((prev) => [...prev, newAccount]);
  };

  const updateCustomerAccount = (id: string, account: Partial<CustomerAccount>) => {
    setCustomerAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...account } : a)));
  };

  const deleteCustomerAccount = (id: string) => {
    setCustomerAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const addDebtToAccount = (accountId: string, debt: Omit<Debt, 'id' | 'amount' | 'paidAmount' | 'remainingAmount' | 'payments'> & { status: DebtStatus }) => {
    // Calculate total from items
    const calculatedAmount = debt.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Update stock for pendiente or deuda (item is taken by customer)
    if (debt.status === 'pendiente' || debt.status === 'deuda') {
      debt.items.forEach(({ product, quantity }) => {
        updateProduct(product.id, { stock: product.stock - quantity });
      });
    }

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const newDebt: Debt = {
            ...debt,
            id: Date.now().toString(),
            amount: calculatedAmount,
            paidAmount: 0,
            remainingAmount: calculatedAmount,
            payments: [],
          };

          const updatedDebts = [...account.debts, newDebt];
          // Only count non-cancelled debts for totals
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

  const updateDebtStatus = (accountId: string, debtId: string, newStatus: DebtStatus) => {
    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const debt = account.debts.find(d => d.id === debtId);
          if (!debt) return account;

          const oldStatus = debt.status;

          // Handle stock changes based on status transitions
          // Cancelado: restore stock if coming from pendiente/deuda
          if (newStatus === 'cancelado' && (oldStatus === 'pendiente' || oldStatus === 'deuda')) {
            debt.items.forEach(({ product, quantity }) => {
              const currentProduct = products.find(p => p.id === product.id);
              if (currentProduct) {
                updateProduct(product.id, { stock: currentProduct.stock + quantity });
              }
            });
          }
          
          // Pagado from pendiente/deuda: stock already decreased, just update status
          // No stock change needed

          const updatedDebts = account.debts.map((d) => {
            if (d.id === debtId) {
              // If pagado, set paidAmount = amount and remainingAmount = 0
              if (newStatus === 'pagado') {
                return {
                  ...d,
                  status: newStatus,
                  paidAmount: d.amount,
                  remainingAmount: 0,
                };
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

  const deleteDebt = (accountId: string, debtId: string) => {
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

  const addPaymentToDebt = (accountId: string, debtId: string, payment: Omit<Payment, 'id'>, paymentMethod: PaymentMethod = 'efectivo') => {
    // Find account and debt info for sale description
    const account = customerAccounts.find(a => a.id === accountId);
    const debt = account?.debts.find(d => d.id === debtId);
    
    // Register payment as a sale so it appears in Caja
    if (account && debt) {
      const paymentSale: Omit<Sale, 'id'> = {
        date: payment.date,
        items: [], // Payment, no physical items
        total: payment.amount,
        userId: currentUser?.id || '',
        customerAccountId: accountId,
        paymentMethod: paymentMethod,
        description: `Abono de ${account.name} - ${debt.description}${payment.description ? ` (${payment.description})` : ''}`,
      };
      addSale(paymentSale);
    }

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.map((debt) => {
            if (debt.id === debtId) {
              const newPayment: Payment = {
                ...payment,
                id: Date.now().toString(),
              };

              const newPaidAmount = debt.paidAmount + payment.amount;
              const newRemainingAmount = Math.max(0, debt.amount - newPaidAmount);

              // Keep status as deuda if still has remaining, pagado if fully paid
              let newStatus: DebtStatus = debt.status;
              if (newRemainingAmount === 0) {
                newStatus = 'pagado';
              } else if (debt.status === 'pendiente' || debt.status === 'deuda') {
                newStatus = 'deuda'; // After payment, it becomes deuda (confirmed purchase)
              }

              return {
                ...debt,
                payments: [...debt.payments, newPayment],
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus,
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

  const deletePayment = (accountId: string, debtId: string, paymentId: string) => {
    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedDebts = account.debts.map((debt) => {
            if (debt.id === debtId) {
              const updatedPayments = debt.payments.filter((p) => p.id !== paymentId);
              const newPaidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
              const newRemainingAmount = Math.max(0, debt.amount - newPaidAmount);

              let newStatus: DebtStatus = debt.status;
              if (newRemainingAmount === 0) {
                newStatus = 'pagado';
              } else if (newPaidAmount === 0 && (debt.status === 'pagado' || debt.status === 'deuda')) {
                newStatus = 'deuda';
              }

              return {
                ...debt,
                payments: updatedPayments,
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus,
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
