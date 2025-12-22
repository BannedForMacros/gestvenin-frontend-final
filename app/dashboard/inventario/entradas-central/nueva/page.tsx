// app/dashboard/inventario/entradas-central/nueva/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  Card, 
  CardBody, 
  Select, 
  SelectItem, 
  Textarea, 
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from "@heroui/react";
import { ArrowLeft, Plus, Trash2, Save, Calculator, Package } from 'lucide-react';
import { toast } from "sonner";

import { productosService } from '@/services/productos.service';
import { proveedoresService } from '@/services/proveedores.service';
import { requerimientosService } from '@/services/requerimientos.service';
import { entradasService } from '@/services/entradas.service';

import { Producto, ProductoUnidad } from '@/types/productos.types';
import { Proveedor } from '@/types/proveedores.types';
import { Requerimiento } from '@/types/requerimientos.types';
import { EntradaItemDto, CrearEntradaDto } from '@/types/entradas.types';

interface RequerimientoItemRaw {
  productoId?: number;
  producto_id?: number;
  unidadMedidaId?: number;
  unidad_medida_id?: number;
  cantidad: number | string;
}

export default function NuevaEntradaPage() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [unidadesCache, setUnidadesCache] = useState<Record<number, ProductoUnidad[]>>({});

  const [tipo, setTipo] = useState<'manual' | 'requerimiento'>('manual');
  const [requerimientoId, setRequerimientoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<EntradaItemDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodsRes, provsRes, reqsRes] = await Promise.all([
          productosService.getAll(1, 100),
          proveedoresService.getAll(1, 100),
          requerimientosService.getAll(1, 100, '', 'aprobado')
        ]);

        setProductos(prodsRes.data);
        setProveedores(provsRes.data);
        setRequerimientos(reqsRes.data);
      } catch (error) {
        console.error(error);
        toast.error("Error cargando datos");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

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
      precioTotal: 0
    }]);
  };

  const eliminarItem = (index: number) => {
    const nuevos = [...items];
    nuevos.splice(index, 1);
    setItems(nuevos);
  };

  const actualizarItem = async (
    index: number,
    field: keyof EntradaItemDto,
    value: number | string | undefined
  ) => {
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

  const totalGeneral = items.reduce((acc, curr) => acc + curr.precioTotal, 0);

  const handleSubmit = async () => {
    if (tipo === 'requerimiento' && !requerimientoId) {
      return toast.warning("Seleccione un requerimiento");
    }
    if (items.length === 0) {
      return toast.warning("Agregue al menos un producto");
    }

    const itemsIncompletos = items.some(i => !i.productoId || !i.unidadMedidaId || i.cantidad <= 0);
    if (itemsIncompletos) {
      return toast.warning("Complete los datos de los productos");
    }

    setLoading(true);
    try {
      const dto: CrearEntradaDto = {
        tipo,
        requerimientoId: tipo === 'requerimiento' ? Number(requerimientoId) : undefined,
        observaciones,
        items
      };

      await entradasService.create(dto);
      toast.success("Entrada registrada exitosamente");
      router.push('/dashboard/inventario/entradas-central');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al guardar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="flat" onPress={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Nueva Entrada de Inventario</h1>
          <p className="text-slate-500 text-sm">Complete la información para registrar el ingreso</p>
        </div>
        <Chip startContent={<Package size={16} />} variant="flat" color="primary">
          {items.length} productos
        </Chip>
      </div>

      {loadingData && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-slate-600">Cargando datos...</span>
            </div>
          </CardBody>
        </Card>
      )}

      {!loadingData && (
        <>
          {/* Información General */}
          <Card>
            <CardBody className="gap-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  1
                </div>
                Información General
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    label="Requerimiento Aprobado"
                    placeholder="Seleccione..."
                    selectedKeys={requerimientoId ? [requerimientoId] : []}
                    onChange={(e) => setRequerimientoId(e.target.value)}
                    variant="bordered"
                    className="md:col-span-2"
                    items={requerimientos}
                  >
                    {(req) => (
                      <SelectItem key={req.id} textValue={`#${req.id}`}>
                        <div className="flex flex-col">
                          <span className="font-bold">#{req.id}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(req.creado_en).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                )}

                <Textarea
                  label="Observaciones"
                  placeholder="Detalles adicionales..."
                  value={observaciones}
                  onValueChange={setObservaciones}
                  variant="bordered"
                  minRows={2}
                  className="md:col-span-3"
                />
              </div>
            </CardBody>
          </Card>

          {/* Tabla de Productos */}
          <Card>
            <CardBody className="gap-4 p-0">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  Detalle de Productos
                </h2>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Plus size={16} />}
                  onPress={agregarItem}
                >
                  Agregar
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table 
                  aria-label="Tabla de productos"
                  removeWrapper
                  classNames={{
                    th: "bg-slate-50 text-slate-700 font-semibold",
                    td: "py-3"
                  }}
                >
                  <TableHeader>
                    <TableColumn width={40}>#</TableColumn>
                    <TableColumn width={250}>PRODUCTO</TableColumn>
                    <TableColumn width={180}>PROVEEDOR</TableColumn>
                    <TableColumn width={120}>COMPROBANTE</TableColumn>
                    <TableColumn width={140}>UNIDAD</TableColumn>
                    <TableColumn width={100}>CANTIDAD</TableColumn>
                    <TableColumn width={120}>P. UNITARIO</TableColumn>
                    <TableColumn width={120}>TOTAL</TableColumn>
                    <TableColumn width={50}> </TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay productos. Haz clic en 'Agregar' para comenzar.">
                    {items.map((item, index) => {
                      const unidadesDisponibles = item.productoId ? unidadesCache[item.productoId] : [];

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip size="sm" variant="flat">{index + 1}</Chip>
                          </TableCell>

                          <TableCell>
                            <Select
                              aria-label="Producto"
                              placeholder="Seleccione..."
                              size="sm"
                              variant="bordered"
                              selectedKeys={item.productoId ? [String(item.productoId)] : []}
                              onChange={(e) => actualizarItem(index, 'productoId', Number(e.target.value))}
                              items={productos}
                              classNames={{ trigger: "min-h-[36px]" }}
                            >
                              {(p) => <SelectItem key={p.id}>{p.nombre}</SelectItem>}
                            </Select>
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
                              classNames={{ trigger: "min-h-[36px]" }}
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
                              classNames={{ inputWrapper: "min-h-[36px]" }}
                            />
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
                              classNames={{ trigger: "min-h-[36px]" }}
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
                              type="number"
                              size="sm"
                              variant="bordered"
                              min={0.01}
                              step={0.01}
                              value={String(item.cantidad)}
                              onValueChange={(v) => actualizarItem(index, 'cantidad', Number(v))}
                              classNames={{ inputWrapper: "min-h-[36px]" }}
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              size="sm"
                              variant="bordered"
                              min={0}
                              step={0.01}
                              startContent={<span className="text-xs text-slate-400">S/</span>}
                              value={String(item.precioUnitario)}
                              onValueChange={(v) => actualizarItem(index, 'precioUnitario', Number(v))}
                              classNames={{ inputWrapper: "min-h-[36px]" }}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="font-bold text-slate-900">
                              S/ {item.precioTotal.toFixed(2)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => eliminarItem(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardBody>
          </Card>

          {/* Footer con Total y Acciones */}
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <Calculator size={28} className="text-primary" />
                  <div>
                    <p className="text-sm text-slate-500">Total General</p>
                    <p className="text-3xl font-bold text-slate-900">S/ {totalGeneral.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="flat" onPress={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button
                    color="success"
                    variant="flat"
                    startContent={!loading && <Save size={18} />}
                    onPress={handleSubmit}
                    isLoading={loading}
                  >
                    Guardar Entrada
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}