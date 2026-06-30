import { useState, useEffect } from 'react';

/**
 * Custom Hook: useCalculatorLogic
 * @description Mengelola semua state dan logika komputasi untuk Kalkulator Numerik.
 * Hook ini memisahkan logika bisnis (business logic) dari komponen UI (presentation logic).
 */
export function useCalculatorLogic(pyodide: any) {
  // ==========================================
  // STATE NAVIGASI MODE
  // ==========================================
  const [mode, setMode] = useState<"Persamaan" | "Tabel">("Persamaan");

  // ==========================================
  // STATE MODE PERSAMAAN (FUNGSI ANALITIK)
  // ==========================================
  const [eqStr, setEqStr] = useState("3*x*e**x - cos(x)");
  const [xVal, setXVal] = useState<number | string>(1.0);
  const [hVal, setHVal] = useState<number | string>(0.1);
  const [gridOffset, setGridOffset] = useState<number | string>(4);
  const [precision, setPrecision] = useState<number | string>(6);

  // ==========================================
  // STATE MODE TABEL (DATA DISKRIT)
  // ==========================================
  const [tableData, setTableData] = useState<{x: number | string, fx: number | string}[]>([
    { x: 1.8, fx: 10.889365 },
    { x: 1.9, fx: 12.703199 },
    { x: 2.0, fx: 14.778112 },
    { x: 2.1, fx: 17.148957 },
    { x: 2.2, fx: 19.855033 },
  ]);
  const [targetX, setTargetX] = useState<number | string>(2.0);
  const [hValTable, setHValTable] = useState<number | string>(0.1);

  // ==========================================
  // STATE HASIL KOMPUTASI DAN STATUS
  // ==========================================
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Membersihkan hasil komputasi saat mode berpindah agar user tidak bingung
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [mode]);

  /**
   * Fungsi Pengeksekusi Python (Mode Persamaan)
   */
  const handleCalculatePersamaan = async () => {
    if (!pyodide) return;
    
    setIsCalculating(true);
    setError(null);
    setResult(null);
    
    const x = parseFloat(xVal as string);
    const h = parseFloat(hVal as string);
    const go = parseInt(gridOffset as string);

    if (!eqStr.trim() || isNaN(x) || isNaN(h) || isNaN(go) || isNaN(parseInt(precision as string))) {
      setError("Mohon isi semua input dengan format angka yang valid.");
      setIsCalculating(false);
      return;
    }

    try {
      pyodide.globals.set("eq_str", eqStr);
      pyodide.globals.set("x_val", x);
      pyodide.globals.set("h_val", h);
      pyodide.globals.set("grid_offset", go);
      pyodide.globals.set("precision_val", parseInt(precision as string) || 6);

      const code = `
import sys
if '/' not in sys.path:
    sys.path.append('/')

from methods.parser import parse_and_evaluate_equation
from methods.derivatives import first_derivative, second_derivative, third_derivative, fourth_derivative, richardson_extrapolation
import json

success, f_vals, exact_vals, exact_exprs, x_grid, err_msg = parse_and_evaluate_equation(eq_str, x_val, h_val, grid_offset, precision_val)

if success:
    import sympy as sp
    expr_sym = sp.sympify(eq_str)
    x_sym = sp.Symbol('x')
    latex_func = sp.latex(expr_sym)
    
    substitusi_steps = []
    for i, xv in zip(range(-grid_offset, grid_offset + 1), x_grid):
        if i in f_vals:
            val = f_vals[i]
            num_str = f"({xv:.{precision_val}f})" if xv < 0 else f"{xv:.{precision_val}f}"
            dummy_x = sp.Symbol(num_str)
            subbed_expr = expr_sym.subs(x_sym, dummy_x)
            latex_subbed = sp.latex(subbed_expr)
            substitusi_steps.append({
                "x": xv,
                "val": val,
                "step": f"f(x) &= {latex_func} \\\\\\\\ f({xv:.{precision_val}f}) &= {latex_subbed} \\\\\\\\ &= {val:.{precision_val}f}"
            })
            
    methods_dict = {
        1: ['Selisih Maju O(h)', 'Selisih Mundur O(h)', 'Selisih Pusat O(h^2)', 'Selisih Maju O(h^2)', 'Selisih Pusat O(h^4)'],
        2: ['Selisih Pusat O(h^2)', 'Selisih Mundur O(h)', 'Selisih Maju O(h)', 'Selisih Maju O(h^2)', 'Selisih Pusat O(h^4)'],
        3: ['Selisih Maju O(h)', 'Selisih Pusat O(h^2)'],
        4: ['Selisih Maju O(h)', 'Selisih Pusat O(h^2)']
    }
    
    derivatives_funcs = { 1: first_derivative, 2: second_derivative, 3: third_derivative, 4: fourth_derivative }
    derivatives_data = {}
    
    for orde in range(1, 5):
        derivatives_data[orde] = []
        for m in methods_dict[orde]:
            res = derivatives_funcs[orde](f_vals, h_val, method=m)
            derivatives_data[orde].append({"method": m, "value": res["res"], "steps": res["step"]})
    
    derivatives_data["richardson"] = richardson_extrapolation(f_vals, h_val)
    
    output = {
        "success": True,
        "x_grid": list(x_grid),
        "f_vals": {str(k): v for k, v in f_vals.items()},
        "exact_vals": exact_vals,
        "exact_exprs": exact_exprs,
        "substitusi_steps": substitusi_steps,
        "derivatives": derivatives_data
    }
else:
    output = { "success": False, "err_msg": err_msg }

import math
def sanitize_nan(obj):
    if isinstance(obj, float) and math.isnan(obj): return None
    if isinstance(obj, dict): return {k: sanitize_nan(v) for k, v in obj.items()}
    if isinstance(obj, list): return [sanitize_nan(v) for v in obj]
    return obj

json.dumps(sanitize_nan(output))
      `;

      const resJson = await pyodide.runPythonAsync(code);
      const res = JSON.parse(resJson);
      if (!res.success) throw new Error(res.err_msg);

      setResult({ mode: "Persamaan", h: hVal, target: xVal, precision: parseInt(precision as string) || 6, ...res });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Fungsi Pengeksekusi Python (Mode Data Tabel)
   */
  const handleCalculateTabel = async () => {
    if (!pyodide) return;
    setIsCalculating(true);
    setError(null);
    setResult(null);
    
    const tx = parseFloat(targetX as string);
    const ht = parseFloat(hValTable as string);

    if (isNaN(tx) || isNaN(ht)) {
      setError("Mohon isi Titik Target dan Ukuran Langkah dengan angka yang valid.");
      setIsCalculating(false);
      return;
    }
    
    const cleanTableData: {x: number, 'f(x)': number}[] = [];
    for (let i = 0; i < tableData.length; i++) {
        const cx = parseFloat(tableData[i].x as string);
        const cfx = parseFloat(tableData[i].fx as string);
        if (isNaN(cx) || isNaN(cfx)) {
            setError("Terdapat sel tabel data yang kosong atau tidak memuat angka valid.");
            setIsCalculating(false);
            return;
        }
        cleanTableData.push({ x: cx, 'f(x)': cfx });
    }
    
    try {
      const dfJson = JSON.stringify(cleanTableData);
      pyodide.globals.set("df_json", dfJson);
      pyodide.globals.set("target_x", tx);
      pyodide.globals.set("h_val_table", ht);

      const code = `
import sys
if '/' not in sys.path:
    sys.path.append('/')

from methods.parser import evaluate_table_data
from methods.derivatives import first_derivative, second_derivative, third_derivative, fourth_derivative, richardson_extrapolation
import json, pandas as pd

df_input = pd.DataFrame(json.loads(df_json))
success, f_vals, h_ext, err_msg = evaluate_table_data(df_input, target_x, h_val_table)

if success:
    methods_dict = {
        1: ['Selisih Maju O(h)', 'Selisih Mundur O(h)', 'Selisih Pusat O(h^2)', 'Selisih Maju O(h^2)', 'Selisih Pusat O(h^4)'],
        2: ['Selisih Pusat O(h^2)', 'Selisih Mundur O(h)', 'Selisih Maju O(h)', 'Selisih Maju O(h^2)', 'Selisih Pusat O(h^4)'],
        3: ['Selisih Maju O(h)', 'Selisih Pusat O(h^2)'],
        4: ['Selisih Maju O(h)', 'Selisih Pusat O(h^2)']
    }
    derivatives_funcs = { 1: first_derivative, 2: second_derivative, 3: third_derivative, 4: fourth_derivative }
    
    derivatives_data = {}
    for orde in range(1, 5):
        derivatives_data[orde] = []
        for m in methods_dict[orde]:
            res = derivatives_funcs[orde](f_vals, h_ext, method=m)
            derivatives_data[orde].append({"method": m, "value": res["res"], "steps": res["step"]})
            
    derivatives_data["richardson"] = richardson_extrapolation(f_vals, h_ext)
    
    output = {
        "success": True,
        "h_ext": h_ext,
        "f_vals": {str(k): v for k, v in f_vals.items()},
        "derivatives": derivatives_data
    }
else:
    output = { "success": False, "err_msg": err_msg }

import math
def sanitize_nan(obj):
    if isinstance(obj, float) and math.isnan(obj): return None
    if isinstance(obj, dict): return {k: sanitize_nan(v) for k, v in obj.items()}
    if isinstance(obj, list): return [sanitize_nan(v) for v in obj]
    return obj

json.dumps(sanitize_nan(output))
      `;
      
      const resJson = await pyodide.runPythonAsync(code);
      const res = JSON.parse(resJson);
      if (!res.success) throw new Error(res.err_msg);

      setResult({ mode: "Tabel", h: res.h_ext, target: targetX, precision: parseInt(precision as string) || 6, ...res });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsCalculating(false);
    }
  }

  return {
    mode, setMode,
    eqStr, setEqStr,
    xVal, setXVal,
    hVal, setHVal,
    gridOffset, setGridOffset,
    precision, setPrecision,
    tableData, setTableData,
    targetX, setTargetX,
    hValTable, setHValTable,
    isCalculating,
    result, setResult,
    error, setError,
    handleCalculatePersamaan,
    handleCalculateTabel
  };
}
