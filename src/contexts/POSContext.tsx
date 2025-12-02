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
}

export type PaymentMethod = 'efectivo' | 'debito' | 'credito';

export interface Sale {
  id: string;
  date: Date;
  items: { product: Product; quantity: number }[];
  total: number;
  userId: string;
  customerAccountId?: string;
  paymentMethod: PaymentMethod;
}

export interface Payment {
  id: string;
  date: Date;
  amount: number;
  description?: string;
}

export interface Debt {
  id: string;
  date: Date;
  items: { product: Product; quantity: number }[];
  amount: number;
  description: string;
  paidAmount: number;
  remainingAmount: number;
  status: 'pendiente' | 'parcial' | 'pagado';
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
  addDebtToAccount: (accountId: string, debt: Omit<Debt, 'id' | 'amount' | 'paidAmount' | 'remainingAmount' | 'status' | 'payments'>) => void;
  updateDebt: (accountId: string, debtId: string, updates: { amount?: number; description?: string }) => void;
  deleteDebt: (accountId: string, debtId: string) => void;
  addPaymentToDebt: (accountId: string, debtId: string, payment: Omit<Payment, 'id'>) => void;
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
          .then(({ data }) => {
            if (!data) return;
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
          })
          .catch(() => {
            // ignore
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
            .then(({ data }) => {
              if (!data) return;
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
            })
            .catch(() => {
              // ignore
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

  const addDebtToAccount = (accountId: string, debt: Omit<Debt, 'id' | 'amount' | 'paidAmount' | 'remainingAmount' | 'status' | 'payments'>) => {
    // Calculate total from items
    const calculatedAmount = debt.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Update stock
    debt.items.forEach(({ product, quantity }) => {
      updateProduct(product.id, { stock: product.stock - quantity });
    });

    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const newDebt: Debt = {
            ...debt,
            id: Date.now().toString(),
            amount: calculatedAmount,
            paidAmount: 0,
            remainingAmount: calculatedAmount,
            status: 'pendiente',
            payments: [],
          };

          const updatedDebts = [...account.debts, newDebt];
          const newTotalDebt = account.totalDebt + calculatedAmount;
          const newTotalRemaining = account.totalRemaining + calculatedAmount;

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
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

              let newStatus: Debt['status'] = 'parcial';
              if (newRemainingAmount === 0) {
                newStatus = 'pagado';
              } else if (debt.paidAmount === 0) {
                newStatus = 'pendiente';
              }

              return {
                ...debt,
                ...(updates.amount !== undefined && { amount: newAmount }),
                ...(updates.description !== undefined && { description: updates.description }),
                remainingAmount: newRemainingAmount,
                status: newStatus,
              };
            }
            return debt;
          });

          const newTotalDebt = updatedDebts.reduce((sum, debt) => sum + debt.amount, 0);
          const newTotalRemaining = updatedDebts.reduce((sum, debt) => sum + debt.remainingAmount, 0);

          let newStatus: CustomerAccount['status'] = 'deuda';
          if (newTotalRemaining === 0) {
            newStatus = 'al-dia';
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

  const addPaymentToDebt = (accountId: string, debtId: string, payment: Omit<Payment, 'id'>) => {
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

              let newStatus: Debt['status'] = 'parcial';
              if (newRemainingAmount === 0) {
                newStatus = 'pagado';
              } else if (newPaidAmount === 0) {
                newStatus = 'pendiente';
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

              let newStatus: Debt['status'] = 'parcial';
              if (newRemainingAmount === 0) {
                newStatus = 'pagado';
              } else if (newPaidAmount === 0) {
                newStatus = 'pendiente';
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
