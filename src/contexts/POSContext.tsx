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
  type: 'deuda' | 'abono' | 'saldo';
  description?: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  status: 'al-dia' | 'deuda' | 'condicional';
  debt: number;
  lastPaymentDate?: Date;
  sales: string[];
  payments: Payment[];
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
  addPaymentToAccount: (accountId: string, payment: Omit<Payment, 'id'>) => void;
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
    debt: 0,
    lastPaymentDate: new Date('2025-11-10'),
    sales: [],
    payments: [],
  },
  {
    id: '2',
    name: 'Juan Pérez',
    status: 'deuda',
    debt: 450,
    lastPaymentDate: new Date('2025-10-15'),
    sales: [],
    payments: [
      {
        id: '1',
        date: new Date('2025-10-15'),
        amount: 450,
        type: 'deuda',
        description: 'Deuda inicial',
      },
    ],
  },
  {
    id: '3',
    name: 'Ana Martínez',
    status: 'condicional',
    debt: 120,
    lastPaymentDate: new Date('2025-11-01'),
    sales: [],
    payments: [
      {
        id: '2',
        date: new Date('2025-11-01'),
        amount: 120,
        type: 'deuda',
        description: 'Deuda inicial',
      },
    ],
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

  const addPaymentToAccount = (accountId: string, payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: Date.now().toString() };
    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          const updatedPayments = [...account.payments, newPayment];
          let newDebt = account.debt;
          let newStatus = account.status;

          // Actualizar deuda según el tipo de pago
          if (payment.type === 'deuda') {
            newDebt += payment.amount;
          } else if (payment.type === 'abono') {
            newDebt -= payment.amount;
          } else if (payment.type === 'saldo') {
            newDebt = 0;
          }

          // Actualizar estado según la deuda
          if (newDebt === 0) {
            newStatus = 'al-dia';
          } else if (newDebt > 0) {
            newStatus = 'deuda';
          }

          return {
            ...account,
            debt: Math.max(0, newDebt),
            status: newStatus,
            lastPaymentDate: new Date(),
            payments: updatedPayments,
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
        addPaymentToAccount,
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
