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
import { useUIConfig } from "@/providers/UIConfigProvider";

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

  const { config } = useUIConfig();

  const pages = Math.ceil(totalItems / perPage) || 1;

  // 🔍 TOP CONTENT - Buscador
  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-3 mb-3">
        <Input
          isClearable
          className="w-full sm:max-w-md"
          placeholder="Buscar..."
          startContent={<Search size={18} className="text-gray-400" />}
          value={searchQuery}
          onClear={() => onSearchChange("")}
          onValueChange={onSearchChange}
          variant="bordered"
          size={config.inputSize || "md"}
          classNames={{
            input: `${config.textSize || "text-sm"} text-gray-700`,
            inputWrapper: "border-gray-300 hover:border-blue-400 data-[hover=true]:border-blue-400 group-data-[focus=true]:border-blue-500",
            label: config.textSize || "text-sm"
          }}
        />
      </div>
    );
  }, [searchQuery, onSearchChange, config]);

  // 📊 BOTTOM CONTENT - Paginación
  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className={`${config.textSize || "text-sm"} text-gray-500 font-medium`}>
          Total de {totalItems} {totalItems === 1 ? 'registro' : 'registros'}
        </span>
        <Pagination
          isCompact
          showControls
          color="primary"
          page={page}
          total={pages}
          onChange={onPageChange}
          size={config.buttonSize === 'sm' ? 'sm' : config.buttonSize === 'lg' ? 'lg' : 'md'}
          classNames={{
            cursor: "bg-blue-500 text-white font-semibold shadow-sm",
            item: "text-gray-600 hover:bg-gray-100",
          }}
        />
      </div>
    );
  }, [page, pages, totalItems, onPageChange, config]);

  return (
    <Table
      aria-label="Tabla de datos"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      topContent={topContent}
      topContentPlacement="outside"
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      classNames={{
        wrapper: "shadow-sm border border-gray-200 rounded-lg bg-white",
        base: "overflow-visible",
        table: "min-w-full",
        // 📌 HEADER - Background sutil
        th: [
          `${config.textSize || "text-sm"}`,
          "font-semibold",
          "text-gray-700",
          "bg-gray-50",
          "uppercase",
          "tracking-wide",
        ].join(" "),
        // 📌 CELDAS - Limpias
        td: [
          `${config.tableCellSize || config.textSize || "text-sm"}`,
          "text-gray-700",
        ].join(" "),
        // 📌 FILAS - Hover suave
        tr: "hover:bg-gray-50 transition-colors",
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
        loadingContent={
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Spinner size="lg" color="primary" />
            <p className={`${config.textSize || "text-sm"} text-gray-500`}>
              Cargando datos...
            </p>
          </div>
        }
        isLoading={isLoading}
        emptyContent={
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mb-1">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className={`${config.textSize || "text-sm"} text-gray-600 font-medium`}>
              {emptyContent}
            </p>
            <p className="text-xs text-gray-400">
              Intenta ajustar tu búsqueda
            </p>
          </div>
        }
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