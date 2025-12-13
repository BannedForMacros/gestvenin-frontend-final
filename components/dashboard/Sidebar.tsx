'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { 
  LogOut, ChevronDown, ChevronRight, Store, X, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from '@/services/auth.service'; 
import { UserSession } from '@/types/auth.types';
import { getIcon } from '@/lib/icon-map'; // <--- Asegúrate que esta ruta exista

// Interfaz para el menú que viene de la BD
interface MenuItemDB {
  id: number;
  codigo: string;
  titulo: string;
  icono: string;
  ruta: string | null;
  hijos?: MenuItemDB[];
}

export function Sidebar({ 
  isMobileOpen, 
  setIsMobileOpen 
}: { 
  isMobileOpen: boolean, 
  setIsMobileOpen: (v: boolean) => void 
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // MANTENEMOS TU LÓGICA DE USUARIO EXACTA
  const [user, setUser] = useState<UserSession | null>(null);
  
  // Estados nuevos para el menú dinámico
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'configuracion': true // Configuración abierta por defecto si viene del backend
  });

  // useEffect Combinado: Carga Usuario (Tu lógica) + Carga Menús (Nueva lógica)
  useEffect(() => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        
        // 1. Cargar Usuario (Tu método seguro con setTimeout)
        if (userStr) {
          try {
            const parsedUser = JSON.parse(userStr) as UserSession;
            setTimeout(() => {
              setUser(parsedUser);
            }, 0);
          } catch (e) {
            console.error("Error leyendo sesión", e);
          }
        }

        // 2. Cargar Menús Dinámicos (Solo si hay token)
        // Esto corre en paralelo y no afecta al setUser
        authService.getMyMenus()
          .then((data) => setMenuItems(data))
          .catch((err) => {
             console.error("Error cargando menús:", err);
             // Si falla, podrías dejar un array vacío o manejar el error
          })
          .finally(() => setLoadingMenu(false));
      }
    }, []); 

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const toggleSubmenu = (codigo: string) => {
    setOpenMenus(prev => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const isActive = (path: string | null) => path ? pathname === path : false;
  
  // Función recursiva para renderizar menús y submenús
  const renderMenuItem = (item: MenuItemDB) => {
    const Icon = getIcon(item.icono); // Traducimos texto -> Icono React
    const hasChildren = item.hijos && item.hijos.length > 0;
    const isOpen = openMenus[item.codigo];

    // CASO A: Menú con hijos (Submenú desplegable)
    if (hasChildren) {
      return (
        <div key={item.id} className="pt-1">
          <div 
            onClick={() => toggleSubmenu(item.codigo)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-slate-300 hover:bg-slate-800 hover:text-white`}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              <span className="font-medium">{item.titulo}</span>
            </div>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-1 border-l border-slate-800 ml-5 pl-3">
                  {item.hijos!.map(child => renderMenuItem(child))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // CASO B: Enlace simple
    return (
      <Link key={item.id} href={item.ruta || '#'}>
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${isActive(item.ruta) ? 'bg-orange-600 text-white font-medium shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <Icon size={20} />
          <span>{item.titulo}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay Móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 transition-transform duration-300 border-r border-slate-800 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white mr-3">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GestVenin</span>
            <button className="ml-auto lg:hidden" onClick={() => setIsMobileOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navegación Dinámica */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            {loadingMenu ? (
              <div className="flex justify-center mt-10">
                <Loader2 className="animate-spin text-orange-500" />
              </div>
            ) : (
              // Aquí renderizamos lo que devuelve el backend
              menuItems.map(item => renderMenuItem(item))
            )}
            
            {/* Fallback visual si no hay menús */}
            {!loadingMenu && menuItems.length === 0 && (
                <p className="text-center text-slate-500 text-sm mt-4">Sin menús asignados</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            {user ? (
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={user.nombreCompleto || "U"} className="w-10 h-10 text-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user.nombreCompleto}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{user.rol}</p>
                </div>
              </div>
            ) : (
              // Skeleton simple mientras carga usuario
              <div className="flex items-center gap-3 mb-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
                <div className="space-y-2">
                   <div className="w-20 h-2 bg-slate-800 rounded"></div>
                   <div className="w-12 h-2 bg-slate-800 rounded"></div>
                </div>
              </div>
            )}
            <Button size="sm" variant="flat" color="danger" className="w-full justify-start" startContent={<LogOut size={16} />} onPress={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}