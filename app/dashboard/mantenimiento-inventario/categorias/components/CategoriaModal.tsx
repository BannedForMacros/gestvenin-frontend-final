'use client'

import React, { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Textarea 
} from "@heroui/react";
import { AlertCircle, Save } from 'lucide-react';
import { CrearCategoriaDto, Categoria } from '@/types/categorias.types';

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearCategoriaDto) => Promise<void>;
  categoriaAEditar: Categoria | null;
}

export function CategoriaModal({ isOpen, onClose, onSubmit, categoriaAEditar }: CategoriaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CrearCategoriaDto>({
    nombre: '',
    descripcion: ''
  });

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (categoriaAEditar) {
        setFormData({
          nombre: categoriaAEditar.nombre,
          descripcion: categoriaAEditar.descripcion || ''
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: ''
        });
      }
    }
  }, [isOpen, categoriaAEditar]);

  const handleSubmit = async () => {
    // Validación manual simple
    if (!formData.nombre.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error desconocido.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler tipado correctamente
  const handleChange = (key: keyof CrearCategoriaDto, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {categoriaAEditar ? 'Editar Categoría' : 'Nueva Categoría'}
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="bg-danger-50 text-danger-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-danger-200">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <Input
                autoFocus
                label="Nombre"
                placeholder="Ej: Bebidas, Abarrotes"
                variant="bordered"
                value={formData.nombre}
                onValueChange={(val) => handleChange('nombre', val)}
                isRequired
              />

              <Textarea
                label="Descripción"
                placeholder="Detalle opcional de la categoría..."
                variant="bordered"
                value={formData.descripcion}
                onValueChange={(val) => handleChange('descripcion', val)}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose} isDisabled={loading}>
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit} 
                isLoading={loading}
                endContent={!loading && <Save size={18}/>}
              >
                {categoriaAEditar ? 'Actualizar' : 'Guardar'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}