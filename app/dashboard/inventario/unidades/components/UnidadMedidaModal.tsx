'use client'

import React, { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Select, SelectItem, Switch 
} from "@heroui/react";
import { AlertCircle, Scale, Save, HelpCircle } from 'lucide-react';
import { CrearUnidadDto, UnidadMedida, TipoUnidad } from '@/types/unidades.types';

interface UnidadMedidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearUnidadDto) => Promise<void>;
  unidadAEditar: UnidadMedida | null;
  todasLasUnidades: UnidadMedida[];
}

const TIPOS: { key: TipoUnidad; label: string }[] = [
  { key: 'peso', label: 'Peso (Masa)' },
  { key: 'volumen', label: 'Volumen (Capacidad)' },
  { key: 'cantidad', label: 'Cantidad (Unidades)' },
];

export function UnidadMedidaModal({ isOpen, onClose, onSubmit, unidadAEditar, todasLasUnidades }: UnidadMedidaModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el Modal de Confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [formData, setFormData] = useState<CrearUnidadDto>({
    nombre: '',
    abreviatura: '',
    tipo: 'cantidad',
    esBase: true,
    unidadBaseId: undefined,
    factorABase: undefined
  });

  // 1. CARGA DE DATOS (CORREGIDA)
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsConfirmOpen(false); // Asegurar que el modal de confirmación esté cerrado al abrir
      
      if (unidadAEditar) {
        setFormData({
          nombre: unidadAEditar.nombre,
          abreviatura: unidadAEditar.abreviatura,
          tipo: unidadAEditar.tipo,
          esBase: unidadAEditar.es_base,
          // Convertimos explícitamente null a undefined para los Selects/Inputs
          unidadBaseId: unidadAEditar.unidad_base_id ?? undefined,
          // ⚠️ CRÍTICO: Forzamos la conversión a Number para evitar el bug de "0.0001"
          factorABase: unidadAEditar.factor_a_base !== null ? Number(unidadAEditar.factor_a_base) : undefined
        });
      } else {
        // Reset para creación
        setFormData({
          nombre: '',
          abreviatura: '',
          tipo: 'peso',
          esBase: true,
          unidadBaseId: undefined,
          factorABase: undefined
        });
      }
    }
  }, [isOpen, unidadAEditar]);

  // 2. PRE-VALIDACIÓN (Antes de abrir confirmación)
  const handlePreSubmit = () => {
    setError(null);

    // Validaciones Básicas
    if (!formData.nombre.trim() || !formData.abreviatura.trim()) {
      setError("El nombre y la abreviatura son obligatorios.");
      return;
    }

    // Validación de Lógica de Conversión
    if (!formData.esBase) {
      if (!formData.unidadBaseId) {
        setError("Selecciona una Unidad Base de referencia.");
        return;
      }
      if (!formData.factorABase || formData.factorABase <= 0) {
        setError("El factor de conversión debe ser un número mayor a 0.");
        return;
      }
    }

    // Si todo está bien, abrimos el modal de confirmación
    setIsConfirmOpen(true);
  };

  // 3. ENVÍO FINAL (Al confirmar)
  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
      setIsConfirmOpen(false); // Cerramos confirmación
      onClose();               // Cerramos formulario principal
    } catch (err: unknown) {
      setIsConfirmOpen(false); // Cerramos confirmación para mostrar el error en el formulario
      if (err instanceof Error) setError(err.message);
      else setError("Ocurrió un error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  // Manejador genérico tipado
  const handleChange = (
    key: keyof CrearUnidadDto, 
    value: string | number | boolean | undefined
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Filtrar unidades padres posibles
  const unidadesBaseDisponibles = todasLasUnidades.filter(u => 
    u.es_base && u.tipo === formData.tipo && u.id !== unidadAEditar?.id
  );

  return (
    <>
      {/* --- MODAL PRINCIPAL (FORMULARIO) --- */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={(open) => !loading && onClose()} // Evita cerrar si está cargando
        placement="top-center" 
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onCloseMain) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {unidadAEditar ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
              </ModalHeader>
              
              <ModalBody>
                {error && (
                  <div className="bg-danger-50 text-danger-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-danger-200">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    autoFocus
                    label="Nombre"
                    placeholder="Ej: Kilogramo"
                    variant="bordered"
                    value={formData.nombre}
                    onValueChange={(val) => handleChange('nombre', val)}
                    isRequired
                  />
                  <Input
                    label="Abreviatura"
                    placeholder="Ej: kg"
                    variant="bordered"
                    value={formData.abreviatura}
                    onValueChange={(val) => handleChange('abreviatura', val)}
                    isRequired
                  />
                </div>

                <Select
                  label="Tipo de Magnitud"
                  variant="bordered"
                  selectedKeys={[formData.tipo]}
                  onChange={(e) => handleChange('tipo', e.target.value as TipoUnidad)}
                  isDisabled={!!unidadAEditar} // No permitir cambio de tipo en edición
                >
                  {TIPOS.map((t) => (
                      <SelectItem key={t.key}>
                        {t.label}
                      </SelectItem>
                  ))}
                </Select>

                <div className="flex items-center justify-between p-3 border rounded-xl bg-default-50 transition-colors hover:bg-default-100">
                  <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-800">¿Es Unidad Base?</span>
                      <span className="text-xs text-slate-500">
                          {formData.esBase 
                              ? "Sí, es la referencia principal (ej: kg, L)" 
                              : "No, es derivada de otra (ej: gramo, ml)"}
                      </span>
                  </div>
                  <Switch 
                      isSelected={formData.esBase} 
                      onValueChange={(val) => {
                          handleChange('esBase', val);
                          if(val) {
                              // Limpiar dependencias si se vuelve base
                              handleChange('unidadBaseId', undefined);
                              handleChange('factorABase', undefined);
                          }
                      }}
                  />
                </div>

                {/* Sección Condicional: Conversión */}
                {!formData.esBase && (
                   <div className="p-4 bg-primary-50 rounded-xl space-y-4 border border-primary-100 animate-appearance-in">
                      <div className="flex gap-2 text-primary-700 text-sm items-center font-bold">
                          <Scale size={16}/> Configuración de Conversión
                      </div>
                      
                      <Select
                          label={`Unidad Base (${formData.tipo})`}
                          placeholder="Selecciona la unidad padre"
                          variant="bordered"
                          selectedKeys={formData.unidadBaseId ? [formData.unidadBaseId.toString()] : []}
                          onChange={(e) => handleChange('unidadBaseId', Number(e.target.value))}
                          isRequired
                          description="Unidad de la cual depende esta medida"
                      >
                          {unidadesBaseDisponibles.map((u) => (
                              <SelectItem key={u.id} textValue={`${u.nombre} (${u.abreviatura})`}>
                                  {u.nombre} ({u.abreviatura})
                              </SelectItem>
                          ))}
                      </Select>

                      <Input
                          type="number"
                          label="Factor de Conversión"
                          placeholder="Ej: 0.001"
                          variant="bordered"
                          value={formData.factorABase?.toString() || ''}
                          // ⚠️ Corrección clave: Enviar undefined si está vacío
                          onValueChange={(val) => handleChange('factorABase', val ? parseFloat(val) : undefined)}
                          description={
                            formData.unidadBaseId && formData.factorABase 
                            ? `1 ${formData.nombre || 'unidad'} = ${formData.factorABase} [Unidad Base]` 
                            : "Define cuánto equivale en la unidad base"
                          }
                          isRequired
                      />
                   </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="flat" onPress={() => onCloseMain()}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={handlePreSubmit} endContent={<Save size={18}/>}>
                  {unidadAEditar ? 'Actualizar' : 'Guardar'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* --- MODAL DE CONFIRMACIÓN (SECUNDARIO) --- */}
      <Modal 
        isOpen={isConfirmOpen} 
        onOpenChange={setIsConfirmOpen} 
        size="sm" 
        hideCloseButton={loading}
        isDismissable={!loading}
      >
        <ModalContent>
          {(onCloseConfirm) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-slate-800">
                <HelpCircle size={24} className="text-primary"/> 
                Confirmar Acción
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-slate-600">
                  ¿Estás seguro que deseas {unidadAEditar ? <b>actualizar</b> : <b>crear</b>} la unidad de medida 
                  <span className="font-bold text-slate-900"> {formData.nombre}</span>?
                </p>
                {!formData.esBase && (
                  <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded mt-2">
                    Verifica que el factor <b>{formData.factorABase}</b> sea correcto.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onCloseConfirm} isDisabled={loading}>
                  Revisar
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleFinalSubmit} 
                  isLoading={loading}
                  className="font-medium"
                >
                  Sí, Confirmar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}