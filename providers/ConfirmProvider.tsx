'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button 
} from "@heroui/react";
import { AlertTriangle, HelpCircle } from 'lucide-react';

// Tipos
interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: "danger" | "primary" | "warning" | "success";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: ""
  });
  
  // Guardamos la función 'resolve' de la promesa aquí
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (resolveRef) resolveRef(false); // Si cierra sin confirmar, es false
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef) resolveRef(true); // Si confirma, es true
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {/* EL MODAL GLOBAL */}
      <Modal isOpen={isOpen} onOpenChange={handleClose} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center">
                {options.color === 'danger' ? (
                   <AlertTriangle className="text-danger" />
                ) : (
                   <HelpCircle className="text-primary" />
                )}
                {options.title}
              </ModalHeader>
              <ModalBody>
                <p className="text-slate-600">{options.message}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => { handleClose(); onClose(); }}>
                  {options.cancelText || "Cancelar"}
                </Button>
                <Button 
                  color={options.color || "primary"} 
                  onPress={handleConfirm}
                >
                  {options.confirmText || "Confirmar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </ConfirmContext.Provider>
  );
}

// Hook personalizado para usarlo
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm debe usarse dentro de un ConfirmProvider");
  }
  return context;
};