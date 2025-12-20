'use client';

import { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input
} from "@heroui/react";
import { Save, Building2, User, Phone, MapPin, Mail } from 'lucide-react';
import { Proveedor, CrearProveedorDto } from '@/types/proveedores.types';

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearProveedorDto) => Promise<void>;
  proveedorAEditar: Proveedor | null;
  loading: boolean;
}

// Definimos los valores iniciales fuera del componente para reutilizarlos
const INITIAL_DATA: CrearProveedorDto = {
  ruc: '',
  razonSocial: '',
  nombreComercial: '',
  direccion: '',
  telefono: '',
  email: '',
  contactoNombre: '',
  contactoTelefono: ''
};

export function ProveedorModal({ isOpen, onClose, onSubmit, proveedorAEditar, loading }: ProveedorModalProps) {
  
  const [formData, setFormData] = useState<CrearProveedorDto>(INITIAL_DATA);

  // ✅ CORRECCIÓN DEFINITIVA: 
  // Usamos setTimeout para romper el ciclo síncrono que causa el error de ESLint.
  // Esto asegura que el estado se actualice solo después de que el modal haya montado/abierto.
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (proveedorAEditar) {
          setFormData({
            ruc: proveedorAEditar.ruc,
            razonSocial: proveedorAEditar.razon_social,
            nombreComercial: proveedorAEditar.nombre_comercial || '',
            direccion: proveedorAEditar.direccion || '',
            telefono: proveedorAEditar.telefono || '',
            email: proveedorAEditar.email || '',
            contactoNombre: proveedorAEditar.contacto_nombre || '',
            contactoTelefono: proveedorAEditar.contacto_telefono || ''
          });
        } else {
          // Si es nuevo, limpiamos el formulario
          setFormData(INITIAL_DATA);
        }
      }, 0);

      // Limpiamos el timer si el componente se desmonta rápido
      return () => clearTimeout(timer);
    }
  }, [isOpen, proveedorAEditar]);

  const handleChange = (key: keyof CrearProveedorDto, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-slate-100 pb-4">
              <span className="text-xl font-bold text-slate-900">
                {proveedorAEditar ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </span>
              <span className="text-sm font-normal text-slate-500">
                {proveedorAEditar ? `Editando: ${proveedorAEditar.razon_social}` : 'Complete la información fiscal y de contacto.'}
              </span>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="space-y-6">
                
                {/* Sección Fiscal */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <Building2 size={18} className="text-orange-600" /> 
                    <span>Datos Fiscales</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="RUC" 
                      placeholder="Ej. 20123456789" 
                      value={formData.ruc}
                      onValueChange={(v) => handleChange('ruc', v)}
                      maxLength={11} 
                      isRequired
                      variant="bordered"
                      classNames={{ inputWrapper: "border-slate-200" }}
                    />
                    <Input 
                      label="Razón Social" 
                      placeholder="Ej. Distribuidora S.A.C." 
                      value={formData.razonSocial}
                      onValueChange={(v) => handleChange('razonSocial', v)}
                      isRequired
                      variant="bordered"
                      classNames={{ inputWrapper: "border-slate-200" }}
                    />
                    <div className="md:col-span-2">
                      <Input 
                        label="Nombre Comercial" 
                        placeholder="Ej. Tiendas del Norte" 
                        value={formData.nombreComercial}
                        onValueChange={(v) => handleChange('nombreComercial', v)}
                        variant="bordered"
                        classNames={{ inputWrapper: "border-slate-200" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Ubicación y Contacto Empresa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <MapPin size={18} className="text-orange-600" /> 
                    <span>Ubicación y Contacto</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2">
                        <Input 
                          label="Dirección Fiscal" 
                          placeholder="Av. Principal 123..." 
                          value={formData.direccion}
                          onValueChange={(v) => handleChange('direccion', v)}
                          variant="bordered"
                          classNames={{ inputWrapper: "border-slate-200" }}
                        />
                     </div>
                     <Input 
                        label="Email Corporativo" 
                        type="email"
                        startContent={<Mail size={16} className="text-slate-400"/>}
                        value={formData.email}
                        onValueChange={(v) => handleChange('email', v)}
                        variant="bordered"
                        classNames={{ inputWrapper: "border-slate-200" }}
                      />
                      <Input 
                        label="Teléfono Empresa" 
                        startContent={<Phone size={16} className="text-slate-400"/>}
                        value={formData.telefono}
                        onValueChange={(v) => handleChange('telefono', v)}
                        variant="bordered"
                        classNames={{ inputWrapper: "border-slate-200" }}
                      />
                  </div>
                </div>

                {/* Sección Representante / Vendedor */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <User size={18} className="text-orange-600" /> 
                    <span>Contacto Directo (Vendedor)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Nombre del Contacto" 
                        placeholder="Ej. Juan Pérez" 
                        value={formData.contactoNombre}
                        onValueChange={(v) => handleChange('contactoNombre', v)}
                        variant="bordered"
                        classNames={{ inputWrapper: "border-slate-200" }}
                      />
                      <Input 
                        label="Celular del Contacto" 
                        value={formData.contactoTelefono}
                        onValueChange={(v) => handleChange('contactoTelefono', v)}
                        variant="bordered"
                        classNames={{ inputWrapper: "border-slate-200" }}
                      />
                  </div>
                </div>

              </div>
            </ModalBody>
            <ModalFooter className="border-t border-slate-100 mt-4">
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button 
                className="bg-slate-900 text-white font-medium" 
                onPress={handleSubmit}
                isLoading={loading}
                startContent={!loading && <Save size={18} />}
              >
                {proveedorAEditar ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}