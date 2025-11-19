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

export interface Movement {
  id: string;
  date: Date;
  amount: number;
  type: 'venta' | 'abono';
  description?: string;
  resultingBalance: number;
}

export interface CustomerAccount {
  id: string;
  name: string;
  status: 'al-dia' | 'deuda' | 'condicional';
  debt: number;
  lastMovementDate?: Date;
  movements: Movement[];
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
  addMovementToAccount: (accountId: string, movement: Omit<Movement, 'id' | 'resultingBalance'>) => void;
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
    lastMovementDate: new Date('2025-11-10'),
    movements: [
      {
        id: '1',
        date: new Date('2025-10-20'),
        amount: 500,
        type: 'venta',
        description: 'Venta productos varios',
        resultingBalance: 500,
      },
      {
        id: '2',
        date: new Date('2025-11-10'),
        amount: 500,
        type: 'abono',
        description: 'Pago total',
        resultingBalance: 0,
      },
    ],
    notes: '',
  },
  {
    id: '2',
    name: 'Juan Pérez',
    status: 'deuda',
    debt: 450,
    lastMovementDate: new Date('2025-10-15'),
    movements: [
      {
        id: '3',
        date: new Date('2025-10-15'),
        amount: 450,
        type: 'venta',
        description: 'Venta inicial',
        resultingBalance: 450,
      },
    ],
    notes: '',
  },
  {
    id: '3',
    name: 'Ana Martínez',
    status: 'condicional',
    debt: 120,
    lastMovementDate: new Date('2025-11-05'),
    movements: [
      {
        id: '4',
        date: new Date('2025-10-20'),
        amount: 300,
        type: 'venta',
        description: 'Venta productos',
        resultingBalance: 300,
      },
      {
        id: '5',
        date: new Date('2025-11-05'),
        amount: 180,
        type: 'abono',
        description: 'Pago parcial',
        resultingBalance: 120,
      },
    ],
    notes: '',
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

  const addMovementToAccount = (accountId: string, movement: Omit<Movement, 'id' | 'resultingBalance'>) => {
    setCustomerAccounts((prev) =>
      prev.map((account) => {
        if (account.id === accountId) {
          let newDebt = account.debt;

          // Calcular nueva deuda según el tipo de movimiento
          if (movement.type === 'venta') {
            newDebt += movement.amount;
          } else if (movement.type === 'abono') {
            newDebt = Math.max(0, newDebt - movement.amount);
          }

          // Determinar estado según la deuda
          let newStatus: CustomerAccount['status'] = 'al-dia';
          if (newDebt > 0) {
            newStatus = 'deuda';
          }

          // Crear nuevo movimiento con saldo resultante
          const newMovement: Movement = {
            ...movement,
            id: Date.now().toString(),
            resultingBalance: newDebt,
          };

          const updatedMovements = [...account.movements, newMovement];

          return {
            ...account,
            debt: newDebt,
            status: newStatus,
            lastMovementDate: new Date(),
            movements: updatedMovements,
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
        addMovementToAccount,
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
