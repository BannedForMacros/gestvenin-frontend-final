// app/dashboard/inventario/entradas-central/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Chip, Tooltip } from "@heroui/react";
import { PackageCheck, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from '@/providers/ConfirmProvider';
import { useAuth } from '@/providers/AuthProvider';

import { entradasService } from '@/services/entradas.service';
import { EntradaCentral } from '@/types/entradas.types';
import { DataTable, Column } from '@/components/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';

const columns: Column[] = [
  { name: "ID", uid: "id", sortable: true },
  { name: "TIPO", uid: "tipo", sortable: true },
  { name: "ORIGEN", uid: "origen" },
  { name: "TOTAL", uid: "total" },
  { name: "FECHA", uid: "creado_en", sortable: true },
  { name: "ESTADO", uid: "estado" },
  { name: "ACCIONES", uid: "acciones" },
];

export default function EntradasCentralPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { hasPermission } = useAuth();
  
  const CAN_CREATE = hasPermission('inventario_central.crear_entradas');
  const CAN_DELETE = hasPermission('inventario_central.eliminar_entradas');
  const CAN_VIEW = hasPermission('inventario_central.ver_entradas');

  const [data, setData] = useState<EntradaCentral[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;

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
    router.push('/dashboard/inventario/entradas-central/nueva');
  };

  const handleView = (entrada: EntradaCentral) => {
    router.push(`/dashboard/inventario/entradas-central/${entrada.id}`);
  };

  const handleDelete = async (entrada: EntradaCentral) => {
    const ok = await confirm({
      title: "Anular Entrada",
      message: `¿Estás seguro de anular la entrada #${entrada.id}? Se revertirá el stock.`,
      color: "danger"
    });
    if (!ok) return;

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

  const renderCell = useCallback((item: EntradaCentral, columnKey: React.Key) => {
    switch (columnKey) {
      case "id":
        return <span className="font-mono font-bold text-slate-700">#{item.id}</span>;
      case "tipo":
        return (
          <Chip size="sm" variant="flat" color={item.tipo === 'manual' ? "primary" : "secondary"}>
            {item.tipo === 'manual' ? 'Manual' : 'Requerimiento'}
          </Chip>
        );
      case "origen":
        if (item.tipo === 'requerimiento') {
          return <span className="text-slate-600">Req #{item.requerimiento_id}</span>;
        }
        return <span className="text-slate-400 text-sm">-</span>;
      case "total":
        return <span className="font-bold text-slate-900">S/ {Number(item.total).toFixed(2)}</span>;
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
          <div className="flex justify-center gap-1">
            {CAN_VIEW && (
              <Tooltip content="Ver Detalle">
                <button
                  onClick={() => handleView(item)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 active:scale-95"
                >
                  <Eye size={18} strokeWidth={2.5} />
                </button>
              </Tooltip>
            )}
            {CAN_DELETE && !item.anulado && (
              <Tooltip content="Anular Entrada">
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-95"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </Tooltip>
            )}
          </div>
        );
      default:
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span>{String(val ?? '')}</span>;
    }
  }, [CAN_DELETE, CAN_VIEW, handleDelete]);

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        title="Entradas al Inventario"
        description="Gestión de ingresos de mercadería al almacén central."
        actionLabel={CAN_CREATE ? "Nueva Entrada" : undefined}
        actionIcon={CAN_CREATE ? PackageCheck : undefined}
        onAction={CAN_CREATE ? handleCreate : undefined}
        actionColor="primary"
        actionVariant="solid"
      />

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
    </div>
  );
}