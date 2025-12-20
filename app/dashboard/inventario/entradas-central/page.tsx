'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Chip, Tooltip } from "@heroui/react";
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from '@/providers/ConfirmProvider';
import { useAuth } from '@/providers/AuthProvider';

import { entradasService } from '@/services/entradas.service';
import { EntradaCentral, CrearEntradaDto } from '@/types/entradas.types';
import { DataTable, Column } from '@/components/DataTable';
import { EntradaModal } from './components/EntradaModal';

const columns: Column[] = [
  { name: "CÓDIGO", uid: "codigo", sortable: true },
  { name: "TIPO", uid: "tipo", sortable: true },
  { name: "ORIGEN", uid: "origen" },
  { name: "COMPROBANTE", uid: "comprobante" },
  { name: "TOTAL", uid: "total" },
  { name: "FECHA", uid: "creado_en", sortable: true },
  { name: "ESTADO", uid: "estado" },
  { name: "ACCIONES", uid: "acciones" },
];

export default function EntradasCentralPage() {
  const { confirm } = useConfirm();
  const { hasPermission } = useAuth();
  
  const CAN_CREATE = hasPermission('inventario_central.entradas');
  const CAN_DELETE = hasPermission('inventario_central.entradas');

  const [data, setData] = useState<EntradaCentral[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await entradasService.getAll(page, PER_PAGE, search);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar entradas");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async (entrada: EntradaCentral) => {
    const ok = await confirm({
      title: "Anular Entrada",
      message: `¿Estás seguro de anular la entrada ${entrada.codigo}? Se revertirá el stock.`,
      color: "danger"
    });
    if (!ok) return;

    // ✅ CORRECCIÓN 1: Manejo de error tipado sin 'any'
    try {
      await entradasService.delete(entrada.id);
      toast.success("Entrada anulada correctamente");
      fetchData();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo anular la entrada");
      }
    }
  };

  const handleFormSubmit = async (dto: CrearEntradaDto) => {
    setIsSaving(true);
    // ✅ CORRECCIÓN 2: Manejo de error tipado sin 'any'
    try {
      await entradasService.create(dto);
      toast.success("Entrada registrada exitosamente");
      setIsModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al guardar");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderCell = useCallback((item: EntradaCentral, columnKey: React.Key) => {
    switch (columnKey) {
      case "codigo":
        return <span className="font-mono font-bold text-slate-700">{item.codigo}</span>;
      case "tipo":
        return (
            <Chip size="sm" variant="flat" color={item.tipo === 'manual' ? "primary" : "secondary"}>
                {item.tipo === 'manual' ? 'Manual' : 'Requerimiento'}
            </Chip>
        );
      case "origen":
        if (item.tipo === 'requerimiento') return <span className="text-slate-600">Req #{item.requerimiento_id}</span>;
        return <span className="text-slate-600 font-medium">Prov ID: {item.proveedor_id}</span>;
      case "total":
        return <span className="font-bold">S/ {Number(item.total).toFixed(2)}</span>;
      case "creado_en":
        return <span className="text-sm text-slate-500">{new Date(item.creado_en).toLocaleDateString()}</span>;
      case "estado":
        return (
          <Chip size="sm" variant="dot" color={item.anulado ? "danger" : "success"}>
            {item.anulado ? "Anulada" : "Procesada"}
          </Chip>
        );
      case "acciones":
        return (
          <div className="flex gap-2">
            {CAN_DELETE && !item.anulado && (
                <Tooltip content="Anular Entrada">
                <span onClick={() => handleDelete(item)} className="cursor-pointer text-danger hover:text-danger-400 p-1">
                    <Trash2 size={18} />
                </span>
                </Tooltip>
            )}
          </div>
        );
      default:
        // ✅ CORRECCIÓN 3: Acceso dinámico seguro sin 'any' ni '@ts-ignore'
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span>{String(val ?? '')}</span>;
    }
  }, [CAN_DELETE]); // Agregamos handleDelete a dependencias por buena práctica

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="text-orange-600" /> Entradas al Inventario
          </h1>
          <p className="text-slate-500">Gestión de ingresos de mercadería al almacén central.</p>
        </div>
        {CAN_CREATE && (
          <Button onPress={handleCreate} className="bg-slate-900 text-white shadow-lg" startContent={<Plus size={18} />}>
            Nueva Entrada
          </Button>
        )}
      </div>

      <DataTable<EntradaCentral>
        columns={columns}
        data={data}
        totalItems={total}
        page={page}
        perPage={PER_PAGE}
        onPageChange={setPage}
        searchQuery={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        isLoading={isLoading}
        renderCell={renderCell}
      />

      <EntradaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        loading={isSaving}
      />
    </div>
  );
}