'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Select, SelectItem, Divider, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Textarea 
} from "@heroui/react";
import { Save, Plus, Trash2, Calculator, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

import { CrearEntradaDto, EntradaItemDto } from '@/types/entradas.types';

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

// Interfaz auxiliar para evitar 'any'
interface RequerimientoItemRaw {
  productoId?: number;
  producto_id?: number;
  unidadMedidaId?: number;
  unidad_medida_id?: number;
  cantidad: number | string;
}

export function EntradaModal({ isOpen, onClose, onSubmit, loading }: EntradaModalProps) {
  
  // --- Estados de Catálogos ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]); 
  
  const [unidadesCache, setUnidadesCache] = useState<Record<number, ProductoUnidad[]>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);

  // --- Estados del Formulario ---
  const [tipo, setTipo] = useState<'manual' | 'requerimiento'>('manual');
  const [requerimientoId, setRequerimientoId] = useState<string>('');
  const [proveedorId, setProveedorId] = useState<string>('');
  const [comprobante, setComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Items
  const [items, setItems] = useState<EntradaItemDto[]>([]);

  // 1. Carga Inicial de Listas
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
        
        // Reset Form
        setTipo('manual');
        setRequerimientoId('');
        setProveedorId('');
        setComprobante('');
        setObservaciones('');
        setItems([]);
        setUnidadesCache({});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 2. 🔥 LÓGICA CORREGIDA: Cargar Items y sus Unidades
  useEffect(() => {
    if (tipo === 'requerimiento' && requerimientoId) {
        const cargarDetalleRequerimiento = async () => {
            try {
                const reqCompleto = await requerimientosService.getById(Number(requerimientoId));
                
                if (reqCompleto && reqCompleto.items) {
                    const itemsRaw = reqCompleto.items as unknown as RequerimientoItemRaw[];

                    // 1. Preparar los items
                    const nuevosItems: EntradaItemDto[] = itemsRaw.map((i) => ({
                        productoId: Number(i.productoId || i.producto_id),
                        unidadMedidaId: Number(i.unidadMedidaId || i.unidad_medida_id),
                        cantidad: Number(i.cantidad),
                        precioUnitario: 0,
                        precioTotal: 0
                    }));

                    // 2. Identificar qué productos NO tienen unidades en caché todavía
                    // Usamos un Set para no repetir IDs si el mismo producto aparece 2 veces
                    const productosFaltantes = new Set<number>();
                    nuevosItems.forEach(item => {
                        if (item.productoId && !unidadesCache[item.productoId]) {
                            productosFaltantes.add(item.productoId);
                        }
                    });

                    // 3. Cargar las unidades faltantes EN PARALELO
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
                        
                        // 4. Actualizar la caché de una sola vez
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

                    // 5. FINALMENTE seteamos los items (La caché ya estará lista o actualizándose)
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
  }, [requerimientoId, tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Lógica de Items ---
  const agregarItem = () => {
    setItems([...items, { productoId: 0, unidadMedidaId: 0, cantidad: 1, precioUnitario: 0, precioTotal: 0 }]);
  };

  const eliminarItem = (index: number) => {
    const nuevos = [...items]; 
    nuevos.splice(index, 1); 
    setItems(nuevos);
  };

  const actualizarItem = async (index: number, field: keyof EntradaItemDto, value: number) => {
    const nuevos = [...items];
    const item = { ...nuevos[index], [field]: value };

    // Cambio de Producto
    if (field === 'productoId') {
        item.unidadMedidaId = 0; 
        if (!unidadesCache[value]) {
            try {
                const unidades = await productosService.getUnidades(value);
                setUnidadesCache(prev => ({ ...prev, [value]: unidades }));
            } catch (error) {
                console.error("Error cargando unidades", error);
            }
        }
    }
    
    // Cálculos
    if (field === 'cantidad' || field === 'precioUnitario') {
        item.precioTotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
    }

    nuevos[index] = item;
    setItems(nuevos);
  };

  const totalGeneral = useMemo(() => items.reduce((acc, curr) => acc + curr.precioTotal, 0), [items]);

  const handleSubmit = () => {
    if (tipo === 'manual' && !proveedorId) return toast.warning("Seleccione un proveedor");
    if (tipo === 'requerimiento' && !requerimientoId) return toast.warning("Seleccione un requerimiento");
    if (items.length === 0) return toast.warning("Agregue al menos un producto");
    
    const itemsIncompletos = items.some(i => !i.productoId || !i.unidadMedidaId || i.cantidad <= 0);
    if (itemsIncompletos) return toast.warning("Complete los datos de los productos");

    onSubmit({
      tipo,
      requerimientoId: tipo === 'requerimiento' ? Number(requerimientoId) : undefined,
      proveedorId: tipo === 'manual' ? Number(proveedorId) : undefined,
      comprobante,
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

              {/* --- ENCABEZADO --- */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <Select 
                    label="Tipo de Entrada" 
                    selectedKeys={[tipo]} 
                    onChange={(e) => {
                        const nuevoTipo = e.target.value as 'manual' | 'requerimiento';
                        setTipo(nuevoTipo);
                        setItems([]); // 🧹 Limpiar items al cambiar tipo
                        setRequerimientoId(''); 
                        setProveedorId('');
                    }}
                    variant="bordered"
                    disallowEmptySelection
                >
                    <SelectItem key="manual">Manual (Directa)</SelectItem>
                    <SelectItem key="requerimiento">Desde Requerimiento</SelectItem>
                </Select>

                {tipo === 'manual' ? (
                     <Select 
                        label="Proveedor" 
                        placeholder="Seleccione proveedor"
                        selectedKeys={proveedorId ? [proveedorId] : []}
                        onChange={(e) => setProveedorId(e.target.value)}
                        variant="bordered"
                        className="md:col-span-2"
                        items={proveedores} 
                     >
                        {(p) => (
                            <SelectItem key={p.id} textValue={p.razon_social}>
                                {p.razon_social} ({p.ruc})
                            </SelectItem>
                        )}
                     </Select>
                ) : (
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
                            <SelectItem key={req.id} textValue={req.codigo}>
                                <div className="flex flex-col">
                                    <span className="font-bold">{req.codigo}</span>
                                    <span className="text-xs text-slate-500">
                                        Fecha: {formatearFecha(req.creado_en)}
                                    </span>
                                </div>
                            </SelectItem>
                        )}
                    </Select>
                )}

                <Input 
                    label="N° Comprobante / Guía" 
                    placeholder="F001-456" 
                    value={comprobante}
                    onValueChange={setComprobante}
                    variant="bordered"
                />
                
                <div className="md:col-span-4">
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

              {/* --- DETALLE DE ITEMS --- */}
              <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calculator size={18} /> Detalle de Productos
                 </h3>
                 <Button size="sm" color="primary" variant="flat" onPress={agregarItem} startContent={<Plus size={16}/>}>
                    Agregar Producto
                 </Button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table aria-label="Tabla de items" removeWrapper shadow="none">
                    <TableHeader>
                        <TableColumn>PRODUCTO</TableColumn>
                        <TableColumn width={150}>UNIDAD</TableColumn>
                        <TableColumn width={100}>CANTIDAD</TableColumn>
                        <TableColumn width={120}>P. UNITARIO</TableColumn>
                        <TableColumn width={120}>TOTAL</TableColumn>
                        <TableColumn width={50} align="center"> </TableColumn>
                    </TableHeader>
                    <TableBody items={items} emptyContent="Seleccione un requerimiento o agregue productos manualmente">
                        {(item: EntradaItemDto) => { 
                            const index = items.indexOf(item);
                            // Recuperamos unidades desde la caché local
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
                                        <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => eliminarItem(index)}>
                                            <Trash2 size={16}/>
                                        </Button>
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
              <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
              <Button className="bg-slate-900 text-white" onPress={handleSubmit} isLoading={loading} startContent={!loading && <Save size={18}/>}>
                Registrar Entrada
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}