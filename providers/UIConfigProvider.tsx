'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

type FontSize = 'compact' | 'normal' | 'large';

interface UIConfig {
  fontSize: FontSize;
  // Mapeos de clases según el tamaño elegido
  inputSize: "sm" | "md" | "lg";
  buttonSize: "sm" | "md" | "lg";
  textSize: string;      // ej: "text-base"
  headerSize: string;    // ej: "text-lg"
  tableCellSize: string; // ej: "py-3 text-base"
}

interface UIConfigContextType {
  config: UIConfig;
  setSize: (size: FontSize) => void;
}

const UIConfigContext = createContext<UIConfigContextType | undefined>(undefined);

// Definición de estilos por tamaño
const STYLES: Record<FontSize, UIConfig> = {
  compact: {
    fontSize: 'compact',
    inputSize: 'sm',
    buttonSize: 'sm',
    textSize: 'text-sm',
    headerSize: 'text-base',
    tableCellSize: 'py-1 text-sm'
  },
  normal: { // ESTE ES TU ESTILO PREFERIDO ACTUAL
    fontSize: 'normal',
    inputSize: 'md', // HeroUI md es estándar, pero podemos forzar lg si prefieres
    buttonSize: 'md',
    textSize: 'text-base',
    headerSize: 'text-xl',
    tableCellSize: 'py-3 text-base'
  },
  large: {
    fontSize: 'large',
    inputSize: 'lg',
    buttonSize: 'lg',
    textSize: 'text-lg',
    headerSize: 'text-2xl',
    tableCellSize: 'py-4 text-lg'
  }
};

export function UIConfigProvider({ children }: { children: ReactNode }) {
  const [currentSize, setCurrentSize] = useState<FontSize>('normal'); // Default: Normal (Tu estilo)

  const value = {
    config: STYLES[currentSize],
    setSize: setCurrentSize
  };

  return (
    <UIConfigContext.Provider value={value}>
      {children}
    </UIConfigContext.Provider>
  );
}

export const useUIConfig = () => {
  const context = useContext(UIConfigContext);
  if (!context) throw new Error("useUIConfig debe usarse dentro de UIConfigProvider");
  return context;
};