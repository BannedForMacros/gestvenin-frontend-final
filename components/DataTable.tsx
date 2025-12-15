'use client';

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
  Spinner,
  SortDescriptor,
} from "@heroui/react";
import { Search } from "lucide-react";
import { useUIConfig } from "@/providers/UIConfigProvider"; // Importamos el contexto

// Definición de las columnas
export interface Column {
  name: string;
  uid: string;
  sortable?: boolean;
}

// Props del componente
interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  totalItems: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  emptyContent?: string;
  renderCell: (item: T, columnKey: React.Key) => React.ReactNode;
  
  // Ordenamiento
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  totalItems,
  page,
  perPage,
  onPageChange,
  searchQuery,
  onSearchChange,
  sortDescriptor,
  onSortChange,
  isLoading = false,
  emptyContent = "No se encontraron datos",
  renderCell,
}: DataTableProps<T>) {

  // 1. LEEMOS LA CONFIGURACIÓN DE UI (Tamaños de letra, inputs, etc.)
  const { config } = useUIConfig();

  const pages = Math.ceil(totalItems / perPage) || 1;

  // Renderizado del buscador (Top Content)
  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Buscar..."
            startContent={<Search className="text-default-400" />}
            value={searchQuery}
            onClear={() => onSearchChange("")}
            onValueChange={onSearchChange}
            variant="bordered"
            // APLICAMOS TAMAÑOS DESDE LA CONFIGURACIÓN
            size={config.inputSize} 
            classNames={{
              input: config.textSize, // El texto dentro del input
              label: config.textSize
            }}
          />
        </div>
      </div>
    );
  }, [searchQuery, onSearchChange, config]);

  // Renderizado de la paginación (Bottom Content)
  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className={`text-default-400 ${config.textSize}`}>
          Total {totalItems} registros
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={onPageChange}
          // Ajustamos el tamaño de la paginación según la config
          size={config.buttonSize === 'sm' ? 'sm' : config.buttonSize === 'lg' ? 'lg' : 'md'}
        />
      </div>
    );
  }, [page, pages, totalItems, onPageChange, config]);

  return (
    <Table
      aria-label="Tabla de datos dinámica"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      topContent={topContent}
      topContentPlacement="outside"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      classNames={{
        wrapper: "min-h-[322px]",
        // Aplicamos el tamaño de letra de la configuración a la cabecera
        th: `${config.textSize} font-bold text-slate-700 uppercase`, 
        // Aplicamos el padding y tamaño de letra a las celdas
        td: `${config.tableCellSize} text-slate-700`,
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "acciones" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={data}
        loadingContent={<Spinner label="Cargando..." size="lg" />}
        isLoading={isLoading}
        emptyContent={<div className={`p-4 ${config.textSize}`}>{emptyContent}</div>}
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}