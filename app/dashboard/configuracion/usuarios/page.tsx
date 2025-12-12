'use client'

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Chip, Tooltip, useDisclosure, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  SharedSelection 
} from "@heroui/react";
import { Plus, Edit3, Shield, Store, AlertCircle } from "lucide-react";
import { usuariosService } from '@/services/usuarios.service';
import { Usuario, RolOption, LocalOption } from '@/types/usuarios.types';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RolOption[]>([]);
  const [locales, setLocales] = useState<LocalOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
    setModalMode('create');
    setFormData({ nombreCompleto: '', email: '', password: '', rolId: '', localesIds: new Set([]) });
    onOpen();
  };

  const handleOpenEdit = (user: Usuario) => {
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

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
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
      
      onOpenChange(); // HeroUI: llamar sin argumentos cierra si está abierto
      fetchData();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error desconocido");
      }
    }
  };

  // Manejador seguro para selección múltiple
  const handleSelectionChange = (keys: SharedSelection) => {
    // Convertimos el SharedSelection a Set<string> de forma segura
    setFormData({ ...formData, localesIds: new Set(keys as unknown as string[]) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500">Administra el acceso y roles del personal.</p>
        </div>
        <Button onPress={handleOpenCreate} className="bg-slate-900 text-white" endContent={<Plus size={16}/>}>
          Nuevo Usuario
        </Button>
      </div>

      <Table aria-label="Tabla de usuarios">
        <TableHeader>
          <TableColumn>USUARIO</TableColumn>
          <TableColumn>ROL</TableColumn>
          <TableColumn>LOCALES</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay usuarios registrados"} isLoading={isLoading}>
          {usuarios.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-bold text-slate-900">{user.nombreCompleto}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Chip startContent={<Shield size={12}/>} variant="flat" color="warning" size="sm">
                  {user.rol}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {/* CORRECCIÓN: Agregamos '?' antes del .map o usamos (user.locales || []) */}
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
                  
                  {/* Mensaje opcional si no tiene locales */}
                  {(!user.locales || user.locales.length === 0) && (
                    <span className="text-xs text-slate-400 italic">Sin asignar</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Chip color={user.activo ? "success" : "danger"} variant="dot" size="sm">
                  {user.activo ? "Activo" : "Inactivo"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Tooltip content="Editar usuario">
                    <span onClick={() => handleOpenEdit(user)} className="text-lg text-slate-400 cursor-pointer active:opacity-50 hover:text-slate-900">
                      <Edit3 size={18} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Nombre Completo"
                  placeholder="Ej: Juan Perez"
                  variant="bordered"
                  value={formData.nombreCompleto}
                  onValueChange={(val) => setFormData({...formData, nombreCompleto: val})}
                />
                
                {modalMode === 'create' && (
                  <>
                    <Input
                      label="Correo Electrónico"
                      placeholder="correo@empresa.com"
                      variant="bordered"
                      value={formData.email}
                      onValueChange={(val) => setFormData({...formData, email: val})}
                    />
                    <Input
                      label="Contraseña"
                      placeholder="******"
                      type="password"
                      variant="bordered"
                      value={formData.password}
                      onValueChange={(val) => setFormData({...formData, password: val})}
                    />
                  </>
                )}

                <Select 
                    label="Rol" 
                    placeholder="Selecciona un rol"
                    variant="bordered"
                    selectedKeys={formData.rolId ? [formData.rolId] : []}
                    onChange={(e) => setFormData({...formData, rolId: e.target.value})}
                >
                    {roles.map((rol) => (
                        // SOLUCIÓN: Usamos 'key' en lugar de 'value'
                        <SelectItem key={rol.id}>
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
                >
                    {locales.map((local) => (
                        // SOLUCIÓN: Usamos 'key' y textValue para accesibilidad
                        <SelectItem key={local.id} textValue={local.nombre}>
                            <div className="flex gap-2 items-center">
                                <Store size={14}/> 
                                <span>{local.nombre}</span>
                                <span className="text-xs text-slate-400">({local.codigo})</span>
                            </div>
                        </SelectItem>
                    ))}
                </Select>

              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button className="bg-slate-900 text-white" onPress={handleSubmit}>
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