'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, SortDescriptor } from "@heroui/react";
import { Plus, Edit3, Trash2, Tags } from "lucide-react";
import { toast } from "sonner"; 

import { categoriasService } from '@/services/categorias.service';
import { Categoria, CrearCategoriaDto } from '@/types/categorias.types';
import { useConfirm } from '@/providers/ConfirmProvider'; 
import { useUIConfig } from "@/providers/UIConfigProvider"; // Importamos Config

import { DataTable, Column } from '@/components/DataTable';
import { CategoriaModal } from './components/CategoriaModal';

// Definición de columnas
const columns: Column[] = [
  { name: "NOMBRE", uid: "nombre", sortable: true },
  { name: "DESCRIPCIÓN", uid: "descripcion", sortable: true },
  { name: "ACCIONES", uid: "acciones" },
];

export default function CategoriasPage() {
  // 1. Hooks y Contextos
  const { config } = useUIConfig(); // Configuración de tamaño (sm, md, lg)
  const { confirm } = useConfirm();
  
  // 2. Estados de Datos
  const [data, setData] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Estados de Paginación y Filtros
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;

  // 4. Estado de Ordenamiento
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "nombre",
    direction: "ascending",
  });

  // 5. Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);

  // 6. Carga de datos del Backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await categoriasService.getAll(page, PER_PAGE, search);
      setData(response.data); 
      setTotal(response.meta.total); 
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error al cargar las categorías");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); 
  };

  // 7. Lógica de Ordenamiento (Client-side sobre la página actual)
  const sortedItems = useMemo(() => {
    return [...data].sort((a: Categoria, b: Categoria) => {
      const first = a[sortDescriptor.column as keyof Categoria];
      const second = b[sortDescriptor.column as keyof Categoria];
      const firstVal = first || "";
      const secondVal = second || "";
      const cmp = firstVal < secondVal ? -1 : 1;

      if (sortDescriptor.direction === "descending") {
        return -cmp;
      }
      return cmp;
    });
  }, [sortDescriptor, data]);

  // 8. Handlers del CRUD
  const handleCreate = () => {
    setSelectedCategoria(null);
    setIsModalOpen(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setIsModalOpen(true);
  };

  const onFormSubmit = async (dto: CrearCategoriaDto) => {
    try {
      if (selectedCategoria) {
        await categoriasService.update(selectedCategoria.id, dto);
        toast.success("Categoría actualizada");
      } else {
        await categoriasService.create(dto);
        toast.success("Categoría creada");
      }
      setIsModalOpen(false);
      fetchData(); 
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      throw new Error(message); 
    }
  };

  const handleDeleteClick = async (categoria: Categoria) => {
    const isConfirmed = await confirm({
      title: "Eliminar Categoría",
      message: `¿Eliminar "${categoria.nombre}"?`,
      confirmText: "Eliminar",
      color: "danger"
    });

    if (!isConfirmed) return; 

    const toastId = toast.loading("Procesando..."); 

    try {
      await categoriasService.delete(categoria.id);
      toast.success("Eliminado correctamente", { id: toastId });
      fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      toast.error(msg, { id: toastId });
    }
  };

  // 9. Renderizado de Celdas (Usando config para estilos)
  const renderCell = useCallback((item: Categoria, columnKey: React.Key) => {
    switch (columnKey) {
      case "nombre":
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 text-primary rounded-lg">
              <Tags size={20} /> 
            </div>
            {/* Aquí usamos config.textSize para mantener consistencia */}
            <span className={`font-bold text-slate-900 ${config.textSize}`}>
              {item.nombre}
            </span>
          </div>
        );
      
      case "descripcion":
        return (
          <span className={`text-slate-600 ${config.textSize}`}>
            {item.descripcion || <span className="italic text-slate-400">Sin descripción</span>}
          </span>
        );
      
      case "acciones":
        return (
          <div className="flex justify-center gap-2">
             <Tooltip content="Editar">
                <span 
                  onClick={() => handleEdit(item)} 
                  className="text-default-400 cursor-pointer hover:text-primary p-2 active:opacity-50"
                >
                  <Edit3 size={20} />
                </span>
             </Tooltip>
             <Tooltip color="danger" content="Eliminar">
                <span 
                  onClick={() => handleDeleteClick(item)} 
                  className="text-danger cursor-pointer hover:text-danger-400 p-2 active:opacity-50"
                >
                  <Trash2 size={20} />
                </span>
             </Tooltip>
          </div>
        );
      default:
        // Casteo seguro y aplicación de estilos de configuración
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span className={config.textSize}>{String(val)}</span>;
    }
  }, [config, handleEdit, handleDeleteClick]); 

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          {/* Título dinámico o fijo grande según prefieras, aquí lo dejo grande como en locales */}
          <h1 className="text-3xl font-bold text-slate-900">Categorías</h1>
          <p className={`${config.textSize} text-slate-500 mt-1`}>Gestiona la clasificación de tus productos.</p>
        </div>
        <Button 
          onPress={handleCreate} 
          className="bg-slate-900 text-white font-medium"
          // Botón usa el tamaño de la configuración
          size={config.buttonSize} 
          endContent={<Plus size={18} />}
        >
          <span className={config.textSize}>Nueva Categoría</span>
        </Button>
      </div>

      {/* COMPONENTE REUTILIZABLE */}
      <DataTable<Categoria>
        columns={columns}
        data={sortedItems}
        totalItems={total}      
        page={page}             
        perPage={PER_PAGE}      
        onPageChange={setPage}  
        searchQuery={search}    
        onSearchChange={handleSearchChange} 
        isLoading={isLoading}
        renderCell={renderCell} 
        emptyContent="No hay categorías registradas"
        
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />

      <CategoriaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={onFormSubmit} 
        categoriaAEditar={selectedCategoria} 
      />
    </div>
  );
}