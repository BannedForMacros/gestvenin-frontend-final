'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Chip, Tooltip, useDisclosure, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Input, Checkbox, ScrollShadow
} from "@heroui/react";
import { Plus, Shield, Lock, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";

import { rolesService } from '@/services/roles.service';
import { permisosService } from '@/services/permisos.service';
import { Rol, CreateRolDto } from '@/types/roles.types';
import { Permiso } from '@/types/permisos.types';

export default function RolesPage() {
  // --- ESTADOS ---
  const [roles, setRoles] = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del Modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<'create' | 'permisos'>('create');
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);

  // Estados de Formulario
  const [nombreRol, setNombreRol] = useState('');
  const [selectedPermisosIds, setSelectedPermisosIds] = useState<Set<number>>(new Set());

  // --- 1. CARGA DE DATOS ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesData, permisosData] = await Promise.all([
        rolesService.getAll(),
        permisosService.getAll()
      ]);
      setRoles(rolesData);
      setAllPermisos(permisosData);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error al cargar datos del sistema");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. LÓGICA DINÁMICA (Agrupación) ---
  const groupedPermisos = useMemo(() => {
    return allPermisos.reduce((acc, curr) => {
      if (!acc[curr.modulo]) acc[curr.modulo] = [];
      acc[curr.modulo].push(curr);
      return acc;
    }, {} as Record<string, Permiso[]>);
  }, [allPermisos]);

  // --- MANEJADORES ---

  const handleOpenCreate = () => {
    setModalMode('create');
    setNombreRol('');
    onOpen();
  };

  const handleOpenPermisos = (rol: Rol) => {
    setModalMode('permisos');
    setSelectedRol(rol);
    // Cargar permisos actuales del rol
    const currentIds = new Set(
      rol.rolPermisos?.filter(rp => rp.activo).map(rp => rp.permiso.id)
    );
    setSelectedPermisosIds(currentIds);
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
        if (!nombreRol.trim()) {
            toast.warning("El nombre del rol es obligatorio");
            return;
        }
        
        // ✅ Uso estricto del DTO
        const nuevoRol: CreateRolDto = { nombre: nombreRol };
        await rolesService.create(nuevoRol);
        toast.success("Rol creado correctamente");

      } else if (modalMode === 'permisos' && selectedRol) {
        await rolesService.assignPermisos(selectedRol.id, {
          permisosIds: Array.from(selectedPermisosIds)
        });
        toast.success("Permisos actualizados correctamente");
      }

      onOpenChange(); // Cerrar modal
      fetchData();    // Recargar datos
    } catch (error: unknown) {
      // ✅ Manejo de errores sin 'any'
      if (error instanceof Error) {
        toast.error(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(String((error as { message: unknown }).message));
      } else {
        toast.error("Ocurrió un error inesperado");
      }
    }
  };

  // --- LÓGICA DE CHECKBOXES ---

  const togglePermiso = (id: number) => {
    const newSet = new Set(selectedPermisosIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPermisosIds(newSet);
  };

  const toggleModulo = (modulo: string) => {
    const permisosDelModulo = groupedPermisos[modulo];
    const idsDelModulo = permisosDelModulo.map(p => p.id);
    const todosSeleccionados = idsDelModulo.every(id => selectedPermisosIds.has(id));

    const newSet = new Set(selectedPermisosIds);
    if (todosSeleccionados) {
      idsDelModulo.forEach(id => newSet.delete(id));
    } else {
      idsDelModulo.forEach(id => newSet.add(id));
    }
    setSelectedPermisosIds(newSet);
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Roles</h1>
          <p className="text-slate-500">Administra los perfiles de acceso.</p>
        </div>
        <div className="flex gap-2">
            <Button isIconOnly variant="light" onPress={fetchData} title="Recargar datos">
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""}/>
            </Button>
            <Button onPress={handleOpenCreate} className="bg-slate-900 text-white" startContent={<Plus size={20}/>}>
              Nuevo Rol
            </Button>
        </div>
      </div>

      {/* Tabla */}
      <Table aria-label="Tabla de roles">
        <TableHeader>
          <TableColumn>ROL</TableColumn>
          <TableColumn>PERMISOS</TableColumn>
          <TableColumn>TIPO</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={roles} emptyContent={"No hay roles registrados"} isLoading={isLoading}>
          {(rol) => (
            <TableRow key={rol.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <Shield size={18} />
                    </div>
                    <span className="font-bold text-slate-700">{rol.nombre}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                    <Chip size="sm" variant="flat" color="warning">
                        {(rol.rolPermisos?.filter(p => p.activo).length || 0)} permisos
                    </Chip>
                </div>
              </TableCell>
              <TableCell>
                {rol.esSistema ? (
                    <Chip color="secondary" variant="dot" size="sm">Sistema</Chip>
                ) : (
                    <Chip color="success" variant="dot" size="sm">Personalizado</Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Tooltip content="Gestionar Permisos">
                    <span onClick={() => handleOpenPermisos(rol)} className="text-slate-400 cursor-pointer hover:text-slate-800 p-2">
                      <Lock size={20} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* MODAL DINÁMICO */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size={modalMode === 'permisos' ? '4xl' : 'md'} 
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                 <span className="text-xl font-bold">
                    {modalMode === 'create' ? 'Crear Nuevo Rol' : `Configurar Permisos: ${selectedRol?.nombre}`}
                 </span>
              </ModalHeader>
              
              <ModalBody>
                {modalMode === 'create' ? (
                  <div className="py-4">
                      <Input
                        autoFocus
                        label="Nombre del Rol"
                        placeholder="Ej: Supervisor de Caja"
                        variant="bordered"
                        value={nombreRol}
                        onValueChange={setNombreRol}
                      />
                  </div>
                ) : (
                  // --- SECCIÓN DINÁMICA DE PERMISOS ---
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                    {Object.keys(groupedPermisos).length === 0 && <p className="text-slate-500">Cargando catálogo...</p>}
                    
                    {Object.entries(groupedPermisos).map(([modulo, items]) => (
                      <div key={modulo} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        
                        {/* Cabecera del Módulo */}
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-slate-500"/>
                                <span className="font-bold text-slate-700">{modulo}</span>
                            </div>
                            <Button size="sm" variant="light" color="primary" onPress={() => toggleModulo(modulo)}>
                                {items.every(p => selectedPermisosIds.has(p.id)) ? 'Desmarcar' : 'Todos'}
                            </Button>
                        </div>

                        {/* Lista de Permisos */}
                        <div className="p-4 grid grid-cols-1 gap-3">
                            {items.map((permiso) => (
                                <Checkbox 
                                    key={permiso.id}
                                    isSelected={selectedPermisosIds.has(permiso.id)}
                                    onValueChange={() => togglePermiso(permiso.id)}
                                    classNames={{ label: "text-sm text-slate-600" }}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">{permiso.nombre}</span>
                                        <span className="text-xs text-slate-400">{permiso.descripcion || permiso.codigo}</span>
                                    </div>
                                </Checkbox>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button className="bg-slate-900 text-white" onPress={handleSubmit}>
                  {modalMode === 'create' ? 'Crear Rol' : 'Guardar Permisos'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}