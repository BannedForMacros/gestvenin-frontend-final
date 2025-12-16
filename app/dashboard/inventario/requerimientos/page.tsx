'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, Chip, SortDescriptor, Tabs, Tab } from "@heroui/react";
import { Plus, Edit3, Trash2, Send, FileText, CheckCircle, XCircle, Eye, Clock, PackageCheck, Ban } from "lucide-react"; 
import { toast } from "sonner"; 

import { requerimientosService } from '@/services/requerimientos.service';
import { 
  Requerimiento, 
  RequerimientoCompleto, 
  CrearRequerimientoDto, 
  RevisarRequerimientoDto 
} from '@/types/requerimientos.types';
import { useConfirm } from '@/providers/ConfirmProvider'; 
import { useUIConfig } from "@/providers/UIConfigProvider";
import { useAuth } from '@/providers/AuthProvider';

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

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  revision: "En Revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  comprado: "Comprado",
  eliminado: "Eliminado"
};

export default function RequerimientosPage() {
  const { config } = useUIConfig();
  const { confirm } = useConfirm();
  const { hasPermission } = useAuth();

  const CAN_CREATE = hasPermission('requerimientos.crear');
  const CAN_EDIT = hasPermission('requerimientos.editar'); 
  const CAN_APPROVE = hasPermission('requerimientos.aprobar'); 

  const [data, setData] = useState<Requerimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos"); // ← NUEVO ESTADO
  const PER_PAGE = 10;
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "creado_en", direction: "descending" });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequerimientoCompleto | null>(null);

  // ← MODIFICADO: Ahora pasa estadoFiltro al backend
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const estadoParam = estadoFiltro === "todos" ? undefined : estadoFiltro;
      const response = await requerimientosService.getAll(page, PER_PAGE, search, estadoParam);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando requerimientos");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, estadoFiltro]); // ← Agregar estadoFiltro

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

  // ← NUEVO: Contar por estado para mostrar badges
  const estadosCounts = useMemo(() => {
    const counts: Record<string, number> = {
      todos: data.length,
      borrador: 0,
      revision: 0,
      aprobado: 0,
      rechazado: 0,
    };
    data.forEach(req => {
      if (counts[req.estado] !== undefined) counts[req.estado]++;
    });
    return counts;
  }, [data]);

  // --- HANDLERS ---

  const handleCreate = () => {
    setSelectedReq(null);
    setIsModalOpen(true);
  };

  const handleOpenDetail = useCallback(async (reqSimple: Requerimiento) => {
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
    const ok = await confirm({ title: "Eliminar", message: `¿Eliminar ${req.codigo}?`, color: "danger" });
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
    const ok = await confirm({ title: "Enviar", message: `¿Enviar ${req.codigo} a revisión?`, color: "primary" });
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
      if (selectedReq) await requerimientosService.update(selectedReq.id, dto);
      else await requerimientosService.create(dto);
      
      toast.success(selectedReq ? "Actualizado" : "Creado");
      setIsModalOpen(false);
      fetchData();
    } catch (e) { throw e; }
  };

  const onReviewSubmit = async (dto: RevisarRequerimientoDto) => {
    if (!selectedReq) return;
    try {
      await requerimientosService.review(selectedReq.id, dto);
      
      if (dto.accion === 'guardar') {
        toast.success("Cambios guardados correctamente");
      } else {
        toast.success(`Requerimiento ${dto.accion === 'aprobar' ? 'aprobado' : 'rechazado'}`);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      throw error;
    }
  };

  // --- RENDER CELL ---

  const renderCell = useCallback((item: Requerimiento, columnKey: React.Key) => {
    switch (columnKey) {
      case "codigo":
        return <span className={`font-bold ${config.textSize} flex gap-2 items-center`}><FileText size={18} className="text-slate-400"/>{item.codigo}</span>;
      case "estado":
        return <Chip color={statusColorMap[item.estado]} size="sm" variant="flat" className="capitalize">{statusLabels[item.estado]}</Chip>;
      case "creado_en":
         return <span className={config.textSize}>{new Date(item.creado_en).toLocaleDateString()}</span>;
      
      case "acciones":
         if (item.estado === 'borrador' && CAN_EDIT) {
             return (
                 <div className="flex justify-center gap-2">
                     <Tooltip content="Enviar a Revisión">
                        <span onClick={() => handleSendRevision(item)} className="cursor-pointer text-warning hover:text-warning-600 p-2"><Send size={18} /></span>
                     </Tooltip>
                     <Tooltip content="Editar">
                        <span onClick={() => handleOpenDetail(item)} className="cursor-pointer text-slate-400 hover:text-primary p-2"><Edit3 size={18} /></span>
                     </Tooltip>
                     <Tooltip content="Eliminar">
                        <span onClick={() => handleDelete(item)} className="cursor-pointer text-danger hover:text-danger-400 p-2"><Trash2 size={18} /></span>
                     </Tooltip>
                 </div>
             );
         }

         if (item.estado === 'revision' && CAN_APPROVE) {
            return (
              <div className="flex justify-center gap-2">
                  <Button size="sm" variant="flat" color="primary" onPress={() => handleOpenDetail(item)} startContent={<Edit3 size={16} />}>
                    Revisar
                  </Button>
              </div>
            );
         }

         return (
            <div className="flex justify-center">
               <Tooltip content="Ver Detalle">
                  <span onClick={() => handleOpenDetail(item)} className="cursor-pointer text-slate-400 hover:text-slate-800 p-2"><Eye size={20} /></span>
               </Tooltip>
            </div>
         );

      default:
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span className={config.textSize}>{String(val || '')}</span>;
    }
  }, [config, CAN_EDIT, CAN_APPROVE, handleOpenDetail, handleDelete, handleSendRevision]);

  return (
    <div className="space-y-6 p-4">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Requerimientos</h1>
          <p className={`${config.textSize} text-slate-500`}>Solicitudes de compra y abastecimiento.</p>
        </div>
        {CAN_CREATE && (
            <Button onPress={handleCreate} className="bg-slate-900 text-white" size={config.buttonSize} endContent={<Plus/>}>
               <span className={config.textSize}>Nuevo Requerimiento</span>
            </Button>
        )}
      </div>

      {/* ← NUEVO: TABS DE FILTRO */}
      <Tabs 
        selectedKey={estadoFiltro} 
        onSelectionChange={(key) => {
          setEstadoFiltro(key as string);
          setPage(1);
        }}
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-slate-900",
          tab: "max-w-fit px-4 h-12",
          tabContent: "group-data-[selected=true]:text-slate-900 font-semibold"
        }}
      >
        <Tab 
          key="todos" 
          title={
            <div className="flex items-center gap-2">
              <FileText size={18}/>
              <span>Todos</span>
              <Chip size="sm" variant="flat">{total}</Chip>
            </div>
          }
        />
        <Tab 
          key="borrador" 
          title={
            <div className="flex items-center gap-2">
              <Edit3 size={18}/>
              <span>Borradores</span>
              {estadosCounts.borrador > 0 && <Chip size="sm" variant="flat" color="default">{estadosCounts.borrador}</Chip>}
            </div>
          }
        />
        <Tab 
          key="revision" 
          title={
            <div className="flex items-center gap-2">
              <Clock size={18}/>
              <span>En Revisión</span>
              {estadosCounts.revision > 0 && <Chip size="sm" variant="flat" color="warning">{estadosCounts.revision}</Chip>}
            </div>
          }
        />
        <Tab 
          key="aprobado" 
          title={
            <div className="flex items-center gap-2">
              <CheckCircle size={18}/>
              <span>Aprobados</span>
              {estadosCounts.aprobado > 0 && <Chip size="sm" variant="flat" color="success">{estadosCounts.aprobado}</Chip>}
            </div>
          }
        />
        <Tab 
          key="rechazado" 
          title={
            <div className="flex items-center gap-2">
              <XCircle size={18}/>
              <span>Rechazados</span>
              {estadosCounts.rechazado > 0 && <Chip size="sm" variant="flat" color="danger">{estadosCounts.rechazado}</Chip>}
            </div>
          }
        />
      </Tabs>

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
        onReview={onReviewSubmit} 
        requerimientoAEditar={selectedReq}
        canApprove={CAN_APPROVE}  
      />
    </div>
  );
}