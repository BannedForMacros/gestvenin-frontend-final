'use client'

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Chip, Tooltip, useDisclosure, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, Input, Switch
} from "@heroui/react";
import { Plus, Edit3, MapPin, Phone, Store, Utensils } from "lucide-react";
import { localesService } from '@/services/locales.service';
import { Local } from '@/types/locales.types';

export default function LocalesPage() {
  const [locales, setLocales] = useState<Local[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
    tieneMesas: false
  });

  const fetchData = async () => {
    try {
      const data = await localesService.getAll();
      setLocales(data);
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
    setFormData({ nombre: '', codigo: '', direccion: '', telefono: '', tieneMesas: false });
    onOpen();
  };

  const handleOpenEdit = (local: Local) => {
    setModalMode('edit');
    setSelectedLocal(local);
    setFormData({
      nombre: local.nombre,
      codigo: local.codigo,
      direccion: local.direccion || '',
      telefono: local.telefono || '',
      tieneMesas: local.tieneMesas
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
        await localesService.create({
          nombre: formData.nombre,
          codigo: formData.codigo,
          tieneMesas: formData.tieneMesas,
          direccion: formData.direccion || undefined,
          telefono: formData.telefono || undefined
        });
      } else if (modalMode === 'edit' && selectedLocal) {
        await localesService.update(selectedLocal.id, {
          nombre: formData.nombre,
          codigo: formData.codigo,
          tieneMesas: formData.tieneMesas,
          direccion: formData.direccion || undefined,
          telefono: formData.telefono || undefined
        });
      }
      onOpenChange(); // Cerrar modal
      fetchData();    // Recargar tabla
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error desconocido");
      }
    }
  };

  return (
    <div className="space-y-8 p-2">
      <div className="flex justify-between items-center">
        <div>
          {/* Tamaño intermedio text-3xl (antes era 2xl) para título principal */}
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Locales</h1>
          <p className="text-base text-slate-500 mt-1">Configura tus sucursales y puntos de venta.</p>
        </div>
        <Button 
            onPress={handleOpenCreate} 
            className="bg-slate-900 text-white font-medium text-base"
            endContent={<Plus size={18}/>}
            size="lg" // Botón grande, pero texto base
        >
          Nuevo Local
        </Button>
      </div>

      <Table aria-label="Tabla de locales">
        <TableHeader>
          <TableColumn className="uppercase font-bold text-sm">NOMBRE / CÓDIGO</TableColumn>
          <TableColumn className="uppercase font-bold text-sm">UBICACIÓN</TableColumn>
          <TableColumn className="uppercase font-bold text-sm">CONFIGURACIÓN</TableColumn>
          <TableColumn className="uppercase font-bold text-sm" align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No hay locales registrados"} isLoading={isLoading}>
          {locales.map((local) => (
            <TableRow key={local.id} className="h-12">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Store size={22} />
                  </div>
                  <div>
                    {/* text-base: Intermedio entre el normal (sm) y el gigante (lg) */}
                    <p className="font-bold text-base text-slate-900">{local.nombre}</p>
                    <Chip size="sm" variant="flat" className="mt-1 bg-slate-100 text-slate-500 font-medium">
                      {local.codigo}
                    </Chip>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {local.direccion ? (
                    <div className="flex items-center gap-2 text-base text-slate-600">
                      <MapPin size={16} className="text-slate-400" /> 
                      {local.direccion}
                    </div>
                  ) : <span className="text-slate-400 text-sm italic">Sin dirección</span>}
                  
                  {local.telefono && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone size={14} /> {local.telefono}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {local.tieneMesas ? (
                  <Chip startContent={<Utensils size={14} />} color="success" variant="flat" size="md" className="pl-1">
                    Mesas Habilitadas
                  </Chip>
                ) : (
                  <Chip color="default" variant="flat" size="md">
                    Solo Para Llevar
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Tooltip content="Editar local">
                    <span onClick={() => handleOpenEdit(local)} className="text-slate-400 cursor-pointer active:opacity-50 hover:text-slate-900 p-2">
                      <Edit3 size={20} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        placement="top-center"
        size="lg" // Modal un poco más amplio
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                 <span className="text-2xl font-bold">
                    {modalMode === 'create' ? 'Crear Nuevo Local' : 'Editar Local'}
                 </span>
              </ModalHeader>
              <ModalBody>
                <div className="flex gap-4">
                  <Input
                    autoFocus
                    label="Nombre"
                    placeholder="Ej: Sede Principal"
                    variant="bordered"
                    className="flex-1"
                    value={formData.nombre}
                    onValueChange={(val) => setFormData({...formData, nombre: val})}
                    // Ajuste de tamaño intermedio en Inputs
                    size="lg"
                    classNames={{ label: "text-base", input: "text-base" }}
                  />
                  <Input
                    label="Código"
                    placeholder="Ej: SED-01"
                    variant="bordered"
                    className="w-1/3"
                    value={formData.codigo}
                    onValueChange={(val) => setFormData({...formData, codigo: val})}
                    size="lg"
                    classNames={{ label: "text-base", input: "text-base" }}
                  />
                </div>
                
                <Input
                  label="Dirección"
                  placeholder="Av. Larco 123..."
                  variant="bordered"
                  startContent={<MapPin className="text-slate-400 w-5 h-5" />}
                  value={formData.direccion}
                  onValueChange={(val) => setFormData({...formData, direccion: val})}
                  size="lg"
                  classNames={{ label: "text-base", input: "text-base" }}
                />
                
                <Input
                  label="Teléfono"
                  placeholder="044-123456"
                  variant="bordered"
                  startContent={<Phone className="text-slate-400 w-5 h-5" />}
                  value={formData.telefono}
                  onValueChange={(val) => setFormData({...formData, telefono: val})}
                  size="lg"
                  classNames={{ label: "text-base", input: "text-base" }}
                />

                <div className="flex justify-between items-center py-3 px-1 border-t border-slate-100 mt-2">
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-slate-900">Habilitar Gestión de Mesas</span>
                    <span className="text-sm text-slate-500">Activa si este local atiende en salón</span>
                  </div>
                  <Switch 
                    isSelected={formData.tieneMesas} 
                    onValueChange={(isSelected) => setFormData({...formData, tieneMesas: isSelected})}
                    color="warning"
                    size="lg" // Switch más cómodo de clickear
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                    color="danger" 
                    variant="flat" 
                    onPress={onClose}
                    size="lg"
                    className="text-base font-medium"
                >
                  Cancelar
                </Button>
                {/* BOTÓN SUCCESS FLAT SOLICITADO */}
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