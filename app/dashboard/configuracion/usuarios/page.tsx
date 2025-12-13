'use client'

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Chip, Tooltip, useDisclosure, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  SharedSelection 
} from "@heroui/react";
import { Plus, Edit3, Shield, Store, AlertCircle, XCircle } from "lucide-react";
import { usuariosService } from '@/services/usuarios.service';
import { Usuario, RolOption, LocalOption } from '@/types/usuarios.types';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [locales, setLocales] = useState<LocalOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para manejar errores amigables
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    rolId: '',
    localesIds: new Set<string>([])
  });

  const fetchData = async () => {
    try {
      const [usersData, rolesData, localesData] = await Promise.all([
        usuariosService.getAll(),
        usuariosService.getRoles(),
        usuariosService.getLocales()
      ]);
      setUsuarios(usersData);
      setRoles(rolesData);
      setLocales(localesData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setError(null);
    setModalMode('create');
    setFormData({ nombreCompleto: '', email: '', password: '', rolId: '', localesIds: new Set([]) });
    onOpen();
  };

  const handleOpenEdit = (user: Usuario) => {
    setError(null);
    setModalMode('edit');
    setSelectedUser(user);
    const currentLocales = new Set(user.locales.map(l => l.id.toString()));
    
    setFormData({
      nombreCompleto: user.nombreCompleto,
      email: user.email,
      password: '',
      rolId: user.rolId ? user.rolId.toString() : '',
      localesIds: currentLocales
    });
    onOpen();
  };

  // --- LÓGICA DE ENVÍO Y TRADUCCIÓN DE ERRORES MEJORADA ---
  const handleSubmit = async () => {
    setError(null);
    try {
      // 1. Validaciones manuales básicas en el Frontend
      if (!formData.nombreCompleto) throw new Error("El nombre completo es obligatorio.");
      if (!formData.rolId) throw new Error("Debes seleccionar un rol para el usuario.");

      if (modalMode === 'create') {
        if (!formData.email) throw new Error("El correo electrónico es obligatorio.");
        if (!formData.password) throw new Error("La contraseña es obligatoria.");
        
        const newUser = await usuariosService.create({
            email: formData.email,
            password: formData.password,
            nombreCompleto: formData.nombreCompleto,
            rolId: Number(formData.rolId),
            localesIds: Array.from(formData.localesIds).map(Number)
        });
        if (formData.localesIds.size > 0) {
            await usuariosService.assignLocales(newUser.id, Array.from(formData.localesIds).map(Number));
        }
      } else if (modalMode === 'edit' && selectedUser) {
        await usuariosService.update(selectedUser.id, {
            nombreCompleto: formData.nombreCompleto,
            rolId: Number(formData.rolId)
        });
        await usuariosService.assignLocales(selectedUser.id, Array.from(formData.localesIds).map(Number));
      }
      
      onOpenChange(); 
      fetchData();
    } catch (error: unknown) {
      // 2. Traducción de errores del Backend (Backend devuelve mensajes en inglés como "email must be an email")
      let mensaje = "Ocurrió un error inesperado.";
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase(); // Convertimos a minúsculas para facilitar la búsqueda

        if (errorMsg.includes("unique constraint") || errorMsg.includes("already exists")) {
            mensaje = "Este correo electrónico ya está registrado en el sistema.";
        } 
        else if (errorMsg.includes("email must be an email") || errorMsg.includes("invalid email")) {
            mensaje = "Por favor, ingresa un correo electrónico válido (ej: usuario@empresa.com).";
        }
        else if (errorMsg.includes("password")) {
            mensaje = "La contraseña es demasiado débil o corta.";
        }
        else if (errorMsg.includes("empty")) {
            mensaje = "Por favor completa todos los campos obligatorios.";
        }
        else {
            // Si no es ninguno conocido, mostramos el mensaje original pero intentamos limpiarlo si es un array
            mensaje = error.message; 
        }
      }
      
      setError(mensaje); // Mostramos la alerta roja traducida
    }
  };

  const handleSelectionChange = (keys: SharedSelection) => {
    setFormData({ ...formData, localesIds: new Set(keys as unknown as string[]) });
  };

  return (
    <div className="space-y-8 p-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-base text-slate-500 mt-1">Administra el acceso y roles del personal.</p>
        </div>
        <Button 
            onPress={handleOpenCreate} 
            color="success" 
            variant="flat" 
            className="font-medium text-base"
            endContent={<Plus size={20}/>}
            size="lg"
        >
          Nuevo Usuario
        </Button>
      </div>

      <Table aria-label="Tabla de usuarios" className="text-base">
        <TableHeader>
          <TableColumn className="uppercase font-bold text-sm">USUARIO</TableColumn>
          <TableColumn className="uppercase font-bold text-sm">ROL</TableColumn>
          <TableColumn className="uppercase font-bold text-sm">LOCALES</TableColumn>
          <TableColumn className="uppercase font-bold text-sm">ESTADO</TableColumn>
          <TableColumn className="uppercase font-bold text-sm" align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay usuarios registrados"} isLoading={isLoading}>
          {usuarios.map((user) => (
            <TableRow key={user.id} className="h-14">
              <TableCell>
                <div>
                  <p className="font-bold text-base text-slate-900">{user.nombreCompleto}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Chip startContent={<Shield size={14}/>} variant="flat" color="warning" size="md" className="pl-1 text-sm">
                  {user.rol}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap max-w-xs">
                  {user.locales?.map((l) => (
                    <Chip 
                      key={l.id} 
                      size="sm" 
                      variant="bordered" 
                      className="border-slate-300 text-slate-600"
                    >
                      {l.nombre}
                    </Chip>
                  ))}
                  {(!user.locales || user.locales.length === 0) && (
                    <span className="text-sm text-slate-400 italic">Sin asignar</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Chip color={user.activo ? "success" : "danger"} variant="dot" size="md" className="border-none gap-1">
                  {user.activo ? "Activo" : "Inactivo"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Tooltip content="Editar usuario">
                    <span 
                        onClick={() => handleOpenEdit(user)} 
                        className="text-slate-400 cursor-pointer active:opacity-50 hover:text-slate-900 p-2"
                    >
                      <Edit3 size={20} />
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
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-2xl font-bold">
                    {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                </span>
              </ModalHeader>
              
              <ModalBody>
                {/* ALERTA DE ERROR VISUAL */}
                {error && (
                    <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-xl flex items-start gap-3 border border-danger-100 mb-2">
                        <AlertCircle className="shrink-0 mt-0.5" size={20}/>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Atención:</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-danger-400 hover:text-danger-700">
                            <XCircle size={18}/>
                        </button>
                    </div>
                )}

                <Input
                  autoFocus
                  label="Nombre Completo"
                  placeholder="Ej: Juan Perez"
                  variant="bordered"
                  value={formData.nombreCompleto}
                  onValueChange={(val) => setFormData({...formData, nombreCompleto: val})}
                  size="lg"
                  classNames={{ label: "text-base", input: "text-base" }}
                />
                
                {modalMode === 'create' && (
                  <>
                    <Input
                      label="Correo Electrónico"
                      placeholder="correo@empresa.com"
                      variant="bordered"
                      value={formData.email}
                      onValueChange={(val) => setFormData({...formData, email: val})}
                      size="lg"
                      classNames={{ label: "text-base", input: "text-base" }}
                    />
                    <Input
                      label="Contraseña"
                      placeholder="******"
                      type="password"
                      variant="bordered"
                      value={formData.password}
                      onValueChange={(val) => setFormData({...formData, password: val})}
                      size="lg"
                      classNames={{ label: "text-base", input: "text-base" }}
                    />
                  </>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <Select 
                        label="Rol" 
                        placeholder="Selecciona un rol"
                        variant="bordered"
                        selectedKeys={formData.rolId ? [formData.rolId] : []}
                        onChange={(e) => setFormData({...formData, rolId: e.target.value})}
                        size="lg"
                        classNames={{ label: "text-base", value: "text-base" }}
                    >
                        {roles.map((rol) => (
                            <SelectItem key={rol.id} textValue={rol.nombre}>
                                {rol.nombre}
                            </SelectItem>
                        ))}
                    </Select>

                    <Select
                        label="Locales Asignados"
                        selectionMode="multiple"
                        placeholder="Selecciona locales"
                        variant="bordered"
                        selectedKeys={formData.localesIds}
                        onSelectionChange={handleSelectionChange}
                        size="lg"
                        classNames={{ label: "text-base", value: "text-base" }}
                    >
                        {locales.map((local) => (
                            <SelectItem key={local.id} textValue={local.nombre}>
                                <div className="flex gap-2 items-center">
                                    <Store size={16}/> 
                                    <span className="text-base">{local.nombre}</span>
                                    <span className="text-sm text-slate-400">({local.codigo})</span>
                                </div>
                            </SelectItem>
                        ))}
                    </Select>
                </div>

              </ModalBody>
              <ModalFooter className="py-4">
                <Button 
                    color="danger" 
                    variant="flat" 
                    onPress={onClose}
                    size="lg"
                    className="text-base font-medium"
                >
                  Cancelar
                </Button>
                
                <Button 
                    color="success" 
                    variant="flat" 
                    onPress={handleSubmit}
                    size="lg"
                    className="text-base font-bold border-1 border-success-200"
                >
                  {modalMode === 'create' ? 'Guardar' : 'Actualizar'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}