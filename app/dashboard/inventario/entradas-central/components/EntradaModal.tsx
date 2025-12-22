// app/dashboard/inventario/entradas-central/components/EntradaModal.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Input, Select, SelectItem, Divider, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Textarea 
} from "@heroui/react";
import { Plus, Calculator, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from "sonner";

import { CrearEntradaDto, EntradaItemDto } from '@/types/entradas.types';
import { ConfirmButton } from '@/components/ui/ConfirmButton';

// Servicios
import { productosService } from '@/services/productos.service';
import { proveedoresService } from '@/services/proveedores.service';
import { requerimientosService } from '@/services/requerimientos.service';

// Tipos
import { Producto, ProductoUnidad } from '@/types/productos.types'; 
import { Proveedor } from '@/types/proveedores.types';
import { Requerimiento } from '@/types/requerimientos.types';

interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearEntradaDto) => Promise<void>;
  loading: boolean;
}

interface RequerimientoItemRaw {
  productoId?: number;
  producto_id?: number;
  unidadMedidaId?: number;
  unidad_medida_id?: number;
  cantidad: number | string;
}

export function EntradaModal({ isOpen, onClose, onSubmit, loading }: EntradaModalProps) {
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]); 
  
  const [unidadesCache, setUnidadesCache] = useState<Record<number, ProductoUnidad[]>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);

  const [tipo, setTipo] = useState<'manual' | 'requerimiento'>('manual');
  const [requerimientoId, setRequerimientoId] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');

  const [items, setItems] = useState<EntradaItemDto[]>([]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const loadData = async () => {
          setLoadingData(true);
          setErrorData(null);
          try {
            const [prodsRes, provsRes, reqsRes] = await Promise.all([
              productosService.getAll(1, 100), 
              proveedoresService.getAll(1, 100),
              requerimientosService.getAll(1, 100, '', 'aprobado')
            ]);
            
            setProductos(prodsRes.data);
            setProveedores(provsRes.data);
            setRequerimientos(reqsRes.data);
          } catch (error: unknown) {
            console.error("Error cargando datos:", error);
            const msg = error instanceof Error ? error.message : "Error desconocido";
            setErrorData(msg);
          } finally {
            setLoadingData(false);
          }
        };
        loadData();
        
        setTipo('manual');
        setRequerimientoId('');
        setObservaciones('');
        setItems([]);
        setUnidadesCache({});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (tipo === 'requerimiento' && requerimientoId) {
      const cargarDetalleRequerimiento = async () => {
        try {
          const reqCompleto = await requerimientosService.getById(Number(requerimientoId));
          
          if (reqCompleto && reqCompleto.items) {
            const itemsRaw = reqCompleto.items as unknown as RequerimientoItemRaw[];

            const nuevosItems: EntradaItemDto[] = itemsRaw.map((i) => ({
              productoId: Number(i.productoId || i.producto_id),
              unidadMedidaId: Number(i.unidadMedidaId || i.unidad_medida_id),
              cantidad: Number(i.cantidad),
              precioUnitario: 0,
              precioTotal: 0
            }));

            const productosFaltantes = new Set<number>();
            nuevosItems.forEach(item => {
              if (item.productoId && !unidadesCache[item.productoId]) {
                productosFaltantes.add(item.productoId);
              }
            });

            if (productosFaltantes.size > 0) {
              const promesas = Array.from(productosFaltantes).map(async (id) => {
                try {
                  const unidades = await productosService.getUnidades(id);
                  return { id, unidades };
                } catch (e) {
                  console.error(`Error cargando unidades prod ${id}`, e);
                  return { id, unidades: [] };
                }
              });

              const resultados = await Promise.all(promesas);
              
              setUnidadesCache(prev => {
                const nuevaCache = { ...prev };
                resultados.forEach(res => {
                  if (res.unidades.length > 0) {
                    nuevaCache[res.id] = res.unidades;
                  }
                });
                return nuevaCache;
              });
            }

            setItems(nuevosItems);
            toast.success("Productos cargados del requerimiento");
          }
        } catch (error) {
          console.error(error);
          toast.error("Error al cargar detalle del requerimiento");
          setItems([]);
        }
      };

      cargarDetalleRequerimiento();
    }
  }, [requerimientoId, tipo]);

  const agregarItem = () => {
    setItems([...items, { 
      productoId: 0, 
      unidadMedidaId: 0, 
      cantidad: 1, 
      precioUnitario: 0, 
      precioTotal: 0,
      proveedorId: undefined,
      comprobante: undefined,
      fechaCompra: undefined
    }]);
  };

  const eliminarItem = (index: number) => {
    const nuevos = [...items]; 
    nuevos.splice(index, 1); 
    setItems(nuevos);
  };

  const actualizarItem = async (index: number, field: keyof EntradaItemDto, value: number | string | undefined) => {
    const nuevos = [...items];
    const item = { ...nuevos[index] };
    
    if (field === 'productoId' && typeof value === 'number') {
      item.productoId = value;
      item.unidadMedidaId = 0;
      if (!unidadesCache[value]) {
        try {
          const unidades = await productosService.getUnidades(value);
          setUnidadesCache(prev => ({ ...prev, [value]: unidades }));
        } catch (error) {
          console.error("Error cargando unidades", error);
        }
      }
    } else if (field === 'proveedorId') {
      item.proveedorId = value ? Number(value) : undefined;
    } else if (field === 'comprobante' || field === 'fechaCompra') {
      item[field] = value as string | undefined;
    } else {
      (item as Record<string, unknown>)[field] = value;
    }
    
    if (field === 'cantidad' || field === 'precioUnitario') {
      item.precioTotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
    }

    nuevos[index] = item;
    setItems(nuevos);
  };

  const totalGeneral = useMemo(() => items.reduce((acc, curr) => acc + curr.precioTotal, 0), [items]);

  const handleSubmit = () => {
    if (tipo === 'requerimiento' && !requerimientoId) return toast.warning("Seleccione un requerimiento");
    if (items.length === 0) return toast.warning("Agregue al menos un producto");
    
    const itemsIncompletos = items.some(i => !i.productoId || !i.unidadMedidaId || i.cantidad <= 0);
    if (itemsIncompletos) return toast.warning("Complete los datos de los productos");

    onSubmit({
      tipo,
      requerimientoId: tipo === 'requerimiento' ? Number(requerimientoId) : undefined,
      observaciones,
      items
    });
  };

  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-PE', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-xl font-bold">Nueva Entrada de Inventario</span>
            </ModalHeader>
            <ModalBody>
              
              {errorData && (
                <div className="bg-danger-50 text-danger-600 p-3 rounded-lg flex items-center gap-2 mb-4">
                  <AlertCircle size={20} />
                  <span>{errorData}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <Select 
                  label="Tipo de Entrada" 
                  selectedKeys={[tipo]} 
                  onChange={(e) => {
                    const nuevoTipo = e.target.value as 'manual' | 'requerimiento';
                    setTipo(nuevoTipo);
                    setItems([]);
                    setRequerimientoId('');
                  }}
                  variant="bordered"
                  disallowEmptySelection
                >
                  <SelectItem key="manual">Manual (Directa)</SelectItem>
                  <SelectItem key="requerimiento">Desde Requerimiento</SelectItem>
                </Select>

                {tipo === 'requerimiento' && (
                  <Select 
                    label="Buscar Requerimiento" 
                    placeholder="Seleccione un req. aprobado"
                    selectedKeys={requerimientoId ? [requerimientoId] : []}
                    onChange={(e) => setRequerimientoId(e.target.value)}
                    variant="bordered"
                    className="md:col-span-2"
                    items={requerimientos}
                    isLoading={loadingData}
                  >
                    {(req) => (
                      <SelectItem key={req.id} textValue={req.codigo || String(req.id)}>
                        <div className="flex flex-col">
                          <span className="font-bold">{req.codigo || `#${req.id}`}</span>
                          <span className="text-xs text-slate-500">
                            Fecha: {formatearFecha(req.creado_en)}
                          </span>
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                )}
                
                <div className="md:col-span-3">
                  <Textarea 
                    label="Observaciones" 
                    placeholder="Detalles adicionales..." 
                    minRows={1}
                    value={observaciones}
                    onValueChange={setObservaciones}
                    variant="bordered"
                  />
                </div>
              </div>

              <Divider className="my-2" />

              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calculator size={18} /> Detalle de Productos
                </h3>
                <button
                  onClick={agregarItem}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1.5 text-sm font-semibold"
                >
                  <Plus size={16} />
                  Agregar Producto
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table aria-label="Tabla de items" removeWrapper shadow="none">
                  <TableHeader>
                    <TableColumn>PRODUCTO</TableColumn>
                    <TableColumn width={150}>UNIDAD</TableColumn>
                    <TableColumn width={100}>CANT.</TableColumn>
                    <TableColumn width={120}>P. UNIT.</TableColumn>
                    <TableColumn width={120}>TOTAL</TableColumn>
                    <TableColumn width={120}>PROVEEDOR</TableColumn>
                    <TableColumn width={100}>COMPROB.</TableColumn>
                    <TableColumn width={50}> </TableColumn>
                  </TableHeader>
                  <TableBody items={items} emptyContent="Agregue productos">
                    {(item: EntradaItemDto) => { 
                      const index = items.indexOf(item);
                      const unidadesDisponibles = item.productoId ? unidadesCache[item.productoId] : [];

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Select 
                              aria-label="Producto"
                              placeholder="Buscar..." 
                              size="sm" 
                              variant="bordered"
                              selectedKeys={item.productoId ? [String(item.productoId)] : []}
                              onChange={(e) => actualizarItem(index, 'productoId', Number(e.target.value))}
                              items={productos} 
                            >
                              {(p) => <SelectItem key={p.id}>{p.nombre}</SelectItem>}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              aria-label="Unidad"
                              placeholder="Unidad" 
                              size="sm" 
                              variant="bordered"
                              isDisabled={!item.productoId}
                              selectedKeys={item.unidadMedidaId ? [String(item.unidadMedidaId)] : []}
                              onChange={(e) => actualizarItem(index, 'unidadMedidaId', Number(e.target.value))}
                              items={unidadesDisponibles || []}
                            >
                              {(u: ProductoUnidad) => (
                                <SelectItem key={u.unidad_medida_id} textValue={u.nombre}>
                                  {u.nombre}
                                </SelectItem>
                              )}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" size="sm" variant="bordered" min={0.01}
                              value={String(item.cantidad)}
                              onValueChange={(v) => actualizarItem(index, 'cantidad', Number(v))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" size="sm" variant="bordered" min={0}
                              startContent={<span className="text-xs text-slate-400">S/</span>}
                              value={String(item.precioUnitario)}
                              onValueChange={(v) => actualizarItem(index, 'precioUnitario', Number(v))}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-slate-700">S/ {item.precioTotal.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              aria-label="Proveedor"
                              placeholder="Opcional" 
                              size="sm" 
                              variant="bordered"
                              selectedKeys={item.proveedorId ? [String(item.proveedorId)] : []}
                              onChange={(e) => actualizarItem(index, 'proveedorId', e.target.value)}
                              items={proveedores}
                            >
                              {(p) => <SelectItem key={p.id}>{p.razon_social}</SelectItem>}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              size="sm" 
                              variant="bordered"
                              placeholder="F001-123"
                              value={item.comprobante || ''}
                              onValueChange={(v) => actualizarItem(index, 'comprobante', v)}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => eliminarItem(index)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    }}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end mt-4 px-4">
                <div className="text-xl font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-lg">
                  Total: S/ {totalGeneral.toFixed(2)}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ConfirmButton
                onConfirm={handleSubmit}
                onCancel={onClose}
                confirmLabel="Registrar Entrada"
                cancelLabel="Cancelar"
                isLoading={loading}
                confirmColor="success"
                confirmVariant="flat"
                cancelVariant="flat"
              />
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}