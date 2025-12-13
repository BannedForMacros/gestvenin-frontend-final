'use client'

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Button, Input, Tooltip, Chip, useDisclosure,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle 
} from "lucide-react";
import { productosService } from '@/services/productos.service';
import { Producto, CrearProductoDto } from '@/types/productos.types';
import { ProductoModal } from './components/ProductoModal';

export default function ProductosPage() {
  // Estados de datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Modales
  const { isOpen, onOpen, onOpenChange } = useDisclosure(); // Modal Formulario
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Modal Eliminar
  
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  // Cargar datos
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await productosService.getAll();
      setProductos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrado (Búsqueda local simple)
  const filteredProductos = productos.filter((p) => 
    p.nombre.toLowerCase().includes(filterValue.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(filterValue.toLowerCase()))
  );

  // --- MANEJADORES ---

  const handleCreate = () => {
    setSelectedProducto(null);
    onOpen();
  };

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto);
    onOpen();
  };

  const handleDeleteClick = (producto: Producto) => {
    setSelectedProducto(producto);
    setDeleteModalOpen(true);
  };

  const onFormSubmit = async (data: CrearProductoDto) => {
    if (selectedProducto) {
      await productosService.update(selectedProducto.id, data);
    } else {
      await productosService.create(data);
    }
    fetchData(); // Recargar tabla
  };

  const confirmDelete = async () => {
    if (!selectedProducto) return;
    try {
      await productosService.delete(selectedProducto.id);
      setDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error al eliminar"); // Aquí podrías usar un estado de error en el modal
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Cabecera y Buscador */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario de Productos</h1>
          <p className="text-slate-500">Gestiona el catálogo de productos de tu empresa.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            placeholder="Buscar por nombre o código..."
            size="sm"
            startContent={<Search className="text-default-300" />}
            value={filterValue}
            onClear={() => setFilterValue("")}
            onValueChange={setFilterValue}
            className="w-full sm:w-64"
          />
          <Button onPress={handleCreate} color="primary" endContent={<Plus />}>
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Table aria-label="Tabla de productos" classNames={{ wrapper: "min-h-[222px]" }}>
        <TableHeader>
          <TableColumn>PRODUCTO</TableColumn>
          <TableColumn>CATEGORÍA</TableColumn>
          <TableColumn>UNIDAD</TableColumn>
          <TableColumn>STOCK MÍN.</TableColumn>
          <TableColumn align="center">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody 
          items={filteredProductos}
          isLoading={isLoading}
          loadingContent={<p>Cargando inventario...</p>}
          emptyContent={"No se encontraron productos"}
        >
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 text-primary rounded-lg">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{item.nombre}</p>
                    <p className="text-tiny text-slate-500">{item.codigo || 'S/C'}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {item.categoria ? (
                    <Chip size="sm" variant="flat">{item.categoria}</Chip>
                ) : <span className="text-slate-400">-</span>}
              </TableCell>
              <TableCell>
                <span className="capitalize text-sm">{item.unidad_medida.toLowerCase()}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.stock_minimo}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="relative flex items-center justify-center gap-2">
                  <Tooltip content="Editar">
                    <span 
                      onClick={() => handleEdit(item)} 
                      className="text-lg text-default-400 cursor-pointer active:opacity-50 hover:text-primary"
                    >
                      <Edit3 size={18} />
                    </span>
                  </Tooltip>
                  <Tooltip color="danger" content="Eliminar">
                    <span 
                      onClick={() => handleDeleteClick(item)} 
                      className="text-lg text-danger cursor-pointer active:opacity-50 hover:text-danger-400"
                    >
                      <Trash2 size={18} />
                    </span>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 1. Modal Formulario (Componente separado) */}
      <ProductoModal 
        isOpen={isOpen} 
        onClose={onOpenChange} 
        onSubmit={onFormSubmit} 
        productoAEditar={selectedProducto} 
      />

      {/* 2. Modal de Confirmación de Eliminación (Nativo de HeroUI) */}
      <Modal 
        isOpen={deleteModalOpen} 
        onOpenChange={setDeleteModalOpen}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-danger">
                <AlertTriangle size={24}/> Confirmar Eliminación
              </ModalHeader>
              <ModalBody>
                <p>¿Estás seguro que deseas eliminar el producto <b>{selectedProducto?.nombre}</b>?</p>
                <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="danger" onPress={confirmDelete}>
                  Sí, Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}