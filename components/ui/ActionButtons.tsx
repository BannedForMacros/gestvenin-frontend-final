// /components/ui/ActionButtons.tsx
'use client';

import { Tooltip } from "@heroui/react";
import { Edit3, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editTooltip?: string;
  deleteTooltip?: string;
}

export function ActionButtons({
  onEdit,
  onDelete,
  editTooltip = "Editar",
  deleteTooltip = "Eliminar"
}: ActionButtonsProps) {
  return (
    <div className="flex justify-center gap-1">
      {onEdit && (
        <Tooltip content={editTooltip}>
          <button
            onClick={onEdit}
            className="
              p-2 rounded-lg
              text-slate-400 hover:text-orange-600
              hover:bg-orange-50
              transition-all duration-200
              active:scale-95
            "
          >
            <Edit3 size={18} strokeWidth={2.5} />
          </button>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip content={deleteTooltip}>
          <button
            onClick={onDelete}
            className="
              p-2 rounded-lg
              text-slate-400 hover:text-red-600
              hover:bg-red-50
              transition-all duration-200
              active:scale-95
            "
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}