'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { 
  LayoutDashboard, Settings, Users, Shield, Key, 
  LogOut, ChevronDown, ChevronRight, Store, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from '@/services/auth.service'; // Asegúrate que la ruta sea correcta
// Importamos los tipos limpios
import { UserSession, MenuItem } from '@/types/auth.types';

export function Sidebar({ 
  isMobileOpen, 
  setIsMobileOpen 
}: { 
  isMobileOpen: boolean, 
  setIsMobileOpen: (v: boolean) => void 
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<UserSession | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Solución al error de useEffect y setState
  useEffect(() => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const parsedUser = JSON.parse(userStr) as UserSession;
            
            // SOLUCIÓN: Usamos setTimeout para evitar la actualización síncrona estricta
            setTimeout(() => {
              setUser(parsedUser);
            }, 0);
            
          } catch (e) {
            console.error("Error leyendo sesión", e);
          }
        }
      }
    }, []); // <--- IMPORTANTE: Este array vacío previene el bucle infinito

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;
  const isConfigActive = pathname.includes('/dashboard/configuracion');

  // Definición de menús usando el tipo MenuItem
  const mainItems: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    }
  ];

  const configItems: MenuItem[] = [
    { title: "Locales", href: "/dashboard/configuracion/locales", icon: Store, requiredPermission: 'VER_LOCALES' },
    { title: "Usuarios", href: "/dashboard/configuracion/usuarios", icon: Users, requiredPermission: 'VER_USUARIOS' },
    { title: "Roles", href: "/dashboard/configuracion/roles", icon: Shield, requiredPermission: 'VER_ROLES' },
    { title: "Permisos", href: "/dashboard/configuracion/permisos", icon: Key, requiredPermission: 'VER_PERMISOS' },
  ];

  const hasAccess = (item: MenuItem) => {
    if (!user) return false;
    if (user.rol === 'Dueño') return true;
    if (!item.requiredPermission) return true;
    return user.permisos?.includes(item.requiredPermission);
  };

  const visibleConfigItems = configItems.filter(hasAccess);

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

          {/* Navegación */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            
            {/* Main Items */}
            {mainItems.filter(hasAccess).map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(item.href) ? 'bg-orange-600 text-white font-medium shadow-lg shadow-orange-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </div>
              </Link>
            ))}

            {/* Configuración */}
            {visibleConfigItems.length > 0 && (
              <div className="pt-4">
                <div 
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isConfigActive ? 'text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={20} />
                    <span className="font-medium">Configuración</span>
                  </div>
                  {isConfigOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>

                <AnimatePresence>
                  {isConfigOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-1 space-y-1 border-l border-slate-800 ml-5">
                        {visibleConfigItems.map((subItem) => (
                          <Link key={subItem.href} href={subItem.href}>
                            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive(subItem.href) ? 'bg-slate-800 text-orange-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                              <subItem.icon size={16} />
                              <span>{subItem.title}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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