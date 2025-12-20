'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { SortDescriptor } from "@heroui/react";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner"; 

import { productosService } from '@/services/productos.service';
import { Producto, CrearProductoDto } from '@/types/productos.types';
import { useConfirm } from '@/providers/ConfirmProvider'; 
import { useUIConfig } from "@/providers/UIConfigProvider";

import { DataTable, Column } from '@/components/DataTable';
import { ProductoModal } from './components/ProductoModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButtons } from '@/components/ui/ActionButtons';

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

  // Carga de datos
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

  // Ordenamiento
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

  // Handlers CRUD
  const handleCreate = () => {
    setSelectedProducto(null);
    setIsModalOpen(true);
  };

  const handleEdit = useCallback(async (prodSimple: Producto) => {
    const toastId = toast.loading("Cargando detalles...");
    try {
      const prodCompleto = await productosService.getById(prodSimple.id);
      setSelectedProducto(prodCompleto);
      toast.dismiss(toastId);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando producto", { id: toastId });
    }
  }, []); 

  const onFormSubmit = async (dto: CrearProductoDto) => {
    try {
      if (selectedProducto) {
        const { unidades, ...datosProducto } = dto;
        await productosService.update(selectedProducto.id, datosProducto);
        await productosService.assignUnits(selectedProducto.id, { unidades });
        toast.success("Producto actualizado correctamente");
      } else {
        await productosService.create(dto);
        toast.success("Producto creado correctamente");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
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

  // Renderizado de Celdas
  const renderCell = useCallback((item: Producto, columnKey: React.Key) => {
    switch (columnKey) {
      case "nombre":
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:shadow-md transition-shadow">
              <Package className="text-blue-600" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className={`font-semibold text-slate-800 ${config.textSize}`}>
                {item.nombre}
              </p>
              {item.categoria_id && (
                <p className="text-xs text-slate-500">Cat ID: {item.categoria_id}</p>
              )}
            </div>
          </div>
        );
      
      case "codigo":
        return (
          <span className={`text-slate-600 font-medium ${config.textSize}`}>
            {item.codigo || '-'}
          </span>
        );
      
      case "stock_minimo":
        return (
          <span className={`
            px-3 py-1 rounded-lg font-semibold ${config.textSize}
            ${item.stock_minimo === 0 
              ? 'bg-red-100 text-red-700' 
              : 'bg-slate-100 text-slate-700'
            }
          `}>
            {item.stock_minimo}
          </span>
        );
      
      case "acciones":
        return (
          <ActionButtons
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        );
      
      default:
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span className={config.textSize}>{String(val)}</span>;
    }
  }, [config, handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Administra tu catálogo."
        actionLabel="Nuevo Producto"
        actionIcon={Plus}
        onAction={handleCreate}
      />

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