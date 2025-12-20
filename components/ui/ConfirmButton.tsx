// /components/ui/ConfirmButton.tsx
'use client';

import { Button } from "@heroui/react";
import { Check, X } from "lucide-react";
import { useUIConfig } from "@/providers/UIConfigProvider";

interface ConfirmButtonProps {
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  confirmColor?: "primary" | "success" | "warning" | "danger";
  confirmVariant?: "solid" | "flat" | "bordered" | "light";
  cancelVariant?: "solid" | "flat" | "bordered" | "light";
}

export function ConfirmButton({
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  confirmColor = "success",
  confirmVariant = "flat",
  cancelVariant = "flat" // ✅ Ahora flat también
}: ConfirmButtonProps) {
  const { config } = useUIConfig();

  return (
    <div className="flex gap-2 justify-end">
      <Button
        color="danger"
        variant={cancelVariant} // ✅ Cambiado de "light" a usar la prop
        onPress={onCancel}
        size={config.buttonSize}
        startContent={<X size={16} strokeWidth={2.5} />}
        className="font-semibold"
      >
        <span className={config.textSize}>{cancelLabel}</span>
      </Button>

      <Button
        color={confirmColor}
        variant={confirmVariant}
        onPress={onConfirm}
        isLoading={isLoading}
        size={config.buttonSize}
        startContent={!isLoading && <Check size={16} strokeWidth={2.5} />}
        className="font-bold"
      >
        <span className={config.textSize}>{confirmLabel}</span>
      </Button>
    </div>
  );
}