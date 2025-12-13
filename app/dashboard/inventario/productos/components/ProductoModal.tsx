'use client'

import { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Textarea, Select, SelectItem 
} from "@heroui/react";
import { AlertCircle } from 'lucide-react';
import { CrearProductoDto, Producto } from '@/types/productos.types';

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearProductoDto) => Promise<void>;
  productoAEditar: Producto | null;
}

// Unidades de medida comunes (puedes sacarlo a una constante o config)
const UNIDADES = [
  { key: 'UNIDAD', label: 'Unidad (und)' },
  { key: 'KG', label: 'Kilogramo (kg)' },
  { key: 'LITRO', label: 'Litro (L)' },
  { key: 'CAJA', label: 'Caja' },
  { key: 'PAQUETE', label: 'Paquete' },
];

export function ProductoModal({ isOpen, onClose, onSubmit, productoAEditar }: ProductoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<CrearProductoDto>({
    nombre: '',
    codigo: '',
    descripcion: '',
    unidadMedida: '',
    categoria: '',
    stockMinimo: 0
  });

  // Cargar datos al editar o limpiar al crear
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (productoAEditar) {
        setFormData({
          nombre: productoAEditar.nombre,
          codigo: productoAEditar.codigo || '',
          descripcion: productoAEditar.descripcion || '',
          unidadMedida: productoAEditar.unidad_medida, // Ojo: mapeo de snake_case a camelCase
          categoria: productoAEditar.categoria || '',
          stockMinimo: productoAEditar.stock_minimo
        });
      } else {
        setFormData({
          nombre: '',
          codigo: '',
          descripcion: '',
          unidadMedida: '',
          categoria: '',
          stockMinimo: 0
        });
      }
    }
  }, [isOpen, productoAEditar]);

  const handleSubmit = async () => {
    // Validaciones simples
    if (!formData.nombre || !formData.unidadMedida) {
      setError("El nombre y la unidad de medida son obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (e: any) {
      setError(e.message || "Ocurrió un error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof CrearProductoDto, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center" size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {productoAEditar ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="bg-danger-50 text-danger-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  autoFocus
                  label="Nombre del Producto"
                  placeholder="Ej: Arroz Costeño"
                  variant="bordered"
                  value={formData.nombre}
                  onValueChange={(v) => handleChange('nombre', v)}
                  isRequired
                />
                <Input
                  label="Código (SKU)"
                  placeholder="Ej: PROD-001"
                  variant="bordered"
                  value={formData.codigo}
                  onValueChange={(v) => handleChange('codigo', v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Unidad de Medida"
                  placeholder="Seleccione unidad"
                  variant="bordered"
                  selectedKeys={formData.unidadMedida ? [formData.unidadMedida] : []}
                  onChange={(e) => handleChange('unidadMedida', e.target.value)}
                  isRequired
                >
                  {UNIDADES.map((u) => (
                    <SelectItem key={u.key} value={u.key}>
                      {u.label}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="Categoría"
                  placeholder="Ej: Abarrotes"
                  variant="bordered"
                  value={formData.categoria}
                  onValueChange={(v) => handleChange('categoria', v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input
                  type="number"
                  label="Stock Mínimo"
                  placeholder="0"
                  variant="bordered"
                  value={formData.stockMinimo?.toString()}
                  onValueChange={(v) => handleChange('stockMinimo', Number(v))}
                  description="Alerta cuando el inventario baje de este número"
                />
              </div>

              <Textarea
                label="Descripción"
                placeholder="Detalles adicionales del producto..."
                variant="bordered"
                value={formData.descripcion}
                onValueChange={(v) => handleChange('descripcion', v)}
              />

            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={loading}>
                {productoAEditar ? 'Actualizar' : 'Guardar Producto'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}