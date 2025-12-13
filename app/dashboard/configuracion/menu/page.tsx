'use client'

import { useEffect, useState } from 'react';
import { 
  Card, Select, SelectItem, Button, Checkbox 
} from "@heroui/react";
import { Save, AlertCircle } from 'lucide-react';

// Servicios
import { rolesService } from '@/services/roles.service';
import { authService } from '@/services/auth.service';
import { getIcon } from '@/lib/icon-map';

// TIPOS LIMPIOS (Importados desde tu carpeta types)
import { Rol } from '@/types/roles.types';
import { MenuItemDB } from '@/types/auth.types';

export default function MenuConfigPage() {
  // Ahora TypeScript infiere los tipos correctamente desde los imports
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRolId, setSelectedRolId] = useState<string>("");
  const [allMenus, setAllMenus] = useState<MenuItemDB[]>([]);
  
  const [rolPermisos, setRolPermisos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Cargar Datos Iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, menusData] = await Promise.all([
          rolesService.getAll(),
          authService.getAllMenusConfig()
        ]);
        // Al usar los tipos genéricos en los servicios (Promise<Rol[]>), 
        // aquí ya no necesitas 'as ...', pero si tus servicios devuelven 'any', 
        // el casting es seguro porque definiste las interfaces.
        setRoles(rolesData as Rol[]); 
        setAllMenus(menusData as MenuItemDB[]);
      } catch (error) {
        console.error("Error cargando data:", error);
      }
    };
    fetchData();
  }, []);

  // 2. Cargar Permisos del Rol
  useEffect(() => {
    if (!selectedRolId) return;
    setLoading(true);
    
    const fetchPermisos = async () => {
      try {
        // Obtenemos detalle fresco o filtramos de lo que ya tenemos
        const allRoles = await rolesService.getAll();
        const rol = (allRoles as Rol[]).find(r => r.id === Number(selectedRolId));
        
        // Verificamos usando la propiedad definida en la interfaz Rol
        if (rol && rol.rolPermisos) {
             const permisosActivos = new Set(
                rol.rolPermisos
                  .filter(rp => rp.activo)
                  .map(rp => rp.permiso.codigo)
             );
             setRolPermisos(permisosActivos);
        } else {
            setRolPermisos(new Set());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPermisos();
  }, [selectedRolId]);

  const handleToggle = (permisoRequerido: string | null) => {
    if (!permisoRequerido) return; 
    const newPermisos = new Set(rolPermisos);
    if (newPermisos.has(permisoRequerido)) newPermisos.delete(permisoRequerido);
    else newPermisos.add(permisoRequerido);
    setRolPermisos(newPermisos);
  };

  const handleSave = async () => {
    if (!selectedRolId) return;
    setSaving(true);
    try {
        // Lógica de guardado...
        // await rolesService.assignPermisos(...)
        alert("Configuración Guardada (Simulada)");
    } catch (e) {
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  // Renderizado recursivo usando el tipo MenuItemDB
  const renderMenuRow = (item: MenuItemDB, level: number = 0) => {
    const Icon = getIcon(item.icono);
    // Nota: 'permiso_requerido' viene de la BD (snake_case) según tu interfaz MenuItemDB
    const permisoReq = item.permiso_requerido;
    const isPublic = permisoReq === null;
    const isChecked = isPublic || (permisoReq !== null && rolPermisos.has(permisoReq));
    
    return (
      <div key={item.id} className="mb-2">
        <div 
            className={`flex items-center p-3 rounded-xl border transition-colors ${isChecked ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent opacity-60'}`}
            style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="mr-3 text-slate-500">
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-700">{item.titulo}</p>
            {isPublic 
              ? <span className="text-xs text-success-600 font-medium">Público</span>
              : <span className="text-xs text-slate-400">Permiso: {permisoReq}</span>
            }
          </div>
          {!isPublic && (
            <Checkbox 
              isSelected={isChecked} 
              onValueChange={() => handleToggle(permisoReq)}
              isDisabled={!selectedRolId}
              color="warning"
            />
          )}
        </div>
        
        {item.hijos?.map(hijo => renderMenuRow(hijo, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Visibilidad de Menús</h1>
            <p className="text-base text-slate-500">Configura el acceso al sidebar por rol.</p>
        </div>
        <Button 
            onPress={handleSave} 
            isLoading={saving} 
            isDisabled={!selectedRolId} 
            color="success" 
            variant="flat" 
            size="lg" 
            startContent={<Save size={20}/>}
            className="font-bold"
        >
            Guardar
        </Button>
      </div>

      <Card className="p-4 bg-slate-100/50 shadow-none border border-slate-200">
        <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
                <Select 
                    label="Seleccionar Rol" 
                    placeholder="Elige un rol..."
                    selectedKeys={selectedRolId ? [selectedRolId] : []}
                    onChange={(e) => setSelectedRolId(e.target.value)}
                    bg-white
                    size="lg"
                >
                    {roles.map((rol) => (
                        <SelectItem key={rol.id} textValue={rol.nombre}>
                            {rol.nombre}
                        </SelectItem>
                    ))}
                </Select>
            </div>
            {selectedRolId === "1" && (
                <div className="flex items-center gap-2 text-warning-600 bg-warning-50 px-4 py-2 rounded-lg text-sm">
                    <AlertCircle size={18}/>
                    <span>El dueño tiene acceso total.</span>
                </div>
            )}
        </div>
      </Card>

      <div className="mt-6 space-y-1">
        {loading ? (
            <p className="text-center text-slate-400 py-10">Cargando permisos...</p>
        ) : (
            allMenus.map(menu => renderMenuRow(menu))
        )}
      </div>
    </div>
  );
}