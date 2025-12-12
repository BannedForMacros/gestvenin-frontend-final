'use client'

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { Key, ShieldCheck } from "lucide-react";
import { permisosService } from '@/services/permisos.service';
import { Permiso } from '@/types/permisos.types';

export default function PermisosPage() {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    permisosService.getAll()
      .then(setPermisos)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Agrupar permisos por Módulo
  const groupedPermisos = permisos.reduce((acc, curr) => {
    if (!acc[curr.modulo]) acc[curr.modulo] = [];
    acc[curr.modulo].push(curr);
    return acc;
  }, {} as Record<string, Permiso[]>);

  if (isLoading) return <div className="text-slate-500">Cargando permisos...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catálogo de Permisos</h1>
        <p className="text-slate-500">Lista de todos los permisos disponibles en el sistema.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedPermisos).map(([modulo, items]) => (
          <Card key={modulo} className="bg-white border-none shadow-sm">
            <CardHeader className="flex gap-3 px-6 pt-6">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <ShieldCheck size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-md font-bold text-slate-900">{modulo}</p>
                <p className="text-small text-slate-500">{items.length} permisos</p>
              </div>
            </CardHeader>
            <Divider className="my-2"/>
            <CardBody className="px-6 pb-6 pt-2">
              <div className="flex flex-col gap-3">
                {items.map((permiso) => (
                  <div key={permiso.id} className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-700">{permiso.nombre}</p>
                        <p className="text-xs text-slate-400 font-mono">{permiso.codigo}</p>
                    </div>
                    <Key size={14} className="text-orange-400 mt-1" />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}