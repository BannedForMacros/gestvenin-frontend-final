'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, Chip, SortDescriptor } from "@heroui/react";
import { Plus, Edit3, Trash2, Send, FileText } from "lucide-react";
import { toast } from "sonner"; 

import { requerimientosService } from '@/services/requerimientos.service';
import { Requerimiento, RequerimientoCompleto, CrearRequerimientoDto } from '@/types/requerimientos.types';
import { useConfirm } from '@/providers/ConfirmProvider'; 
import { useUIConfig } from "@/providers/UIConfigProvider";

import { DataTable, Column } from '@/components/DataTable';
import { RequerimientoModal } from './components/RequerimientoModal';

const columns: Column[] = [
  { name: "CÓDIGO", uid: "codigo", sortable: true },
  { name: "ESTADO", uid: "estado", sortable: true },
  { name: "OBSERVACIONES", uid: "observaciones", sortable: false },
  { name: "FECHA", uid: "creado_en", sortable: true },
  { name: "ACCIONES", uid: "acciones" },
];

const statusColorMap: Record<string, "default" | "warning" | "success" | "danger" | "primary"> = {
  borrador: "default",
  revision: "warning",
  aprobado: "success",
  rechazado: "danger",
  comprado: "primary",
  eliminado: "danger"
};

export default function RequerimientosPage() {
  const { config } = useUIConfig();
  const { confirm } = useConfirm();

  const [data, setData] = useState<Requerimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "creado_en", direction: "descending" });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequerimientoCompleto | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await requerimientosService.getAll(page, PER_PAGE, search);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando requerimientos");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedItems = useMemo(() => {
    return [...data].sort((a: Requerimiento, b: Requerimiento) => {
      const first = a[sortDescriptor.column as keyof Requerimiento];
      const second = b[sortDescriptor.column as keyof Requerimiento];
      const firstVal = first || "";
      const secondVal = second || "";
      const cmp = firstVal < secondVal ? -1 : 1;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, data]);

  // --- Handlers ---

  const handleCreate = () => {
    setSelectedReq(null);
    setIsModalOpen(true);
  };

  const handleEdit = useCallback(async (reqSimple: Requerimiento) => {
    if (reqSimple.estado !== 'borrador') {
       return toast.error("Solo se pueden editar borradores");
    }
    const toastId = toast.loading("Cargando detalle...");
    try {
      const reqCompleto = await requerimientosService.getById(reqSimple.id);
      setSelectedReq(reqCompleto);
      toast.dismiss(toastId);
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar", { id: toastId });
    }
  }, []);

  const handleDelete = useCallback(async (req: Requerimiento) => {
    const ok = await confirm({ 
      title: "Eliminar Requerimiento", 
      message: `¿Desea eliminar ${req.codigo}?`, 
      color: "danger" 
    });
    if(!ok) return;
    try {
      await requerimientosService.delete(req.id);
      toast.success("Eliminado correctamente");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    }
  }, [confirm, fetchData]);

  const handleSendRevision = useCallback(async (req: Requerimiento) => {
    const ok = await confirm({ 
      title: "Enviar a Revisión", 
      message: `¿Enviar ${req.codigo} para aprobación? No podrás editarlo después.`, 
      confirmText: "Enviar",
      color: "primary" 
    });
    if(!ok) return;
    try {
      await requerimientosService.sendRevision(req.id);
      toast.success("Enviado a revisión");
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("Error al enviar");
    }
  }, [confirm, fetchData]);

  const onFormSubmit = async (dto: CrearRequerimientoDto) => {
    try {
      if (selectedReq) {
        await requerimientosService.update(selectedReq.id, dto);
        toast.success("Requerimiento actualizado");
      } else {
        await requerimientosService.create(dto);
        toast.success("Requerimiento creado");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
        throw error; 
    }
  };

  const renderCell = useCallback((item: Requerimiento, columnKey: React.Key) => {
    switch (columnKey) {
      case "codigo":
        return (
          <div className="flex items-center gap-2">
             <FileText size={18} className="text-slate-400"/>
             <span className={`font-bold ${config.textSize}`}>{item.codigo}</span>
          </div>
        );
      case "estado":
        return (
          <Chip color={statusColorMap[item.estado]} size="sm" variant="flat" className="capitalize">
             {item.estado}
          </Chip>
        );
      case "creado_en":
         return <span className={config.textSize}>{new Date(item.creado_en).toLocaleDateString()}</span>;
      case "acciones":
         // Solo mostramos acciones si es BORRADOR (según lógica backend)
         if (item.estado !== 'borrador') {
             return <span className="text-xs text-slate-400 italic">Solo lectura</span>;
         }
         return (
             <div className="flex justify-center gap-2">
                 <Tooltip content="Enviar a Revisión">
                    <span onClick={() => handleSendRevision(item)} className="cursor-pointer text-warning hover:text-warning-600 p-2">
                      <Send size={18} />
                    </span>
                 </Tooltip>
                 <Tooltip content="Editar">
                    <span onClick={() => handleEdit(item)} className="cursor-pointer text-slate-400 hover:text-primary p-2">
                      <Edit3 size={18} />
                    </span>
                 </Tooltip>
                 <Tooltip content="Eliminar">
                    <span onClick={() => handleDelete(item)} className="cursor-pointer text-danger hover:text-danger-400 p-2">
                      <Trash2 size={18} />
                    </span>
                 </Tooltip>
             </div>
         )
      default:
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span className={config.textSize}>{String(val || '')}</span>;
    }
  }, [config, handleEdit, handleDelete, handleSendRevision]);

  return (
    <div className="space-y-6 p-4">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Requerimientos</h1>
          <p className={`${config.textSize} text-slate-500`}>Solicitudes de compra y abastecimiento.</p>
        </div>
        <Button onPress={handleCreate} className="bg-slate-900 text-white" size={config.buttonSize} endContent={<Plus/>}>
           <span className={config.textSize}>Nuevo Requerimiento</span>
        </Button>
      </div>

      <DataTable<Requerimiento>
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

      <RequerimientoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={onFormSubmit}
        requerimientoAEditar={selectedReq}
      />
    </div>
  );
}