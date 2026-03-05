import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS, Product } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Package, Download, Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { exportProductsToExcel, importProductsFromExcel } from '@/lib/excel-utils';

const CATEGORIES = ['Remera', 'Pantalón', 'Campera', 'Buzo', 'Camisa', 'Short', 'Vestido', 'Pollera', 'Accesorio', 'Calzado', 'Otro'];
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Único'];
const GENDERS = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];

export default function Stock() {
  const { products, addProduct, updateProduct, deleteProduct, currentUser, authInitialized, setCurrentUser } = usePOS();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: '',
    stock: '',
    size: '',
    color: '',
    brand: '',
    model: '',
    category: '',
    material: '',
    description: '',
    gender: '',
  });

  const term = searchTerm.toLowerCase();
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.color && p.color.toLowerCase().includes(term)) ||
      (p.material && p.material.toLowerCase().includes(term)) ||
      (p.model && p.model.toLowerCase().includes(term)) ||
      (p.size && p.size.toLowerCase().includes(term)) ||
      (p.gender && p.gender.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      code: formData.code,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      size: formData.size || undefined,
      color: formData.color || undefined,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      category: formData.category || undefined,
      material: formData.material || undefined,
      description: formData.description || undefined,
      gender: formData.gender || undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success('Producto actualizado correctamente');
    } else {
      addProduct(productData);
      toast.success('Producto agregado correctamente');
    }
    handleCloseSheet();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      price: product.price.toString(),
      stock: product.stock.toString(),
      size: product.size || '',
      color: product.color || '',
      brand: product.brand || '',
      model: product.model || '',
      category: product.category || '',
      material: product.material || '',
      description: product.description || '',
      gender: product.gender || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);  // ESTA función debe borrar *permanentemente*
  
      toast.success('Producto eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el producto');
      console.error(error);
    }
  };
  
  

  const handleCloseSheet = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', code: '', price: '', stock: '', size: '', color: '', brand: '', model: '', category: '', material: '', description: '', gender: '' });
  };

  const handleExportExcel = () => {
    try {
      exportProductsToExcel(products);
      toast.success('Stock exportado a Excel correctamente');
    } catch (error) {
      toast.error('Error al exportar el stock');
      console.error(error);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar sesión antes de comenzar la importación
    if (!authInitialized || !currentUser) {
      toast.error('Tu sesión expiró o no estás autenticado. Por favor inicia sesión nuevamente.');
      // limpiar input para permitir reintento después del login
      if (event.target) event.target.value = '';
      return;
    }

    try {
      const { products: importedProducts, skipped } = await importProductsFromExcel(file);
      
      if (!importedProducts || importedProducts.length === 0) {
        toast.error('No se encontraron productos válidos en el archivo');
        if (event.target) event.target.value = '';
        return;
      }

      // Agregar/actualizar cada producto importado
      let added = 0;
      let updated = 0;
      
      for (const product of importedProducts) {
        // Match by code when available, otherwise fallback to name (case-insensitive)
        const existingProduct = product.code
          ? products.find(p => p.code === product.code)
          : products.find(p => p.name.toLowerCase() === product.name.toLowerCase());

        if (existingProduct) {
          await updateProduct(existingProduct.id, {
            ...product,
            ...(product.code === '' ? { code: undefined } : {}),
          });
          updated++;
        } else {
          addProduct(product);
          added++;
        }
      }

      const summaryParts = [`${added} agregados`, `${updated} actualizados`];
      if (skipped && skipped > 0) summaryParts.push(`${skipped} omitidos`);

      toast.success(`Importación completada: ${summaryParts.join(', ')}`);
      
      // Limpiar el input
      if (event.target) event.target.value = '';
    } catch (error) {
      // Detectar errores de sesión/permiso y forzar re-login
      const errMsg = error instanceof Error ? error.message : String(error);
      if (/auth session missing|AuthSessionMissingError|session missing|403|401/i.test(errMsg)) {
        toast.error('Error de autenticación: tu sesión expiró. Iniciá sesión nuevamente.');
        // limpiar estado de usuario y redirigir al login
        try {
          setCurrentUser(null);
        } catch (e) {
          // no crítico
        }
        navigate('/login');
        if (event.target) event.target.value = '';
        return;
      }

      toast.error(errMsg || 'Error al importar el archivo Excel');
      console.error(error);
      if (event.target) event.target.value = '';
    }
  };
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col w-full px-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Stock</h1>
          <p className="text-muted-foreground mt-1">Administra el inventario de prendas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportExcel}
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <label htmlFor="import-excel-stock">
            <Button
              variant="outline"
              className="gap-2 cursor-pointer"
              asChild
            >
              <span>
                <Upload className="h-4 w-4" />
                Importar Excel
              </span>
            </Button>
          </label>
          <input
            id="import-excel-stock"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                className="gap-2 shadow-md hover:shadow-lg transition-all"
                onClick={() => setEditingProduct(null)}
              >
                <Plus className="h-4 w-4" />
                Nueva Prenda
              </Button>
            </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingProduct ? 'Editar Prenda' : 'Nueva Prenda'}</SheetTitle>
              <SheetDescription>
                {editingProduct
                  ? 'Modifica los datos de la prenda'
                  : 'Completa los datos para agregar una nueva prenda'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Prenda</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl"
                  placeholder="Ej: Remera básica algodón"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código / SKU</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="rounded-xl"
                  placeholder="Ej: REM-001-BL-M"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Talle</Label>
                  <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: Negro, Blanco"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Género</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: Nike, Adidas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="rounded-xl"
                    placeholder="Ej: Air Max 90"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="rounded-xl"
                  placeholder="Ej: Algodón, Poliéster"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl"
                  placeholder="Breve descripción de la prenda"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 rounded-xl">
                  {editingProduct ? 'Actualizar' : 'Agregar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseSheet}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="p-6 border-border/50 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código, marca, categoría, color, material, descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </Card>

      <div className="flex flex-col gap-4 w-full">
        {filteredProducts.map((product) => (
          <Card
          key={product.id}
          className="p-6 shadow-md"
        >
          <div className="space-y-3">
            {/* Header con ícono y nombre */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.code}</p>
              </div>
            </div>
        
            {/* Badge de Stock - ahora separado abajo */}
            <div>
              <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                Stock: {product.stock}
              </Badge>
            </div>
            
            {/* Badges de categoría, talle, color, etc */}
            <div className="flex flex-wrap gap-1.5">
              {product.category && (
                <Badge variant="outline" className="text-xs">{product.category}</Badge>
              )}
              {product.size && (
                <Badge variant="outline" className="text-xs">Talle {product.size}</Badge>
              )}
              {product.color && (
                <Badge variant="outline" className="text-xs">{product.color}</Badge>
              )}
              {product.gender && (
                <Badge variant="outline" className="text-xs">{product.gender}</Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="text-xs">{product.brand}</Badge>
              )}
            </div>
        
            {/* Footer con precio y acciones */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="rounded-lg"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  
                  className="rounded-lg text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar esta prenda?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. La prenda será eliminada permanentemente del inventario.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => handleDelete(product.id)}   // ← tu función real
        className="bg-red-600 hover:bg-red-700"
      >
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
              </div>
            </div>
          </div>
        </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-12 text-center border-border/50 shadow-md">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No se encontraron prendas</p>
        </Card>
      )}
    </div>
    </div>
  );
}