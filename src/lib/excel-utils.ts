import * as XLSX from 'xlsx';
import { Product } from '@/contexts/POSContext';
import { CustomerAccount } from '@/contexts/POSContext';

// Exportar productos a Excel
export const exportProductsToExcel = (products: Product[]) => {
  const data = products.map((product) => ({
    'Nombre': product.name,
    'Código': product.code,
    'Precio': product.price,
    'Stock': product.stock,
    'Talle': product.size || '',
    'Color': product.color || '',
    'Marca': product.brand || '',
    'Modelo': product.model || '',
    'Categoría': product.category || '',
    'Material': product.material || '',
    'Género': product.gender || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 30 }, // Nombre
    { wch: 15 }, // Código
    { wch: 12 }, // Precio
    { wch: 10 }, // Stock
    { wch: 10 }, // Talle
    { wch: 15 }, // Color
    { wch: 15 }, // Marca
    { wch: 20 }, // Modelo
    { wch: 15 }, // Categoría
    { wch: 15 }, // Material
    { wch: 12 }, // Género
  ];
  worksheet['!cols'] = columnWidths;

  const fileName = `stock_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Importar productos desde Excel
export const importProductsFromExcel = async (file: File): Promise<{ products: Omit<Product, 'id'>[]; skipped: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let skipped = 0;
        const products: Omit<Product, 'id'>[] = jsonData.map((row: any) => {
          const rawName = row['Nombre'] || row['nombre'] || '';
          const rawCode = row['Código'] || row['código'] || row['codigo'] || '';
          const rawPrice = row['Precio'] || row['precio'] || '';
          const rawStock = row['Stock'] || row['stock'] || '';

          // Parse numeric fields and default to 0 if missing or invalid
          let price = parseFloat(String(rawPrice || '').toString().replace(',', '.'));
          if (isNaN(price)) price = 0;

          let stock = parseInt(String(rawStock || '0'));
          if (isNaN(stock)) stock = 0;

          return {
            name: String(rawName || '').trim(),
            code: String(rawCode || '').trim() || '',
            price,
            stock,
            size: row['Talle'] || row['talle'] || undefined,
            color: row['Color'] || row['color'] || undefined,
            brand: row['Marca'] || row['marca'] || undefined,
            model: row['Modelo'] || row['modelo'] || undefined,
            category: row['Categoría'] || row['categoría'] || row['categoria'] || undefined,
            material: row['Material'] || row['material'] || undefined,
            description: row['Descripción'] || row['descripcion'] || row['descripcion'] || row['description'] || undefined,
            gender: row['Género'] || row['género'] || row['genero'] || undefined,
          } as Omit<Product, 'id'>;
        }).filter((p: Omit<Product, 'id'>) => {
          const valid = p.name && p.name.length > 0;
          if (!valid) skipped++;
          return valid;
        }); // Filtrar filas sin nombre (las consideramos inválidas)

        resolve({ products, skipped });
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel. Verifica que el formato sea correcto.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// Exportar clientes a Excel
export const exportCustomersToExcel = (customers: CustomerAccount[]) => {
  const data = customers.map((customer) => ({
    'Nombre': customer.name,
    'Estado': customer.status,
    'Deuda Total': customer.totalDebt,
    'Total Pagado': customer.totalPaid,
    'Saldo Pendiente': customer.totalRemaining,
    'Cantidad de Ventas': customer.debts.length,
    'Último Movimiento': customer.lastMovementDate 
      ? new Date(customer.lastMovementDate).toLocaleDateString('es-AR')
      : '',
    'Notas': customer.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 30 }, // Nombre
    { wch: 15 }, // Estado
    { wch: 15 }, // Deuda Total
    { wch: 15 }, // Total Pagado
    { wch: 15 }, // Saldo Pendiente
    { wch: 15 }, // Cantidad de Ventas
    { wch: 18 }, // Último Movimiento
    { wch: 40 }, // Notas
  ];
  worksheet['!cols'] = columnWidths;

  const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Importar clientes desde Excel
export const importCustomersFromExcel = async (file: File): Promise<Omit<CustomerAccount, 'id' | 'debts'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const customers: Omit<CustomerAccount, 'id' | 'debts'>[] = jsonData.map((row: any) => {
          const status = row['Estado'] || row['estado'] || 'al-dia';
          const validStatus = ['al-dia', 'deuda', 'condicional'].includes(status) 
            ? status as 'al-dia' | 'deuda' | 'condicional'
            : 'al-dia';

          return {
            name: row['Nombre'] || row['nombre'] || '',
            status: validStatus,
            totalDebt: parseFloat(row['Deuda Total'] || row['deuda total'] || row['deuda_total'] || '0'),
            totalPaid: parseFloat(row['Total Pagado'] || row['total pagado'] || row['total_pagado'] || '0'),
            totalRemaining: parseFloat(row['Saldo Pendiente'] || row['saldo pendiente'] || row['saldo_pendiente'] || '0'),
            notes: row['Notas'] || row['notas'] || undefined,
          };
        }).filter((c: Omit<CustomerAccount, 'id' | 'debts'>) => c.name); // Filtrar filas vacías

        resolve(customers);
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel. Verifica que el formato sea correcto.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

