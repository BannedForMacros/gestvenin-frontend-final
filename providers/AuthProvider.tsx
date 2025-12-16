'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from "jwt-decode";
import { AuthContextType, UserPayload, Usuario } from '@/types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  
  // ✅ CORRECCIÓN: Renombramos 'loading' a 'isLoading' para coincidir con la interfaz
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  // Función auxiliar para validar si el token ha expirado
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = jwtDecode<UserPayload>(token);
      const currentTime = Date.now() / 1000;
      // Verificar si tiene campo exp y si no ha pasado la fecha
      if (decoded.exp && decoded.exp < currentTime) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token');
      
      if (token && isTokenValid(token)) {
        try {
          const decoded = jwtDecode<UserPayload>(token);
          setUser(decoded);
        } catch (error) {
          console.error("Error al decodificar token almacenado", error);
          logout(); 
        }
      } else if (token) {
        // Si hay token pero expiró
        logout();
      }
      
      // ✅ CORRECCIÓN: Usamos setIsLoading
      setIsLoading(false);
    };

    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función de Login
  const login = (token: string, usuarioData?: Usuario) => {
    localStorage.setItem('token', token);
    
    if (usuarioData) {
      localStorage.setItem('user_name', usuarioData.nombreCompleto);
    }

    const decoded = jwtDecode<UserPayload>(token);
    setUser(decoded);
    
    router.push('/dashboard');
  };

  // Función de Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    setUser(null);
    router.push('/login');
  };

  // Función de Permisos
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permisos) return false;
    return user.permisos.includes(permission);
  };

  // Protección de rutas básica
  useEffect(() => {
    // ✅ CORRECCIÓN: Usamos isLoading
    if (!isLoading && !user && pathname.startsWith('/dashboard')) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      // ✅ AHORA SÍ: La variable coincide con la propiedad de la interfaz
      isLoading, 
      login, 
      logout,
      hasPermission 
    }}>
      {!isLoading ? children : (
        <div className="h-screen w-full flex items-center justify-center bg-white">
           {/* Puedes poner un Spinner aquí */}
           Cargando sesión...
        </div>
      )}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};