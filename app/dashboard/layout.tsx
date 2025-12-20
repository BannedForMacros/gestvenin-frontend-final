'use client'

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    // ✅ CAMBIO AQUÍ - Degradado sutil
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 overflow-hidden">
      
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-[270px] transition-all duration-300">
        
        {/* Header Móvil */}
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center px-4 shrink-0 shadow-sm">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-3 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <span className="font-bold text-slate-900">
              Gest<span className="text-orange-600">Venin</span>
            </span>
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}