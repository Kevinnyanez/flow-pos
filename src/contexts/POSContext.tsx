import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'user1' | 'user2' | 'user3';

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

const initialProducts: Product[] = [
  { id: '1', name: 'Laptop HP', code: 'LHP001', price: 1200, stock: 15 },
  { id: '2', name: 'Mouse Logitech', code: 'MLG002', price: 25, stock: 50 },
  { id: '3', name: 'Teclado Mecánico', code: 'TKM003', price: 85, stock: 30 },
  { id: '4', name: 'Monitor Samsung 24"', code: 'MSM004', price: 180, stock: 20 },
  { id: '5', name: 'Webcam HD', code: 'WHD005', price: 60, stock: 25 },
  { id: '6', name: 'Audífonos Sony', code: 'ASN006', price: 45, stock: 40 },
  { id: '7', name: 'Impresora Epson', code: 'IEP007', price: 220, stock: 12 },
  { id: '8', name: 'Tablet Android', code: 'TAB008', price: 350, stock: 18 },
];

const initialCustomerAccounts: CustomerAccount[] = [
  {
    id: '1',
    name: 'María González',
    status: 'al-dia',
    totalDebt: 500,
    totalPaid: 500,
    totalRemaining: 0,
    lastMovementDate: new Date('2025-11-10'),
    debts: [
      {
        id: '1',
        date: new Date('2025-10-20'),
        items: [
          { product: initialProducts[0], quantity: 1 },
        ],
        amount: 500,
        description: 'Pantalón y remera',
        paidAmount: 500,
        remainingAmount: 0,
        status: 'pagado',
        payments: [
          {
            id: '1',
            date: new Date('2025-11-10'),
            amount: 500,
            description: 'Pago total',
          },
        ],
      },
    ],
    notes: '',
  },
  {
    id: '2',
    name: 'Juan Pérez',
    status: 'deuda',
    totalDebt: 450,
    totalPaid: 0,
    totalRemaining: 450,
    lastMovementDate: new Date('2025-10-15'),
    debts: [
      {
        id: '2',
        date: new Date('2025-10-15'),
        items: [
          { product: initialProducts[1], quantity: 2 },
        ],
        amount: 450,
        description: 'Campera de cuero',
        paidAmount: 0,
        remainingAmount: 450,
        status: 'pendiente',
        payments: [],
      },
    ],
    notes: '',
  },
  {
    id: '3',
    name: 'Ana Martínez',
    status: 'deuda',
    totalDebt: 600,
    totalPaid: 330,
    totalRemaining: 270,
    lastMovementDate: new Date('2025-11-15'),
    debts: [
      {
        id: '3',
        date: new Date('2025-10-20'),
        items: [
          { product: initialProducts[2], quantity: 1 },
        ],
        amount: 300,
        description: 'Vestido de fiesta',
        paidAmount: 180,
        remainingAmount: 120,
        status: 'parcial',
        payments: [
          {
            id: '2',
            date: new Date('2025-11-05'),
            amount: 100,
            description: 'Primera entrega',
          },
          {
            id: '3',
            date: new Date('2025-11-12'),
            amount: 80,
            description: 'Segunda entrega',
          },
        ],
      },
      {
        id: '4',
        date: new Date('2025-11-10'),
        items: [
          { product: initialProducts[3], quantity: 1 },
          { product: initialProducts[4], quantity: 2 },
        ],
        amount: 300,
        description: 'Zapatos y cartera',
        paidAmount: 150,
        remainingAmount: 150,
        status: 'parcial',
        payments: [
          {
            id: '4',
            date: new Date('2025-11-15'),
            amount: 150,
            description: 'Pago parcial',
          },
        ],
      },
    ],
    notes: 'Cliente de confianza',
  },
];

export function POSProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<CustomerAccount[]>(initialCustomerAccounts);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...product } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
