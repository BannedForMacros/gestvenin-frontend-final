'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, Chip, SortDescriptor } from "@heroui/react";
import { Plus, Edit3, Trash2, Ruler, CheckCircle2, Scale } from "lucide-react";
import { toast } from "sonner"; 

import { unidadesService } from '@/services/unidades.service';
import { UnidadMedida, CrearUnidadDto } from '@/types/unidades.types';
import { useConfirm } from '@/providers/ConfirmProvider'; 
import { useUIConfig } from "@/providers/UIConfigProvider"; // Configuración UI

// Componentes
import { DataTable, Column } from '@/components/DataTable';
import { UnidadMedidaModal } from './components/UnidadMedidaModal';

// Columnas
const columns: Column[] = [
  { name: "NOMBRE", uid: "nombre", sortable: true },
  { name: "ABREVIATURA", uid: "abreviatura", sortable: true },
  { name: "TIPO", uid: "tipo", sortable: true },
  { name: "CONVERSIÓN / BASE", uid: "conversion" },
  { name: "ACCIONES", uid: "acciones" },
];

export default function UnidadesPage() {
  // 1. Configuración y Hooks
  const { config } = useUIConfig();
  const { confirm } = useConfirm();

  // 2. Estados de Datos
  const [data, setData] = useState<UnidadMedida[]>([]); // Datos paginados para tabla
  const [allUnits, setAllUnits] = useState<UnidadMedida[]>([]); // Datos completos para el Modal
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Estados de Paginación y Filtros
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;

  // 4. Ordenamiento
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "tipo",
    direction: "ascending",
  });

  // 5. Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadMedida | null>(null);

  // --- CARGA DE DATOS ---

  // A. Carga Paginada (Cada vez que cambia página o búsqueda)
  const fetchTableData = async () => {
    setIsLoading(true);
    try {
      const response = await unidadesService.getAll(page, PER_PAGE, search);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error al cargar unidades");
    } finally {
      setIsLoading(false);
    }
  };

  // B. Carga Completa (Solo al montar, para llenar el select del modal)
  const fetchAllForModal = async () => {
    try {
      const units = await unidadesService.getAllList();
      setAllUnits(units);
    } catch (error) {
      console.error("Error cargando lista completa:", error);
    }
  };

  useEffect(() => {
    fetchTableData();
    fetchAllForModal(); // Cargamos esto una vez para tener listos los padres
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); 
  };

  // --- LÓGICA DE ORDENAMIENTO (Cliente) ---
  const sortedItems = useMemo(() => {
    return [...data].sort((a: UnidadMedida, b: UnidadMedida) => {
      const first = a[sortDescriptor.column as keyof UnidadMedida];
      const second = b[sortDescriptor.column as keyof UnidadMedida];
      const firstVal = first || "";
      const secondVal = second || "";
      
      // Ordenamiento especial para booleanos (es_base)
      if (typeof first === 'boolean' && typeof second === 'boolean') {
         return (first === second) ? 0 : first ? -1 : 1;
      }

      const cmp = firstVal < secondVal ? -1 : 1;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, data]);

  // --- HANDLERS ---
  const handleCreate = () => {
    setSelectedUnidad(null);
    setIsModalOpen(true);
  };

  const handleEdit = (unidad: UnidadMedida) => {
    setSelectedUnidad(unidad);
    setIsModalOpen(true);
  };

  const onFormSubmit = async (dto: CrearUnidadDto) => {
    try {
      if (selectedUnidad) {
        await unidadesService.update(selectedUnidad.id, dto);
        toast.success("Unidad actualizada");
      } else {
        await unidadesService.create(dto);
        toast.success("Unidad creada");
      }
      setIsModalOpen(false);
      fetchTableData(); // Recargar tabla
      fetchAllForModal(); // Recargar lista del modal por si creamos una base nueva
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      throw new Error(message); 
    }
  };

  const handleDeleteClick = async (unidad: UnidadMedida) => {
    const isConfirmed = await confirm({
      title: "Eliminar Unidad",
      message: `¿Eliminar "${unidad.nombre}"?`,
      confirmText: "Eliminar",
      color: "danger"
    });

    if (!isConfirmed) return; 

    const toastId = toast.loading("Procesando..."); 
    try {
      await unidadesService.delete(unidad.id);
      toast.success("Eliminado correctamente", { id: toastId });
      fetchTableData();
      fetchAllForModal();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      toast.error(msg, { id: toastId });
    }
  };

  // --- RENDER CELL ---
  const renderCell = useCallback((item: UnidadMedida, columnKey: React.Key) => {
    switch (columnKey) {
      case "nombre":
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 text-primary rounded-lg">
              <Ruler size={20} />
            </div>
            <span className={`font-bold text-slate-900 ${config.textSize}`}>
              {item.nombre}
            </span>
          </div>
        );

      case "abreviatura":
        return (
          <Chip size="sm" variant="bordered" className="font-semibold text-slate-600">
             {item.abreviatura}
          </Chip>
        );

      case "tipo":
        return (
           <span className={`capitalize text-slate-600 ${config.textSize}`}>
             {item.tipo}
           </span>
        );

      case "conversion":
        if (item.es_base) {
          return (
            <Chip 
                startContent={<CheckCircle2 size={14}/>} 
                color="success" 
                variant="flat" 
                size="sm"
                className="pl-1"
            >
                Unidad Base
            </Chip>
          );
        } else {
          // Buscamos el nombre del padre en la lista completa (allUnits)
          // porque en 'data' (paginada) podría no estar.
          const padre = allUnits.find(u => u.id === item.unidad_base_id);
          return (
            <div className="flex items-center gap-2 text-slate-600">
               <Scale size={16} className="text-slate-400"/>
               <span className={config.textSize}>
                 1 {item.abreviatura} = <b>{item.factor_a_base}</b> {padre?.abreviatura || '?'}
               </span>
            </div>
          );
        }

      case "acciones":
        return (
          <div className="flex justify-center gap-2">
            <Tooltip content="Editar">
              <span 
                className="text-default-400 cursor-pointer hover:text-primary p-2 active:opacity-50"
                onClick={() => handleEdit(item)}
              >
                <Edit3 size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Eliminar">
              <span 
                className="text-danger cursor-pointer hover:text-danger-400 p-2 active:opacity-50"
                onClick={() => handleDeleteClick(item)}
              >
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span className={config.textSize}>{String(val)}</span>;
    }
  }, [config, allUnits, handleEdit, handleDeleteClick]); // Dependencia allUnits importante para mostrar el padre

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Unidades de Medida</h1>
          <p className={`${config.textSize} text-slate-500 mt-1`}>Define unidades de peso, volumen y cantidad.</p>
        </div>
        <Button 
          onPress={handleCreate} 
          className="bg-slate-900 text-white font-medium"
          size={config.buttonSize} 
          endContent={<Plus size={18} />}
        >
          <span className={config.textSize}>Nueva Unidad</span>
        </Button>
      </div>

      <DataTable<UnidadMedida>
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
        emptyContent="No hay unidades registradas"
        
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />

      <UnidadMedidaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={onFormSubmit} 
        unidadAEditar={selectedUnidad}
        todasLasUnidades={allUnits} // Pasamos la lista completa para el Select
      />
    </div>
  );
}