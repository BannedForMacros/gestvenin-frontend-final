import { 
  LayoutDashboard, Settings, Users, Shield, Key, 
  Store, Package, ShoppingCart, Box, Warehouse, 
  ClipboardList, FileText, LucideIcon, Ruler,
  Tags 
} from "lucide-react";

// CORRECCIÓN: Usamos 'LucideIcon' en lugar de 'any'
export const IconMap: Record<string, LucideIcon> = {
  'LayoutDashboard': LayoutDashboard,
  'Settings': Settings,
  'Users': Users,
  'Shield': Shield,
  'Key': Key,
  'Store': Store,
  'Package': Package,
  'ShoppingCart': ShoppingCart,
  'Box': Box,
  'Warehouse': Warehouse,
  'ClipboardList': ClipboardList,
  'FileText': FileText,
  'Ruler': Ruler,
  'Tags': Tags,
};

// Tipamos el retorno de la función también
export const getIcon = (iconName: string): LucideIcon => {
  return IconMap[iconName] || Box; 
};