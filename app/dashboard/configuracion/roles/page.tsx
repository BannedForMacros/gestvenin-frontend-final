'use client'

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Chip, Tooltip, useDisclosure, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Input, Checkbox 
} from "@heroui/react";
import { Plus, Shield, Lock, AlertCircle, XCircle } from "lucide-react";
import { rolesService } from '@/services/roles.service';
import { permisosService } from '@/services/permisos.service';
import { Rol } from '@/types/roles.types';
import { Permiso } from '@/types/permisos.types';

// 1. Definimos la forma del error que viene del Backend
interface BackendError {
    message: string;
    error?: string;
    statusCode?: number;
    permisosFaltantes?: string[]; // Esta es la clave
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<'create' | 'permisos'>('create');
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);

  const [nombreRol, setNombreRol] = useState('');
  const [selectedPermisosIds, setSelectedPermisosIds] = useState<Set<number>>(new Set());

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
    setError(null);
    setModalMode('create');
    setNombreRol('');
    onOpen();
  };

  const handleOpenPermisos = (rol: Rol) => {
    setError(null);
    setModalMode('permisos');
    setSelectedRol(rol);
    const currentIds = new Set(
      rol.rolPermisos
        ?.filter(rp => rp.activo)
        .map(rp => rp.permiso.id)
    );
    setSelectedPermisosIds(currentIds);
    onOpen();
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (modalMode === 'create') {
        if(!nombreRol.trim()) throw { message: "El nombre del rol es obligatorio." }; // Lanzamos objeto para ser consistente
        await rolesService.create({ nombre: nombreRol });
      } else if (modalMode === 'permisos' && selectedRol) {
        await rolesService.assignPermisos(selectedRol.id, {
          permisosIds: Array.from(selectedPermisosIds)
        });
      }
      onOpenChange(); 
      fetchData();    
    } catch (err: unknown) { // 2. Usamos unknown en lugar de any
      
      // 3. Convertimos 'err' a nuestra interfaz BackendError
      // Esto satisface a ESLint y nos da autocompletado
      const errorData = err as BackendError; 

      let mensaje = "Ocurrió un error inesperado.";

      // Lógica para detectar permisos faltantes
      if (errorData.permisosFaltantes && Array.isArray(errorData.permisosFaltantes)) {
        const faltantes = errorData.permisosFaltantes.join(', ');
        mensaje = `Acceso denegado. Te faltan los permisos: ${faltantes}`;
      } 
      else if (errorData.message) {
         mensaje = errorData.message;
         if(mensaje === "No tienes permisos para esta acción" && !errorData.permisosFaltantes) {
            mensaje = "No tienes permisos suficientes para realizar esta acción.";
         }
      }

      setError(mensaje);
    }
  };

  const groupedPermisos = allPermisos.reduce((acc, curr) => {
    if (!acc[curr.modulo]) acc[curr.modulo] = [];
    acc[curr.modulo].push(curr);
    return acc;
  }, {} as Record<string, Permiso[]>);

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
    <div className="space-y-8 p-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Roles</h1>
          <p className="text-base text-slate-500 mt-1">Crea perfiles y asigna permisos de acceso.</p>
        </div>
        
        <Button 
          onPress={handleOpenCreate} 
          color="success" 
          variant="flat"
          className="font-medium text-base" 
          endContent={<Plus size={20}/>}
          size="lg"
        >
          Nuevo Rol
        </Button>
      </div>

      <Table aria-label="Tabla de roles" className="text-base">
        <TableHeader>
          <TableColumn className="text-sm uppercase font-bold">ROL</TableColumn>
          <TableColumn className="text-sm uppercase font-bold">PERMISOS ASIGNADOS</TableColumn>
          <TableColumn className="text-sm uppercase font-bold">TIPO</TableColumn>
          <TableColumn className="text-sm uppercase font-bold" align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay roles registrados"} isLoading={isLoading}>
          {roles.map((rol) => (
            <TableRow key={rol.id} className="h-14"> 
              <TableCell>
                <div className="flex items-center gap-3">
                    <Shield size={22} className="text-orange-600"/>
                    <span className="font-bold text-base text-slate-800">{rol.nombre}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap max-w-xs">
                    {(rol.rolPermisos || []).length > 0 ? (
                        <span className="text-sm text-slate-600 font-medium">
                            {rol.rolPermisos.length} permisos activos
                        </span>
                    ) : (
                        <span className="text-sm text-slate-400 italic">Sin permisos</span>
                    )}
                </div>
              </TableCell>
              <TableCell>
                {rol.esSistema ? (
                    <Chip color="secondary" variant="flat" size="md" className="text-sm">Sistema</Chip>
                ) : (
                    <Chip color="default" variant="flat" size="md" className="text-sm">Personalizado</Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Tooltip content="Gestionar Permisos">
                    <span 
                        onClick={() => handleOpenPermisos(rol)} 
                        className="text-slate-400 cursor-pointer active:opacity-50 hover:text-orange-600 transition-colors p-2"
                    >
                      <Lock size={22} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        placement="top-center"
        size={modalMode === 'permisos' ? '3xl' : 'lg'} 
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-2xl font-bold">
                    {modalMode === 'create' ? 'Crear Nuevo Rol' : `Permisos de: ${selectedRol?.nombre}`}
                </span>
              </ModalHeader>
              
              <ModalBody>
                {error && (
                    <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl flex items-start gap-3 border border-danger-100 mb-2">
                        <AlertCircle className="shrink-0 mt-0.5" size={20}/>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Error de Permisos</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-danger-400 hover:text-danger-700">
                            <XCircle size={18}/>
                        </button>
                    </div>
                )}

                {modalMode === 'create' ? (
                  <div className="py-4">
                      <Input
                        autoFocus
                        label="Nombre del Rol"
                        placeholder="Ej: Cajero Turno Tarde"
                        variant="bordered"
                        value={nombreRol}
                        onValueChange={setNombreRol}
                        classNames={{
                            label: "text-base",
                            input: "text-base"
                        }}
                        size="lg"
                      />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedPermisos).map(([modulo, items]) => (
                      <div key={modulo} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 capitalize">
                                {modulo}
                            </h4>
                            <Button size="sm" variant="light" color="primary" onPress={() => toggleModulo(modulo)} className="text-base">
                                Seleccionar todo
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {items.map((permiso) => (
                                <Checkbox 
                                    key={permiso.id}
                                    isSelected={selectedPermisosIds.has(permiso.id)}
                                    onValueChange={() => togglePermiso(permiso.id)}
                                    size="lg" 
                                    classNames={{ 
                                        label: "text-base text-slate-700 font-medium" 
                                    }}
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

              <ModalFooter className="py-4">
                <Button 
                    color="danger" 
                    variant="flat" 
                    onPress={onClose}
                    size="lg"
                    className="font-medium text-base"
                >
                  Cancelar
                </Button>
                
                <Button 
                    color="success" 
                    variant="flat" 
                    onPress={handleSubmit}
                    size="lg"
                    className="font-bold text-base px-8 border-1 border-success-200"
                >
                  {modalMode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}