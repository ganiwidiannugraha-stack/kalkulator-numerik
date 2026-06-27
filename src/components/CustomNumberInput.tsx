import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface CustomNumberInputProps {
  value: number | string;
  onChange: (e: any) => void;
  step?: string | number;
  min?: string | number;
  max?: string | number;
  className?: string;
  wrapperClassName?: string;
  hideControls?: boolean;
}

/**
 * Komponen Input Angka Kustom
 * 
 * @description Menyediakan input numerik yang elegan dengan tombol increment (tambah) dan 
 * decrement (kurang) khusus. Menghindari anomali presisi floating point bawaan JavaScript.
 */
export const CustomNumberInput = ({ value, onChange, step = 1, min, max, className = "", wrapperClassName = "w-full", hideControls = false }: CustomNumberInputProps) => {
  
  const handleIncrement = () => {
    const val = parseFloat(String(value)) || 0;
    const newVal = val + parseFloat(String(step));
    onChange({ target: { value: parseFloat(newVal.toFixed(6)) } });
  };
  
  const handleDecrement = () => {
    const val = parseFloat(String(value)) || 0;
    const newVal = val - parseFloat(String(step));
    if (min !== undefined && newVal < parseFloat(String(min))) return;
    onChange({ target: { value: parseFloat(newVal.toFixed(6)) } });
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-2 w-full ${wrapperClassName}`}>
      {!hideControls && (
        <button 
          onClick={handleDecrement} 
          className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-fuchsia-400 hover:bg-fuchsia-500/20 active:bg-fuchsia-500/30 transition-colors shadow-md flex-shrink-0"
          aria-label="Kurangi"
        >
          <ChevronDown size={18} strokeWidth={3} />
        </button>
      )}
      
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className={`flex-1 min-w-0 text-center ${className}`}
      />
      
      {!hideControls && (
        <button 
          onClick={handleIncrement} 
          className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 text-cyan-400 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-colors shadow-md flex-shrink-0"
          aria-label="Tambah"
        >
          <ChevronUp size={18} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
