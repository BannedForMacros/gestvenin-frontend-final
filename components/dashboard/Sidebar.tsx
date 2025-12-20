'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
        
        const activeMenu = findActiveParentMenu(data, pathname);
        if (activeMenu) {
          setOpenMenus(prev => ({ ...prev, [activeMenu]: true }));
        }
      } catch (err) {
        console.error("Error cargando menús:", err);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenus();
  }, [pathname]);

  const findActiveParentMenu = (items: MenuItem[], path: string): string | null => {
    for (const item of items) {
      if (item.items) {
        const hasActiveChild = item.items.some(child => 
          child.href && isActive(child.href, path)
        );
        if (hasActiveChild) {
          return item.id ? String(item.id) : item.title;
        }
      }
    }
    return null;
  };

  const toggleSubmenu = useCallback((key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isActive = useCallback((itemPath: string, currentPath: string = pathname) => {
    if (!itemPath || itemPath === '#') return false;
    
    const normalizedPath = itemPath.endsWith('/') && itemPath !== '/' 
      ? itemPath.slice(0, -1) 
      : itemPath;
    const normalizedPathname = currentPath.endsWith('/') && currentPath !== '/' 
      ? currentPath.slice(0, -1) 
      : currentPath;
    
    return normalizedPathname === normalizedPath;
  }, [pathname]);

  const renderMenuItem = useCallback((item: MenuItem) => {
    const Icon = item.icon; 
    const hasChildren = item.items && item.items.length > 0;
    
    const menuKey = item.id ? String(item.id) : item.title;
    const isOpen = openMenus[menuKey];
    const reactKey = item.id || `${item.title}-${item.href}`;

    if (hasChildren) {
      return (
        <div key={reactKey} className="mb-1.5">
          <button 
            onClick={() => toggleSubmenu(menuKey)}
            className={`
              w-full flex items-center justify-between px-3.5 py-3 rounded-lg
              transition-all duration-200 group
              ${isOpen 
                ? 'bg-slate-700/50 text-amber-400 shadow-sm' 
                : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon 
                size={20} 
                className={`transition-colors ${
                  isOpen 
                    ? 'text-amber-400' 
                    : 'text-slate-500 group-hover:text-slate-300'
                }`} 
              />
              <span className="font-semibold text-sm tracking-wide">{item.title}</span>
            </div>
            <ChevronRight 
              size={16} 
              className={`
                transition-all duration-200 
                ${isOpen 
                  ? 'rotate-90 text-amber-400' 
                  : 'text-slate-500 group-hover:text-slate-300'
                }
              `}
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 space-y-1 ml-5 border-l-2 border-slate-700/50 pl-3">
                  {item.items!.map(child => renderMenuItem(child))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    const isItemActive = isActive(item.href || '#');

    return (
      <Link key={reactKey} href={item.href || '#'}>
        <div 
          className={`
            flex items-center gap-3 px-3.5 py-2.5 rounded-lg
            transition-all duration-200 group mb-1
            ${isItemActive 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-900/30'
              : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
            }
          `}
        >
          <Icon 
            size={19} 
            className={`transition-all ${
              isItemActive 
                ? 'text-white' 
                : 'text-slate-500 group-hover:text-slate-300'
            }`}
          />
          <span className="text-sm tracking-wide">{item.title}</span>
          
          {isItemActive && (
            <motion.div
              layoutId="activeIndicator"
              className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </div>
      </Link>
    );
  }, [openMenus, toggleSubmenu, isActive]);

  const displayName = useMemo(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) return storedName;
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  }, [user]);

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm" 
            onClick={() => setIsMobileOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* 🎨 SIDEBAR - PALETA "COCINA MODERNA" */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen w-[270px]
          bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900
          transition-transform duration-300 
          border-r border-slate-700/40 shadow-2xl shadow-black/20
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
        }}
      >
        <div className="flex flex-col h-full">
          
          {/* HEADER */}
          <div className="h-[70px] flex items-center px-5 border-b border-slate-700/40 bg-slate-900/50 backdrop-blur-sm">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-900/40">
                <Store className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Gest<span className="text-orange-500">Venin</span>
              </h1>
              <p className="text-[10px] text-amber-400/80 font-semibold tracking-widest uppercase">
                Sistema ERP
              </p>
            </div>
            <button 
              className="ml-auto lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all" 
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NAVEGACIÓN */}
          <div className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
            {loadingMenu ? (
              <div className="flex flex-col items-center justify-center mt-20 gap-3">
                <Loader2 className="animate-spin text-orange-500" size={36} strokeWidth={2.5} />
                <p className="text-slate-400 text-sm font-medium">Cargando menú...</p>
              </div>
            ) : (
              <nav className="space-y-1">
                 {menuItems.map(item => renderMenuItem(item))}
              </nav>
            )}
            
            {!loadingMenu && menuItems.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 gap-3">
                <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center">
                  <Store className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm font-semibold">Sin menús asignados</p>
                  <p className="text-slate-500 text-xs mt-1">Contacta al administrador</p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER - PERFIL */}
          <div className="p-4 border-t border-slate-700/40 bg-slate-900/50 backdrop-blur-sm">
            {user ? (
              <div className="mb-3 p-3 rounded-lg bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar 
                      name={user.email?.charAt(0).toUpperCase() || "U"} 
                      className="w-10 h-10 text-sm font-bold bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">
                      {displayName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                      <p className="text-xs text-slate-400 truncate capitalize font-medium">
                        {user.rol}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-3 p-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                <div className="space-y-2 flex-1">
                   <div className="w-24 h-3 bg-slate-700 rounded"></div>
                   <div className="w-16 h-2.5 bg-slate-700 rounded"></div>
                </div>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="flat" 
              className="w-full justify-start bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold transition-all border border-red-500/20 hover:border-red-500/30" 
              startContent={<LogOut size={16} strokeWidth={2.5} />} 
              onPress={logout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
          transition: background 0.2s;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </>
  );
}