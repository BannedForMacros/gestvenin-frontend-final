'use client'

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Chip, Tooltip, useDisclosure, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Input, Checkbox, Divider, ScrollShadow 
} from "@heroui/react";
import { Plus, Shield, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { rolesService } from '@/services/roles.service';
import { permisosService } from '@/services/permisos.service';
import { Rol } from '@/types/roles.types';
import { Permiso } from '@/types/permisos.types';

export default function RolesPage() {
  // Datos
  const [roles, setRoles] = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<'create' | 'permisos'>('create');
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);

  // Estados de Formulario
  const [nombreRol, setNombreRol] = useState('');
  const [selectedPermisosIds, setSelectedPermisosIds] = useState<Set<number>>(new Set());

  // Carga inicial
  const fetchData = async () => {
    try {
      const [rolesData, permisosData] = await Promise.all([
        rolesService.getAll(),
        permisosService.getAll()
      ]);
      setRoles(rolesData);
      setAllPermisos(permisosData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- MANEJADORES ---

  const handleOpenCreate = () => {
    setModalMode('create');
    setNombreRol('');
    onOpen();
  };

  const handleOpenPermisos = (rol: Rol) => {
    setModalMode('permisos');
    setSelectedRol(rol);
    // Extraemos los IDs de los permisos activos que tiene el rol
    const currentIds = new Set(
      rol.rolPermisos
        ?.filter(rp => rp.activo) // Solo los activos
        .map(rp => rp.permiso.id)
    );
    setSelectedPermisosIds(currentIds);
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
        await rolesService.create({ nombre: nombreRol });
      } else if (modalMode === 'permisos' && selectedRol) {
        await rolesService.assignPermisos(selectedRol.id, {
          permisosIds: Array.from(selectedPermisosIds)
        });
      }
      onOpenChange(); // Cerrar modal
      fetchData();    // Recargar datos
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message);
    }
  };

  // Agrupamos permisos para el modal de selección
  const groupedPermisos = allPermisos.reduce((acc, curr) => {
    if (!acc[curr.modulo]) acc[curr.modulo] = [];
    acc[curr.modulo].push(curr);
    return acc;
  }, {} as Record<string, Permiso[]>);

  // Manejo de checkbox individual
  const togglePermiso = (id: number) => {
    const newSet = new Set(selectedPermisosIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPermisosIds(newSet);
  };

  // Manejo de "Seleccionar todo el módulo"
  const toggleModulo = (modulo: string) => {
    const permisosDelModulo = groupedPermisos[modulo];
    const idsDelModulo = permisosDelModulo.map(p => p.id);
    const todosSeleccionados = idsDelModulo.every(id => selectedPermisosIds.has(id));

    const newSet = new Set(selectedPermisosIds);
    if (todosSeleccionados) {
      // Desmarcar todos
      idsDelModulo.forEach(id => newSet.delete(id));
    } else {
      // Marcar todos
      idsDelModulo.forEach(id => newSet.add(id));
    }
    setSelectedPermisosIds(newSet);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Roles</h1>
          <p className="text-slate-500">Crea perfiles y asigna permisos de acceso.</p>
        </div>
        <Button onPress={handleOpenCreate} className="bg-slate-900 text-white" endContent={<Plus size={16}/>}>
          Nuevo Rol
        </Button>
      </div>

      <Table aria-label="Tabla de roles">
        <TableHeader>
          <TableColumn>ROL</TableColumn>
          <TableColumn>PERMISOS ASIGNADOS</TableColumn>
          <TableColumn>TIPO</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay roles registrados"} isLoading={isLoading}>
          {roles.map((rol) => (
            <TableRow key={rol.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Shield size={18} className="text-orange-600"/>
                    <span className="font-bold text-slate-900">{rol.nombre}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap max-w-xs">
                    {/* Programación defensiva con ?. */}
                    {(rol.rolPermisos || []).length > 0 ? (
                        <span className="text-sm text-slate-600">
                            {rol.rolPermisos.length} permisos activos
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Sin permisos</span>
                    )}
                </div>
              </TableCell>
              <TableCell>
                {rol.esSistema ? (
                    <Chip color="secondary" variant="flat" size="sm">Sistema</Chip>
                ) : (
                    <Chip color="default" variant="flat" size="sm">Personalizado</Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Tooltip content="Gestionar Permisos">
                    <span 
                        onClick={() => handleOpenPermisos(rol)} 
                        className="text-lg text-slate-400 cursor-pointer active:opacity-50 hover:text-orange-600 transition-colors"
                    >
                      <Lock size={18} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL (Reutilizable para Crear y Permisos) */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        placement="top-center"
        size={modalMode === 'permisos' ? '2xl' : 'md'}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {modalMode === 'create' ? 'Crear Nuevo Rol' : `Permisos de: ${selectedRol?.nombre}`}
              </ModalHeader>
              
              <ModalBody>
                {modalMode === 'create' ? (
                  // --- MODO CREAR ---
                  <Input
                    autoFocus
                    label="Nombre del Rol"
                    placeholder="Ej: Cajero Turno Tarde"
                    variant="bordered"
                    value={nombreRol}
                    onValueChange={setNombreRol}
                  />
                ) : (
                  // --- MODO PERMISOS ---
                  <div className="space-y-6">
                    {Object.entries(groupedPermisos).map(([modulo, items]) => (
                      <div key={modulo} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                {modulo}
                            </h4>
                            <Button size="sm" variant="light" color="primary" onPress={() => toggleModulo(modulo)}>
                                Seleccionar todo
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map((permiso) => (
                                <Checkbox 
                                    key={permiso.id}
                                    isSelected={selectedPermisosIds.has(permiso.id)}
                                    onValueChange={() => togglePermiso(permiso.id)}
                                    classNames={{ label: "text-small text-slate-600" }}
                                >
                                    {permiso.nombre}
                                </Checkbox>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
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