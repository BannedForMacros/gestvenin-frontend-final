// app/dashboard/inventario/entradas-central/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardBody, Chip, Divider, Button } from "@heroui/react";
import { ArrowLeft, Package, Calendar, User, FileText } from 'lucide-react';
import { toast } from "sonner";

import { entradasService } from '@/services/entradas.service';
import { EntradaCentral } from '@/types/entradas.types';

export default function DetalleEntradaPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [entrada, setEntrada] = useState<EntradaCentral | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await entradasService.getById(id);
        setEntrada(data);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar la entrada");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!entrada) return null;

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Detalle de Entrada #{entrada.id}</h1>
          <p className="text-slate-500 text-sm">Información completa del registro</p>
        </div>
        <Chip color={entrada.anulado ? "danger" : "success"} variant="flat">
          {entrada.anulado ? "Anulada" : "Procesada"}
        </Chip>
      </div>

      {/* Información General */}
      <Card>
        <CardBody className="gap-4">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Información General</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Package className="text-slate-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-slate-500">Tipo</p>
                <p className="font-semibold text-slate-900 capitalize">{entrada.tipo}</p>
              </div>
            </div>

            {entrada.requerimiento_id && (
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-slate-500">Requerimiento</p>
                  <p className="font-semibold text-slate-900">#{entrada.requerimiento_id}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="text-slate-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-slate-500">Fecha de Registro</p>
                <p className="font-semibold text-slate-900">
                  {new Date(entrada.creado_en).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="text-slate-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-slate-500">Creado por</p>
                <p className="font-semibold text-slate-900">Usuario #{entrada.creado_por}</p>
              </div>
            </div>
          </div>

          {entrada.observaciones && (
            <>
              <Divider className="my-2" />
              <div>
                <p className="text-sm text-slate-500 mb-1">Observaciones</p>
                <p className="text-slate-700">{entrada.observaciones}</p>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Detalle de Items */}
      <Card>
        <CardBody className="gap-4">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Productos Ingresados</h2>

          <div className="space-y-3">
            {entrada.items?.map((item, index) => (
              <Card key={item.id} shadow="sm" className="border border-slate-200">
                <CardBody className="gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.producto_nombre}</p>
                      <p className="text-sm text-slate-500">Código: {item.producto_codigo}</p>
                    </div>
                    <Chip size="sm" variant="flat">#{index + 1}</Chip>
                  </div>

                  <Divider className="my-1" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Cantidad</p>
                      <p className="font-semibold text-slate-900">
                        {item.cantidad} {item.unidad_abreviatura}
                      </p>
                      <p className="text-xs text-slate-400">
                        ({item.cantidad_base} {item.unidad_base_abreviatura})
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Precio Unit.</p>
                      <p className="font-semibold text-slate-900">S/ {Number(item.precio_unitario).toFixed(2)}</p>
                    </div>

                    <div>
                      <p className="text-slate-500">Total</p>
                      <p className="font-bold text-slate-900">S/ {Number(item.precio_total).toFixed(2)}</p>
                    </div>

                    {item.proveedor_nombre && (
                      <div>
                        <p className="text-slate-500">Proveedor</p>
                        <p className="font-semibold text-slate-900 text-xs">{item.proveedor_nombre}</p>
                      </div>
                    )}
                  </div>

                  {item.comprobante && (
                    <div className="mt-2 text-sm">
                      <span className="text-slate-500">Comprobante: </span>
                      <span className="font-medium text-slate-900">{item.comprobante}</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          <Divider className="my-2" />

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-slate-500">Total General</p>
              <p className="text-3xl font-bold text-slate-900">S/ {Number(entrada.total).toFixed(2)}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}