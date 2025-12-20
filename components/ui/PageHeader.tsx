// /components/ui/PageHeader.tsx
'use client';

import { Button } from "@heroui/react";
import { LucideIcon } from "lucide-react";
import { useUIConfig } from "@/providers/UIConfigProvider";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  actionVariant?: "solid" | "flat" | "bordered" | "light";
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon: Icon,
  onAction,
  actionColor = "primary", // ✅ Cambiado a primary (azul)
  actionVariant = "solid" // ✅ Solid para más presencia
}: PageHeaderProps) {
  const { config } = useUIConfig();

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
      {/* 📝 Sección de Título y Descripción */}
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-gray-500 mt-1.5 text-sm md:text-base">
            {description}
          </p>
        )}
      </div>

      {/* 🎯 Botón de Acción */}
      {actionLabel && onAction && (
        <Button
          onPress={onAction}
          size={config.buttonSize || "md"}
          color={actionColor}
          variant={actionVariant}
          className="
            font-semibold 
            transition-all duration-200 
            hover:scale-105
            active:scale-95 
            shrink-0
            shadow-sm
          "
          startContent={Icon && <Icon size={18} strokeWidth={2.5} />}
        >
          <span className={config.textSize || "text-sm"}>{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}