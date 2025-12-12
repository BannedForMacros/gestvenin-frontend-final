'use client'

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar'; // Asegúrate que la ruta sea correcta
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Aquí invocamos al Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* 2. Área de contenido principal (a la derecha del sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64 transition-all duration-300">
        
        {/* Header Móvil (Solo visible en celus) */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 shrink-0">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-3"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-900">GestVenin</span>
        </header>

        {/* Contenido Dinámico (Las páginas) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}