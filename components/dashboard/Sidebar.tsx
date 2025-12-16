'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { 
  LogOut, ChevronDown, ChevronRight, Store, X, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from '@/services/auth.service';
import { MenuItem } from '@/types/auth.types';
import { useAuth } from '@/providers/AuthProvider';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'configuracion': true
  });

  useEffect(() => {
    const fetchMenus = async () => {
      setLoadingMenu(true);
      try {
        const data = await authService.getMyMenus();
        setMenuItems(data);
      } catch (err) {
        console.error("Error cargando menús:", err);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenus();
  }, []);

  const toggleSubmenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ✅ VERIFICACIÓN MÁS ESTRICTA: Solo activo si la ruta coincide EXACTAMENTE
  const isActive = (path: string) => {
    if (!path || path === '#') return false;
    
    // Normalizar rutas (quitar slash final si existe)
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
    
    return normalizedPathname === normalizedPath;
  };

  // --- RENDERIZADO RECURSIVO ---
  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon; 
    const hasChildren = item.items && item.items.length > 0;
    
    const menuKey = item.id ? String(item.id) : item.title;
    const isOpen = openMenus[menuKey];
    const reactKey = item.id || item.title + Math.random();

    // --- CASO A: Menú PADRE (Con hijos) ---
    if (hasChildren) {
      return (
        <div key={reactKey} className="pt-1">
          <div 
            onClick={() => toggleSubmenu(menuKey)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors 
              ${isOpen 
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              <span className="font-medium">{item.title}</span>
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
                <div className="mt-1 space-y-1 ml-3 border-l border-slate-700 pl-3">
                  {item.items!.map(child => renderMenuItem(child))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // --- CASO B: Enlace SIMPLE ---
    const isItemActive = isActive(item.href || '#');

    return (
      <Link key={reactKey} href={item.href || '#'}>
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 
          ${isItemActive 
            ? 'bg-orange-600 text-white font-medium shadow-md shadow-orange-900/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }
        `}>
          <Icon size={20} />
          <span>{item.title}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 transition-transform duration-300 border-r border-slate-800 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/30">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-orange-900/20">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GestVenin</span>
            <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
            {loadingMenu ? (
              <div className="flex justify-center mt-10">
                <Loader2 className="animate-spin text-orange-500" />
              </div>
            ) : (
              <nav className="space-y-1">
                 {menuItems.map(item => renderMenuItem(item))}
              </nav>
            )}
            
            {!loadingMenu && menuItems.length === 0 && (
                <p className="text-center text-slate-500 text-sm mt-4">Sin menús asignados</p>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/30">
            {user ? (
              <div className="flex items-center gap-3 mb-4">
                <Avatar 
                  name={user.email?.charAt(0).toUpperCase() || "U"} 
                  className="w-10 h-10 text-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-2 ring-slate-800" 
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {localStorage.getItem('user_name') || user.email}
                  </p>
                  <p className="text-xs text-slate-500 truncate capitalize">{user.rol}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
                <div className="space-y-2">
                   <div className="w-20 h-2 bg-slate-800 rounded"></div>
                   <div className="w-12 h-2 bg-slate-800 rounded"></div>
                </div>
              </div>
            )}
            
            <Button 
                size="sm" 
                variant="flat" 
                color="danger" 
                className="w-full justify-start bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium" 
                startContent={<LogOut size={16} />} 
                onPress={logout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}