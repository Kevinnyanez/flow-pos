import { useState } from 'react';
import { usePOS, Product } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Remera', 'Pantalón', 'Campera', 'Buzo', 'Camisa', 'Short', 'Vestido', 'Pollera', 'Accesorio', 'Calzado', 'Otro'];
const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Único'];
const GENDERS = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];

export default function Stock() {
  const { products, addProduct, updateProduct, deleteProduct } = usePOS();
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
    gender: '',
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
      gender: product.gender || '',
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success('Producto eliminado correctamente');
  };

  const handleCloseSheet = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', code: '', price: '', stock: '', size: '', color: '', brand: '', model: '', category: '', material: '', gender: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Stock</h1>
          <p className="text-muted-foreground mt-1">Administra el inventario de prendas</p>
        </div>
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
            placeholder="Buscar por nombre, código, marca o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className="p-6 border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.code}</p>
                </div>
              </div>
              <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                Stock: {product.stock}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
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

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-2xl font-bold text-primary">${product.price}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="rounded-lg"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(product.id)}
                  className="rounded-lg text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
  );
}