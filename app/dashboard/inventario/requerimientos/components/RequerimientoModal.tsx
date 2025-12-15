'use client'

import React, { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Textarea, Select, SelectItem, Divider, Chip
} from "@heroui/react";
import { AlertCircle, Plus, Trash2, ShoppingCart } from 'lucide-react';

import { CrearRequerimientoDto, RequerimientoCompleto, RequerimientoItemDto } from '@/types/requerimientos.types';
import { Producto, ProductoUnidad } from '@/types/productos.types';
import { productosService } from '@/services/productos.service';
import { useUIConfig } from "@/providers/UIConfigProvider";

interface RequerimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearRequerimientoDto) => Promise<void>;
  requerimientoAEditar: RequerimientoCompleto | null;
}

// Interfaz auxiliar para manejar el estado visual de cada fila
interface FilaItem extends RequerimientoItemDto {
  key: string; // Para React Keys
  unidadesDisponibles: ProductoUnidad[]; // Unidades cargadas para este producto
}

export function RequerimientoModal({ isOpen, onClose, onSubmit, requerimientoAEditar }: RequerimientoModalProps) {
  const { config } = useUIConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [listaProductos, setListaProductos] = useState<Producto[]>([]);

  // Estados del Formulario
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<FilaItem[]>([]);

  // 1. Cargar Productos al abrir (Traemos los primeros 100 para el select)
  useEffect(() => {
    if (isOpen) {
      const loadProductos = async () => {
        try {
          // Usamos getAll con limite alto para llenar el select simple
          const res = await productosService.getAll(1, 100);
          setListaProductos(res.data);
        } catch (e) {
          console.error("Error cargando productos", e);
        }
      };
      loadProductos();
    }
  }, [isOpen]);

  // 2. Cargar datos al editar
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (requerimientoAEditar) {
        setObservaciones(requerimientoAEditar.observaciones || '');
        
        // Transformar items existentes a filas editables
        const cargarItemsExistentes = async () => {
          const filasPromesas = requerimientoAEditar.items.map(async (item) => {
            // Necesitamos cargar las unidades permitidas para este producto
            let units: ProductoUnidad[] = [];
            try {
               units = await productosService.getUnidades(item.producto_id);
            } catch (e) { console.error(e); }

            return {
              key: Math.random().toString(36).substr(2, 9),
              productoId: item.producto_id,
              unidadMedidaId: item.unidad_medida_id,
              cantidad: item.cantidad,
              observaciones: item.observaciones || '',
              unidadesDisponibles: units
            } as FilaItem;
          });

          const filasResueltas = await Promise.all(filasPromesas);
          setItems(filasResueltas);
        };
        cargarItemsExistentes();

      } else {
        // Modo Crear
        setObservaciones('');
        // Iniciamos con una fila vacía
        setItems([{ 
          key: 'init', 
          productoId: 0, 
          unidadMedidaId: 0, 
          cantidad: 1, 
          unidadesDisponibles: [] 
        }]);
      }
    }
  }, [isOpen, requerimientoAEditar]);

  // --- LÓGICA DE FILAS ---

  const agregarFila = () => {
    setItems([...items, { 
      key: Math.random().toString(36).substr(2, 9),
      productoId: 0, 
      unidadMedidaId: 0, 
      cantidad: 1,
      unidadesDisponibles: []
    }]);
  };

  const eliminarFila = (index: number) => {
    const nuevas = [...items];
    nuevas.splice(index, 1);
    setItems(nuevas);
  };

  const actualizarFila = async (index: number, campo: keyof FilaItem, valor: number | string) => {
    const nuevas = [...items];
    
    // Casting seguro
    (nuevas[index] as unknown as Record<string, number | string>)[campo] = valor;

    // Lógica especial si cambia el producto: Cargar sus unidades
    if (campo === 'productoId') {
      nuevas[index].unidadMedidaId = 0; // Reset unidad
      nuevas[index].unidadesDisponibles = []; // Reset lista
      
      if (Number(valor) > 0) {
        try {
          const unidades = await productosService.getUnidades(Number(valor));
          nuevas[index].unidadesDisponibles = unidades;
          
          // Opcional: Autoseleccionar la unidad base
          const base = unidades.find(u => u.es_unidad_base);
          if (base) nuevas[index].unidadMedidaId = base.unidad_medida_id;
        } catch (error) {
          console.error("Error cargando unidades del producto", error);
        }
      }
    }

    setItems(nuevas);
  };

  // --- SUBMIT ---

  const handleSubmit = async () => {
    if (items.length === 0) return setError("Debe haber al menos un item.");

    // Validaciones de filas
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productoId) return setError(`Fila ${i + 1}: Selecciona un producto.`);
      if (!items[i].unidadMedidaId) return setError(`Fila ${i + 1}: Selecciona una unidad.`);
      if (items[i].cantidad <= 0) return setError(`Fila ${i + 1}: La cantidad debe ser mayor a 0.`);
    }

    setLoading(true);
    try {
      // Mapeamos a DTO limpio (sin claves extra ni arrays de unidades)
      const itemsDto: RequerimientoItemDto[] = items.map(i => ({
        productoId: i.productoId,
        unidadMedidaId: i.unidadMedidaId,
        cantidad: i.cantidad,
        observaciones: i.observaciones
      }));

      const dto: CrearRequerimientoDto = {
        observaciones: observaciones || undefined,
        items: itemsDto
      };
      
      await onSubmit(dto);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = { input: config.textSize, label: config.textSize };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center" size="4xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <span className="text-2xl font-bold">
                {requerimientoAEditar ? `Editar Requerimiento ${requerimientoAEditar.codigo}` : 'Nuevo Requerimiento'}
              </span>
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="bg-danger-50 text-danger-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-danger-200 mb-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Cabecera */}
              <Textarea
                label="Observaciones Generales"
                placeholder="Motivo del requerimiento..."
                variant="bordered"
                minRows={2}
                value={observaciones}
                onValueChange={setObservaciones}
                classNames={inputClasses}
              />

              <Divider className="my-2" />

              {/* Detalle Items */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-2 items-center text-slate-700 font-bold">
                    <ShoppingCart size={20} />
                    <span className={config.headerSize}>Listado de Productos</span>
                  </div>
                  <Button size="sm" color="primary" variant="flat" onPress={agregarFila} startContent={<Plus size={16}/>}>
                    Agregar Item
                  </Button>
                </div>

                <div className="space-y-3">
                   {/* Encabezados Desktop */}
                   <div className="hidden md:grid grid-cols-12 gap-2 text-slate-500 px-2 text-sm font-semibold">
                      <div className="col-span-4">Producto</div>
                      <div className="col-span-3">Unidad</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-2">Notas</div>
                      <div className="col-span-1"></div>
                   </div>

                  {items.map((fila, index) => (
                    <div key={fila.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      
                      {/* Producto */}
                      <div className="md:col-span-4">
                        <Select
                          aria-label="Seleccionar producto"
                          placeholder="Producto..."
                          size="sm"
                          variant="bordered"
                          selectedKeys={fila.productoId ? [fila.productoId.toString()] : []}
                          onChange={(e) => actualizarFila(index, 'productoId', Number(e.target.value))}
                          classNames={{ value: "text-sm" }}
                        >
                          {listaProductos.map((p) => (
                            <SelectItem key={p.id} textValue={p.nombre}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* Unidad (Depende del producto) */}
                      <div className="md:col-span-3">
                        <Select
                          aria-label="Seleccionar unidad"
                          placeholder="Unidad..."
                          size="sm"
                          variant="bordered"
                          selectedKeys={fila.unidadMedidaId ? [fila.unidadMedidaId.toString()] : []}
                          onChange={(e) => actualizarFila(index, 'unidadMedidaId', Number(e.target.value))}
                          classNames={{ value: "text-sm" }}
                          isDisabled={!fila.productoId}
                        >
                          {fila.unidadesDisponibles.map((u) => (
                            <SelectItem key={u.unidad_medida_id} textValue={u.nombre}>
                              {u.nombre} ({u.abreviatura})
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* Cantidad */}
                      <div className="md:col-span-2">
                         <Input
                           type="number"
                           placeholder="Cant."
                           size="sm"
                           variant="bordered"
                           value={fila.cantidad.toString()}
                           onValueChange={(v) => actualizarFila(index, 'cantidad', Number(v))}
                           min={1}
                         />
                      </div>

                       {/* Observaciones Item */}
                       <div className="md:col-span-2">
                         <Input
                           placeholder="Nota opcional..."
                           size="sm"
                           variant="bordered"
                           value={fila.observaciones || ''}
                           onValueChange={(v) => actualizarFila(index, 'observaciones', v)}
                         />
                      </div>

                      {/* Eliminar */}
                      <div className="md:col-span-1 flex justify-center">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          color="danger" 
                          variant="light" 
                          onPress={() => eliminarFila(index)}
                          isDisabled={items.length === 1}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose} size={config.buttonSize}>
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit} 
                isLoading={loading}
                size={config.buttonSize}
                className="font-bold"
              >
                {requerimientoAEditar ? 'Actualizar' : 'Guardar Borrador'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}