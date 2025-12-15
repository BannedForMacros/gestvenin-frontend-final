'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, SortDescriptor } from "@heroui/react";
import { Plus, Edit3, Trash2, Package } from "lucide-react";
import { toast } from "sonner"; 

import { productosService } from '@/services/productos.service';
import { Producto, CrearProductoDto } from '@/types/productos.types';
import { useConfirm } from '@/providers/ConfirmProvider'; 
import { useUIConfig } from "@/providers/UIConfigProvider";

import { DataTable, Column } from '@/components/DataTable';
import { ProductoModal } from './components/ProductoModal';

const columns: Column[] = [
  { name: "PRODUCTO", uid: "nombre", sortable: true },
  { name: "CÓDIGO", uid: "codigo", sortable: true },
  { name: "STOCK MÍN", uid: "stock_minimo", sortable: true },
  { name: "ACCIONES", uid: "acciones" },
];

export default function ProductosPage() {
  const { config } = useUIConfig();
  const { confirm } = useConfirm();

  const [data, setData] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ 
    column: "nombre", 
    direction: "ascending" 
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // 1. Carga de datos
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await productosService.getAll(page, PER_PAGE, search);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Ordenamiento en cliente (página actual)
  const sortedItems = useMemo(() => {
    return [...data].sort((a: Producto, b: Producto) => {
      const first = a[sortDescriptor.column as keyof Producto];
      const second = b[sortDescriptor.column as keyof Producto];
      const firstVal = first || "";
      const secondVal = second || "";
      const cmp = firstVal < secondVal ? -1 : 1;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, data]);

  // --- Handlers CRUD ---

  const handleCreate = () => {
    setSelectedProducto(null);
    setIsModalOpen(true);
  };

  const handleEdit = useCallback(async (prodSimple: Producto) => {
    const toastId = toast.loading("Cargando detalles...");
    try {
      // Obtenemos el producto completo (incluyendo sus unidades)
      const prodCompleto = await productosService.getById(prodSimple.id);
      setSelectedProducto(prodCompleto);
      toast.dismiss(toastId);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando producto", { id: toastId });
    }
  }, []); 

  // --- LÓGICA DE GUARDADO CORREGIDA ---
  const onFormSubmit = async (dto: CrearProductoDto) => {
    try {
      if (selectedProducto) {
        // MODO EDICIÓN:
        // El endpoint PATCH no acepta 'unidades', así que las separamos.
        const { unidades, ...datosProducto } = dto;

        // 1. Actualizamos datos básicos (Nombre, Stock, etc.)
        await productosService.update(selectedProducto.id, datosProducto);

        // 2. Actualizamos las unidades en su endpoint específico
        await productosService.assignUnits(selectedProducto.id, { unidades });

        toast.success("Producto actualizado correctamente");
      } else {
        // MODO CREACIÓN:
        // El endpoint POST sí acepta todo junto.
        await productosService.create(dto);
        toast.success("Producto creado correctamente");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
       // Relanzamos el error para que el Modal lo muestre en rojo
       throw error; 
    }
  };

  const handleDelete = useCallback(async (prod: Producto) => {
      const ok = await confirm({ 
        title: "Eliminar Producto", 
        message: `¿Estás seguro de eliminar "${prod.nombre}"?`, 
        color: "danger" 
      });
      
      if(!ok) return;
      
      try {
          await productosService.delete(prod.id);
          toast.success("Producto eliminado");
          fetchData();
      } catch(e) { 
        console.error(e);
        toast.error("Error al eliminar el producto"); 
      }
  }, [confirm, fetchData]); 

  // --- Renderizado de Celdas ---
  const renderCell = useCallback((item: Producto, columnKey: React.Key) => {
    switch (columnKey) {
      case "nombre":
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <p className={`font-bold text-slate-900 ${config.textSize}`}>{item.nombre}</p>
              {item.categoria_id && <p className="text-tiny text-slate-500">Cat ID: {item.categoria_id}</p>}
            </div>
          </div>
        );
      case "codigo":
        return <span className={config.textSize}>{item.codigo || '-'}</span>;
      case "stock_minimo":
        return <span className={`font-medium ${config.textSize}`}>{item.stock_minimo}</span>;
      case "acciones":
         return (
             <div className="flex justify-center gap-2">
                 <Tooltip content="Editar">
                    <span 
                      onClick={() => handleEdit(item)} 
                      className="cursor-pointer text-slate-400 hover:text-primary p-2 active:opacity-50"
                    >
                      <Edit3 size={18} />
                    </span>
                 </Tooltip>
                 <Tooltip content="Eliminar">
                    <span 
                      onClick={() => handleDelete(item)} 
                      className="cursor-pointer text-danger hover:text-danger-400 p-2 active:opacity-50"
                    >
                      <Trash2 size={18} />
                    </span>
                 </Tooltip>
             </div>
         )
      default:
        // Casteo seguro
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span className={config.textSize}>{String(val)}</span>;
    }
  }, [config, handleEdit, handleDelete]);

  return (
    <div className="space-y-6 p-4">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
          <p className={`${config.textSize} text-slate-500`}>Administra tu catálogo.</p>
        </div>
        <Button 
          onPress={handleCreate} 
          className="bg-slate-900 text-white font-medium" 
          size={config.buttonSize} 
          endContent={<Plus size={18}/>}
        >
           <span className={config.textSize}>Nuevo Producto</span>
        </Button>
      </div>

      <DataTable<Producto>
        columns={columns}
        data={sortedItems}
        totalItems={total}
        page={page}
        perPage={PER_PAGE}
        onPageChange={setPage}
        searchQuery={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        isLoading={isLoading}
        renderCell={renderCell}
        
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />

      <ProductoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={onFormSubmit}
        productoAEditar={selectedProducto}
      />
    </div>
  );
}