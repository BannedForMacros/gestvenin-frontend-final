'use client'

import React, { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Textarea, Select, SelectItem, Divider
} from "@heroui/react";
import { AlertCircle, Plus, Trash2, ShoppingCart, CheckCircle, XCircle, Save } from 'lucide-react';

import { 
  CrearRequerimientoDto, 
  RequerimientoCompleto, 
  RequerimientoItemDto, 
  RevisarRequerimientoDto 
} from '@/types/requerimientos.types';
import { Producto, ProductoUnidad } from '@/types/productos.types';
import { productosService } from '@/services/productos.service';
import { useUIConfig } from "@/providers/UIConfigProvider";
import { useConfirm } from '@/providers/ConfirmProvider';

interface FilaItem {
  key: string;
  productoId: number;
  unidadMedidaId: number;
  cantidad: number | string; 
  observaciones: string;
  unidadesDisponibles: ProductoUnidad[];
}

interface RequerimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearRequerimientoDto) => Promise<void>;
  onReview?: (data: RevisarRequerimientoDto) => Promise<void>;
  requerimientoAEditar: RequerimientoCompleto | null;
  canApprove?: boolean;
}

export function RequerimientoModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onReview,
  requerimientoAEditar, 
  canApprove 
}: RequerimientoModalProps) {
  
  const { config } = useUIConfig();
  const { confirm } = useConfirm(); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listaProductos, setListaProductos] = useState<Producto[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<FilaItem[]>([]);

  // Modos
  const isBorrador = !requerimientoAEditar || requerimientoAEditar.estado === 'borrador';
  const isRevision = requerimientoAEditar?.estado === 'revision';
  const isReviewMode = isRevision && canApprove;
  const isReadOnly = !isBorrador && !isReviewMode;

  useEffect(() => {
    if (isOpen) {
      const loadProductos = async () => {
        try {
          const res = await productosService.getAll(1, 100);
          setListaProductos(res.data);
        } catch (e) { console.error(e); }
      };
      loadProductos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (requerimientoAEditar) {
        setObservaciones(requerimientoAEditar.observaciones || '');
        const cargarItems = async () => {
          const filas = await Promise.all(requerimientoAEditar.items.map(async (item) => {
            let units: ProductoUnidad[] = [];
            try { units = await productosService.getUnidades(item.producto_id); } catch (e) {}
            return {
              key: Math.random().toString(36).substr(2, 9),
              productoId: item.producto_id,
              unidadMedidaId: item.unidad_medida_id,
              cantidad: item.cantidad,
              observaciones: item.observaciones || '',
              unidadesDisponibles: units
            };
          }));
          setItems(filas);
        };
        cargarItems();
      } else {
        setObservaciones('');
        setItems([{ key: 'init', productoId: 0, unidadMedidaId: 0, cantidad: 1, observaciones: '', unidadesDisponibles: [] }]);
      }
    }
  }, [isOpen, requerimientoAEditar]);

  // Lógica de Filas
  const agregarFila = () => setItems([...items, { key: Math.random().toString(), productoId: 0, unidadMedidaId: 0, cantidad: 1, observaciones: '', unidadesDisponibles: [] }]);
  const eliminarFila = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const actualizarFila = async (index: number, campo: keyof Omit<FilaItem, 'key' | 'unidadesDisponibles'>, valor: string | number) => {
    const nuevosItems = [...items];
    const itemActual = { ...nuevosItems[index] };

    if (campo === 'cantidad') itemActual.cantidad = valor;
    else if (campo === 'observaciones') itemActual.observaciones = String(valor);
    else if (campo === 'unidadMedidaId') itemActual.unidadMedidaId = Number(valor);
    else if (campo === 'productoId') {
      const prodId = Number(valor);
      itemActual.productoId = prodId;
      itemActual.unidadMedidaId = 0;
      itemActual.unidadesDisponibles = [];
      if (prodId > 0) {
        try {
          const unidades = await productosService.getUnidades(prodId);
          itemActual.unidadesDisponibles = unidades;
          const base = unidades.find(u => u.es_unidad_base);
          if (base) itemActual.unidadMedidaId = base.unidad_medida_id;
        } catch (e) { console.error(e); }
      }
    }
    nuevosItems[index] = itemActual;
    setItems(nuevosItems);
  };

  const prepareDto = (): RequerimientoItemDto[] | null => {
    if (items.length === 0) { setError("Debe haber al menos un item."); return null; }
    const itemsDto: RequerimientoItemDto[] = [];
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.productoId || !row.unidadMedidaId) { setError(`Fila ${i+1}: Faltan datos.`); return null; }
      const cant = Number(row.cantidad);
      if (isNaN(cant) || cant <= 0) { setError(`Fila ${i+1}: Cantidad inválida.`); return null; }
      itemsDto.push({
        productoId: row.productoId,
        unidadMedidaId: row.unidadMedidaId,
        cantidad: cant,
        observaciones: row.observaciones
      });
    }
    return itemsDto;
  };

  const handleStandardSubmit = async () => {
    const itemsDto = prepareDto();
    if (!itemsDto) return;
    setLoading(true);
    try {
      await onSubmit({ observaciones: observaciones || undefined, items: itemsDto });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  };

  const handleReviewSubmit = async (accion: 'aprobar' | 'rechazar' | 'guardar') => {
    if (!onReview) return;
    
    const itemsDto = prepareDto();
    if (!itemsDto) return;

    if (accion === 'aprobar') {
      const ok = await confirm({
        title: "Aprobar Requerimiento",
        message: "¿Estás seguro de aprobar este requerimiento? Esta acción generará las órdenes de compra.",
        confirmText: "Sí, Aprobar",
        color: "success"
      });
      if (!ok) return;
    } 
    
    if (accion === 'rechazar') {
      const ok = await confirm({
        title: "Rechazar Requerimiento",
        message: "¿Estás seguro de RECHAZAR este requerimiento?",
        confirmText: "Sí, Rechazar",
        color: "danger"
      });
      if (!ok) return;
    }

    setLoading(true);
    try {
      await onReview({ 
        accion: accion, 
        observaciones: observaciones || undefined, 
        items: itemsDto 
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  };

  const inputClasses = { input: config.textSize, label: config.textSize };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center" size="4xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            {/* ✅ HEADER REDISEÑADO: Título a la izquierda, Acciones a la derecha */}
            <ModalHeader className="flex justify-between items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">
                  {requerimientoAEditar ? `Requerimiento ${requerimientoAEditar.codigo}` : 'Nuevo Requerimiento'}
                </span>
                {isReviewMode && <span className="text-sm text-warning-600 font-medium">Modo Revisión</span>}
                {isReadOnly && <span className="text-sm text-slate-500 font-medium">Modo Solo Lectura</span>}
              </div>

              {/* BOTONES DE DECISIÓN EN EL HEADER (Solo en modo revisión) */}
              {isReviewMode && (
                <div className="flex gap-2">
                  <Button 
                    color="danger" 
                    variant="bordered"
                    onPress={() => handleReviewSubmit('rechazar')} 
                    isLoading={loading}
                    size="sm"
                    startContent={<XCircle size={16}/>}
                  >
                    Rechazar
                  </Button>
                  <Button 
                    color="success" 
                    className="text-white font-bold shadow-sm" 
                    onPress={() => handleReviewSubmit('aprobar')} 
                    isLoading={loading} 
                    size="sm"
                    startContent={<CheckCircle size={16}/>}
                  >
                    Aprobar
                  </Button>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="py-6">
              {error && <div className="bg-danger-50 text-danger-600 p-3 rounded flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
              
              <Textarea 
                label="Observaciones" variant="bordered" minRows={2} 
                value={observaciones} onValueChange={setObservaciones} isDisabled={isReadOnly}
                classNames={inputClasses} 
              />
              <Divider className="my-2" />
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-2 font-bold text-slate-700"><ShoppingCart size={20}/><span>Productos</span></div>
                  {!isReadOnly && (
                    <Button size="sm" color="primary" variant="flat" onPress={agregarFila}><Plus size={16}/> Agregar</Button>
                  )}
                </div>
                <div className="space-y-3">
                   {items.map((fila, idx) => (
                    <div key={fila.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-white p-2 rounded border border-slate-200">
                      <div className="md:col-span-4">
                        <Select aria-label="Prod" placeholder="Producto" size="sm" variant="bordered" isDisabled={isReadOnly}
                          selectedKeys={fila.productoId ? [fila.productoId.toString()] : []}
                          onChange={(e) => actualizarFila(idx, 'productoId', e.target.value)}
                        >
                          {listaProductos.map((p) => <SelectItem key={p.id} textValue={p.nombre}>{p.nombre}</SelectItem>)}
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Select aria-label="Und" placeholder="Unidad" size="sm" variant="bordered" isDisabled={isReadOnly || !fila.productoId}
                          selectedKeys={fila.unidadMedidaId ? [fila.unidadMedidaId.toString()] : []}
                          onChange={(e) => actualizarFila(idx, 'unidadMedidaId', e.target.value)}
                        >
                          {fila.unidadesDisponibles.map((u) => <SelectItem key={u.unidad_medida_id} textValue={u.nombre}>{u.nombre}</SelectItem>)}
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Input type="number" size="sm" variant="bordered" isDisabled={isReadOnly} min={1}
                          value={fila.cantidad.toString()}
                          onValueChange={(v) => actualizarFila(idx, 'cantidad', v)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input size="sm" variant="bordered" isDisabled={isReadOnly} placeholder="Nota"
                          value={fila.observaciones}
                          onValueChange={(v) => actualizarFila(idx, 'observaciones', v)}
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        {!isReadOnly && (
                          <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => eliminarFila(idx)} isDisabled={items.length===1}><Trash2 size={18}/></Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ModalBody>
            
            {/* ✅ FOOTER REDISEÑADO: Cancelar en Rojo y Guardar en Azul */}
            <ModalFooter className="flex w-full justify-between items-center border-t border-slate-100 pt-4">
              
              {/* Botón Cancelar/Cerrar (Ahora en ROJO FLAT) */}
              <Button 
                color="danger" 
                variant="flat" 
                onPress={onClose} 
                size={config.buttonSize}
              >
                {isReadOnly ? 'Cerrar' : 'Cancelar'}
              </Button>

              <div className="flex gap-2">
                 {/* MODO BORRADOR: Botón Guardar */}
                 {!isReadOnly && !isReviewMode && (
                    <Button color="primary" onPress={handleStandardSubmit} isLoading={loading} size={config.buttonSize} className="font-bold">
                      {requerimientoAEditar ? 'Actualizar Borrador' : 'Crear Borrador'}
                    </Button>
                 )}

                 {/* MODO REVISIÓN: Botón Guardar Cambios (Azul) */}
                 {isReviewMode && (
                    <Button 
                      className="bg-blue-600 text-white font-semibold hover:bg-blue-700" 
                      onPress={() => handleReviewSubmit('guardar')} 
                      isLoading={loading} 
                      size={config.buttonSize} 
                      startContent={<Save size={18}/>}
                    >
                      Guardar Cambios
                    </Button>
                 )}
              </div>

            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}