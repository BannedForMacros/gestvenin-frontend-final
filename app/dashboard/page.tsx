'use client'

import { useEffect, useState } from 'react';
import { Card, CardBody, Button } from "@heroui/react";
import { 
  Users, 
  Store, 
  TrendingUp, 
  DollarSign, 
  PackagePlus, 
  UserPlus, 
  Settings,
  BarChart4
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          // SOLUCIÓN AL ERROR DE ESLINT:
          // Usamos setTimeout para sacar la actualización del ciclo síncrono
          setTimeout(() => {
            setUserName(u.nombreCompleto.split(' ')[0]); 
          }, 0);
        } catch (e) {
            console.error(e);
        }
      }
    }
  }, []);

  const stats = [
    { title: "Ventas Hoy", value: "S/. 0.00", icon: DollarSign, color: "bg-green-100 text-green-600" },
    { title: "Pedidos", value: "0", icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
    { title: "Usuarios", value: "0", icon: Users, color: "bg-purple-100 text-purple-600" },
    { title: "Locales", value: "1", icon: Store, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header con Saludo */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
            Hola, <span className="text-orange-600">{userName || 'Usuario'}</span> 👋
        </h1>
        <p className="text-slate-500 mt-1">Aquí tienes el resumen de tu negocio en tiempo real.</p>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardBody className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Sección Principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Placeholder de Gráfica */}
        <Card className="lg:col-span-2 min-h-[300px] border-none shadow-sm p-6 bg-white">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <BarChart4 size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Resumen de Ventas</h3>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 min-h-[200px]">
                <BarChart4 size={48} className="text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm font-medium">No hay datos suficientes para mostrar la gráfica</p>
                <p className="text-slate-400 text-xs">Comienza a registrar ventas para ver estadísticas</p>
            </div>
        </Card>
        
        {/* Accesos Rápidos */}
        <Card className="min-h-[300px] border-none shadow-sm p-6 bg-white">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <Settings size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Accesos Rápidos</h3>
            </div>
            
            <div className="space-y-3">
                <Button 
                    fullWidth 
                    variant="flat" 
                    className="bg-slate-50 text-slate-700 justify-start h-12 hover:bg-slate-100"
                    startContent={<PackagePlus size={20} className="text-orange-600"/>}
                >
                    Registrar Producto
                </Button>
                
                <Button 
                    fullWidth 
                    variant="flat" 
                    className="bg-slate-50 text-slate-700 justify-start h-12 hover:bg-slate-100"
                    startContent={<UserPlus size={20} className="text-blue-600"/>}
                >
                    Crear Nuevo Usuario
                </Button>
                
                <Button 
                    fullWidth 
                    variant="flat" 
                    className="bg-slate-50 text-slate-700 justify-start h-12 hover:bg-slate-100"
                    startContent={<Store size={20} className="text-purple-600"/>}
                >
                    Configurar Locales
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}