'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, Chip, SortDescriptor } from "@heroui/react";
import { Plus, Edit3, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from '@/providers/ConfirmProvider';
import { useAuth } from '@/providers/AuthProvider';

import { proveedoresService } from '@/services/proveedores.service';
import { Proveedor, CrearProveedorDto } from '@/types/proveedores.types';
import { DataTable, Column } from '@/components/DataTable';
import { ProveedorModal } from './components/ProveedorModal';

const columns: Column[] = [
  { name: "RUC", uid: "ruc", sortable: true },
  { name: "RAZÓN SOCIAL", uid: "razon_social", sortable: true },
  { name: "NOMBRE COMERCIAL", uid: "nombre_comercial", sortable: true },
  { name: "CONTACTO", uid: "contacto_nombre" },
  { name: "TELÉFONO", uid: "telefono" },
  { name: "ESTADO", uid: "activo" },
  { name: "ACCIONES", uid: "acciones" },
];

export default function ProveedoresPage() {
  const { confirm } = useConfirm();
  const { hasPermission } = useAuth();
  
  const CAN_CREATE = hasPermission('proveedores.crear');
  const CAN_EDIT = hasPermission('proveedores.editar');
  const CAN_DELETE = hasPermission('proveedores.eliminar');

  const [data, setData] = useState<Proveedor[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 10;
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "razon_social", direction: "ascending" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await proveedoresService.getAll(page, PER_PAGE, search);
      setData(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar proveedores");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ CORREGIDO: Tipado estricto en lugar de any
  const sortedItems = useMemo(() => {
    return [...data].sort((a: Proveedor, b: Proveedor) => {
      // Casteamos a keyof Proveedor para que TS sepa que es una clave válida
      const col = sortDescriptor.column as keyof Proveedor;
      const first = a[col];
      const second = b[col];

      // Manejo seguro de nulos
      const fValue = first ?? '';
      const sValue = second ?? '';

      const cmp = fValue < sValue ? -1 : fValue > sValue ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, data]);

  const handleCreate = () => {
    setSelectedProveedor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleDelete = async (proveedor: Proveedor) => {
    const ok = await confirm({
      title: "Eliminar Proveedor",
      message: `¿Estás seguro de eliminar a ${proveedor.razon_social}?`,
      color: "danger"
    });
    if (!ok) return;

    try {
      await proveedoresService.delete(proveedor.id);
      toast.success("Proveedor eliminado");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el proveedor");
    }
  };

  // ✅ CORREGIDO: Tipado estricto del error
  const handleFormSubmit = async (dto: CrearProveedorDto) => {
    setIsSaving(true);
    try {
      if (selectedProveedor) {
        await proveedoresService.update(selectedProveedor.id, dto);
        toast.success("Proveedor actualizado");
      } else {
        await proveedoresService.create(dto);
        toast.success("Proveedor creado exitosamente");
      }
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

  const renderCell = useCallback((item: Proveedor, columnKey: React.Key) => {
    switch (columnKey) {
      case "ruc":
        return <span className="font-mono font-bold text-slate-700">{item.ruc}</span>;
      case "razon_social":
        return (
            <div>
                <p className="font-medium text-slate-900">{item.razon_social}</p>
                <p className="text-xs text-slate-500">{item.email}</p>
            </div>
        );
      case "activo":
        return (
          <Chip size="sm" variant="flat" color={item.activo ? "success" : "danger"}>
            {item.activo ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "acciones":
        return (
          <div className="flex gap-2">
            {CAN_EDIT && (
                <Tooltip content="Editar">
                <span onClick={() => handleEdit(item)} className="cursor-pointer text-slate-400 hover:text-slate-800 p-1">
                    <Edit3 size={18} />
                </span>
                </Tooltip>
            )}
            {CAN_DELETE && (
                <Tooltip content="Eliminar">
                <span onClick={() => handleDelete(item)} className="cursor-pointer text-danger hover:text-danger-400 p-1">
                    <Trash2 size={18} />
                </span>
                </Tooltip>
            )}
          </div>
        );
      default:
        // ✅ CORREGIDO: Acceso seguro sin @ts-ignore
        const val = (item as unknown as Record<string, unknown>)[columnKey as string];
        return <span>{String(val ?? '')}</span>;
    }
  }, [CAN_EDIT, CAN_DELETE]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="text-orange-600" /> Proveedores
          </h1>
          <p className="text-slate-500">Gestión de tus socios comerciales.</p>
        </div>
        {CAN_CREATE && (
          <Button onPress={handleCreate} className="bg-slate-900 text-white shadow-lg" startContent={<Plus size={18} />}>
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <DataTable<Proveedor>
        columns={columns}
        data={sortedItems}
        totalItems={total}
        page={page}
        perPage={PER_PAGE}
        onPageChange={setPage}
        searchQuery={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        isLoading={isLoading}
        renderCell={renderCell}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />

      <ProveedorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        proveedorAEditar={selectedProveedor}
        loading={isSaving}
      />
    </div>
  );
}