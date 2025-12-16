'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { 
  BarChart3, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle 
} from "lucide-react";
import { motion } from "framer-motion";

// 1. Importamos el servicio API y el nuevo Hook de Auth
import { authService } from '@/services/auth.service'; // Asegúrate que la ruta sea correcta
import { useAuth } from '@/providers/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  
  // 2. Extraemos la función 'login' del contexto
  const { login: contextLogin } = useAuth();
  
  // Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // A. Llamada a la API (Esto sigue igual, pedimos el token al backend)
      const data = await authService.login({ email, password });
      
      // B. Pasamos el resultado al Contexto
      // El AuthProvider se encargará de:
      // 1. Guardar el token en localStorage
      // 2. Decodificar el usuario
      // 3. Actualizar el estado global
      // 4. Redirigir al /dashboard
      contextLogin(data.accessToken, data.usuario);

      // Nota: No hacemos router.push aqui, el provider lo hace.

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
      setIsLoading(false); // Solo quitamos loading si hubo error
    } 
    // Si fue éxito, el loading se queda true un momento hasta que el provider redirige,
    // evitando parpadeos.
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      
      {/* --- LADO IZQUIERDO: Formulario --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        
        {/* Logo Header */}
        <div className="absolute top-10 left-8 sm:left-12 lg:left-24 flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">GestVenin</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Bienvenido de nuevo</h1>
            <p className="text-slate-500">Ingresa tus credenciales para acceder al panel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Mensaje de Error Animado */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2 overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <Input
                type="email"
                label="Correo Electrónico"
                placeholder="tu@empresa.com"
                variant="bordered"
                radius="sm"
                labelPlacement="outside"
                startContent={<Mail className="text-slate-400 w-4 h-4 pointer-events-none" />}
                value={email}
                onValueChange={setEmail}
                classNames={{
                  inputWrapper: "border-slate-200 hover:border-slate-400 focus-within:!border-slate-900 transition-colors",
                  label: "text-slate-600 font-medium"
                }}
                isRequired
              />

              <Input
                label="Contraseña"
                variant="bordered"
                radius="sm"
                placeholder="••••••••"
                labelPlacement="outside"
                startContent={<Lock className="text-slate-400 w-4 h-4 pointer-events-none" />}
                endContent={
                  <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                    {isVisible ? <EyeOff className="text-slate-400 w-4 h-4" /> : <Eye className="text-slate-400 w-4 h-4" />}
                  </button>
                }
                type={isVisible ? "text" : "password"}
                value={password}
                onValueChange={setPassword}
                classNames={{
                  inputWrapper: "border-slate-200 hover:border-slate-400 focus-within:!border-slate-900 transition-colors",
                  label: "text-slate-600 font-medium"
                }}
                isRequired
              />
            </div>

            <div className="flex items-center justify-between">
              <Checkbox size="sm" color="default" classNames={{ label: "text-slate-500" }}>Recordarme</Checkbox>
              <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-700">¿Olvidaste tu contraseña?</a>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              className="bg-slate-900 text-white font-medium shadow-lg hover:bg-slate-800"
              isDisabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
              ) : (
                <>Iniciar Sesión <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            ¿No tienes cuenta? <a href="#" className="font-medium text-slate-900 hover:underline">Regístrate aquí</a>
          </div>
        </motion.div>
      </div>

      {/* --- LADO DERECHO (Igual que antes) --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/4"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
        >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="text-white w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Panel de Control</h3>
                <p className="text-slate-300 text-sm">GestVenin v2.0</p>
              </div>
            </div>
            <div className="space-y-4">
               <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full w-3/4 bg-orange-500 rounded-full"></div>
               </div>
               <div className="flex justify-between text-slate-300 text-sm">
                 <span>Cargando recursos...</span>
                 <span>75%</span>
               </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}