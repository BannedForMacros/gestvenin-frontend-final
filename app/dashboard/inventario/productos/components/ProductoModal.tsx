'use client'

import React, { useEffect, useState } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  Button, Input, Textarea, Select, SelectItem, Divider, Chip
} from "@heroui/react";
import { AlertCircle, Plus, Trash2, Scale } from 'lucide-react';

import { CrearProductoDto, Producto, ProductoUnidadDto } from '@/types/productos.types';
import { UnidadMedida } from '@/types/unidades.types';
import { Categoria } from '@/types/categorias.types';

import { unidadesService } from '@/services/unidades.service';
import { categoriasService } from '@/services/categorias.service';
import { useUIConfig } from "@/providers/UIConfigProvider";

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearProductoDto) => Promise<void>;
  productoAEditar: Producto | null;
}

export function ProductoModal({ isOpen, onClose, onSubmit, productoAEditar }: ProductoModalProps) {
  const { config } = useUIConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listaUnidades, setListaUnidades] = useState<UnidadMedida[]>([]);
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const [stockMinimo, setStockMinimo] = useState<number>(0);
  const [unidadesAsignadas, setUnidadesAsignadas] = useState<ProductoUnidadDto[]>([]);

  // 1. Cargar Listas (Unidades y Categorías)
  useEffect(() => {
    if (isOpen) {
      const loadCatalogos = async () => {
        try {
          const [u, c] = await Promise.all([
            unidadesService.getAllList(),
            categoriasService.getAllList()
          ]);
          setListaUnidades(u);
          setListaCategorias(c);
        } catch (e) {
          console.error("Error cargando catalogos", e);
        }
      };
      loadCatalogos();
    }
  }, [isOpen]);

  // 2. Cargar Datos del Producto a Editar
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (productoAEditar) {
        setNombre(productoAEditar.nombre);
        setCodigo(productoAEditar.codigo || '');
        setCodigoBarras(productoAEditar.codigo_barras || '');
        setDescripcion(productoAEditar.descripcion || '');
        
        // ✅ CORRECCIÓN 1: Forzamos la conversión a Number() al cargar
        // Esto soluciona que "90" (string) llegue como número real.
        setCategoriaId(productoAEditar.categoria_id ? Number(productoAEditar.categoria_id) : undefined);
        setStockMinimo(productoAEditar.stock_minimo ? Number(productoAEditar.stock_minimo) : 0);

        if (productoAEditar.unidades && productoAEditar.unidades.length > 0) {
           setUnidadesAsignadas(productoAEditar.unidades.map(u => ({
             unidadMedidaId: u.unidad_medida_id,
             esUnidadBase: u.es_unidad_base
           })));
        } else {
           setUnidadesAsignadas([]); 
        }
      } else {
        // Resetear formulario para crear
        setNombre('');
        setCodigo('');
        setCodigoBarras('');
        setDescripcion('');
        setCategoriaId(undefined);
        setStockMinimo(0);
        setUnidadesAsignadas([{ unidadMedidaId: 0, esUnidadBase: true }]);
      }
    }
  }, [isOpen, productoAEditar]);

  // --- Lógica de Unidades ---

  const agregarFilaUnidad = () => {
    setUnidadesAsignadas([...unidadesAsignadas, { unidadMedidaId: 0, esUnidadBase: false }]);
  };

  const eliminarFilaUnidad = (index: number) => {
    const nuevas = [...unidadesAsignadas];
    nuevas.splice(index, 1);
    // Si borramos la base, asignamos la propiedad a la primera fila restante
    if (nuevas.length > 0 && !nuevas.some(u => u.esUnidadBase)) {
        nuevas[0].esUnidadBase = true;
    }
    setUnidadesAsignadas(nuevas);
  };

  const actualizarFilaUnidad = (index: number, campo: keyof ProductoUnidadDto, valor: number | boolean) => {
    const nuevas = [...unidadesAsignadas];
    
    if (campo === 'esUnidadBase') {
      nuevas.forEach((u, i) => {
        u.esUnidadBase = (i === index);
      });
    } else {
      // ✅ Tipado seguro
      (nuevas[index] as unknown as Record<string, number | boolean>)[campo] = valor;
    }
    setUnidadesAsignadas(nuevas);
  };

  // --- Submit ---

  const handleSubmit = async () => {
    // Validaciones
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (unidadesAsignadas.length === 0) return setError("Debes asignar al menos una unidad.");
    
    const tieneBase = unidadesAsignadas.some(u => u.esUnidadBase);
    if (!tieneBase) return setError("Debes marcar una unidad como UNIDAD BASE.");

    const unidadesValidas = unidadesAsignadas.every(u => u.unidadMedidaId > 0);
    if (!unidadesValidas) return setError("Selecciona la unidad de medida en todas las filas.");

    const ids = unidadesAsignadas.map(u => u.unidadMedidaId);
    const duplicados = ids.some((id, idx) => ids.indexOf(id) !== idx);
    if (duplicados) return setError("No puedes asignar la misma unidad dos veces.");

    setLoading(true);
    try {
      const dto: CrearProductoDto = {
        nombre,
        codigo: codigo || undefined,
        codigoBarras: codigoBarras || undefined,
        descripcion: descripcion || undefined,
        categoriaId: categoriaId,
        // ✅ CORRECCIÓN 2: Aseguramos que se envíe como número al backend también
        stockMinimo: Number(stockMinimo), 
        unidades: unidadesAsignadas
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

  // Estilos dinámicos
  const inputClasses = { input: config.textSize, label: config.textSize };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center" size="3xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <span className="text-2xl font-bold">
                {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
              </span>
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="bg-danger-50 text-danger-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-danger-200 mb-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* FILA 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  autoFocus
                  label="Nombre del Producto"
                  variant="bordered"
                  value={nombre}
                  onValueChange={setNombre}
                  isRequired
                  size={config.inputSize}
                  classNames={inputClasses}
                />
                <Select
                  label="Categoría"
                  placeholder="Seleccione..."
                  variant="bordered"
                  selectedKeys={categoriaId ? [categoriaId.toString()] : []}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                  size={config.inputSize}
                  classNames={{ value: config.textSize, label: config.textSize }}
                >
                  {listaCategorias.map((c) => (
                    <SelectItem key={c.id} textValue={c.nombre}>{c.nombre}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* FILA 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <Input
                  label="Código Interno"
                  variant="bordered"
                  value={codigo}
                  onValueChange={setCodigo}
                  size={config.inputSize}
                  classNames={inputClasses}
                />
                <Input
                  label="Código de Barras"
                  variant="bordered"
                  value={codigoBarras}
                  onValueChange={setCodigoBarras}
                  size={config.inputSize}
                  classNames={inputClasses}
                />
                <Input
                  type="number"
                  label="Stock Mínimo"
                  variant="bordered"
                  // Value debe ser string para el input
                  value={stockMinimo.toString()}
                  // Al escribir convertimos a número inmediatamente
                  onValueChange={(v) => setStockMinimo(Number(v))}
                  size={config.inputSize}
                  classNames={inputClasses}
                />
              </div>

              <Textarea
                label="Descripción"
                variant="bordered"
                minRows={2}
                value={descripcion}
                onValueChange={setDescripcion}
                classNames={inputClasses}
                className="mt-2"
              />

              <Divider className="my-2" />

              {/* TABLA DE UNIDADES */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-2 items-center text-slate-700 font-bold">
                    <Scale size={20} />
                    <span className={config.headerSize}>Asignación de Unidades</span>
                  </div>
                  <Button size="sm" color="primary" variant="flat" onPress={agregarFilaUnidad} startContent={<Plus size={16}/>}>
                    Agregar Unidad
                  </Button>
                </div>

                <div className="space-y-3">
                  {unidadesAsignadas.map((fila, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                      
                      {/* Select Unidad */}
                      <div className="col-span-6 md:col-span-7">
                        <Select
                          aria-label="Seleccionar unidad"
                          placeholder="Unidad..."
                          size="sm"
                          variant="bordered"
                          selectedKeys={fila.unidadMedidaId ? [fila.unidadMedidaId.toString()] : []}
                          onChange={(e) => actualizarFilaUnidad(index, 'unidadMedidaId', Number(e.target.value))}
                          classNames={{ value: "text-sm" }}
                        >
                          {listaUnidades.map((u) => (
                            <SelectItem key={u.id} textValue={u.nombre}>
                              {u.nombre} ({u.abreviatura})
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* Checkbox Base */}
                      <div className="col-span-4 md:col-span-3 flex justify-center">
                        {fila.esUnidadBase ? (
                          <Chip color="success" variant="flat" size="sm" className="cursor-default">Base Principal</Chip>
                        ) : (
                          <div 
                            className="text-sm text-slate-400 cursor-pointer hover:text-primary underline"
                            onClick={() => actualizarFilaUnidad(index, 'esUnidadBase', true)}
                          >
                            Marcar como Base
                          </div>
                        )}
                      </div>

                      {/* Botón Eliminar */}
                      <div className="col-span-2 md:col-span-2 flex justify-center">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          color="danger" 
                          variant="light" 
                          onPress={() => eliminarFilaUnidad(index)}
                          isDisabled={unidadesAsignadas.length === 1}
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
                {productoAEditar ? 'Guardar Cambios' : 'Crear Producto'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}