'use client';
import React, { useState } from 'react';
import { usePyodide } from '../hooks/usePyodide';
import { Card } from './ui';
import { LatexBlock } from './LatexBlock';
import { Calculator as CalcIcon, Table, FunctionSquare, Settings2, Activity, FlaskConical, ChevronDown, ChevronUp, ChevronRight, Trash2 } from 'lucide-react';

const CustomNumberInput = ({ value, onChange, step = 1, min, max, className = "", wrapperClassName = "w-full" }: any) => {
  const handleIncrement = () => {
    const val = parseFloat(value) || 0;
    const newVal = val + parseFloat(step);
    // Hindari floating point error aneh seperti 0.1 + 0.2 = 0.30000000000000004
    onChange({ target: { value: parseFloat(newVal.toFixed(6)) } });
  };
  const handleDecrement = () => {
    const val = parseFloat(value) || 0;
    const newVal = val - parseFloat(step);
    if (min !== undefined && newVal < min) return;
    onChange({ target: { value: parseFloat(newVal.toFixed(6)) } });
  };

  return (
    <div className={`flex items-center gap-2 w-full ${wrapperClassName}`}>
      <button 
        onClick={handleDecrement} 
        className="flex items-center justify-center bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-fuchsia-400 hover:bg-fuchsia-500/20 active:bg-fuchsia-500/30 transition-colors shadow-md flex-shrink-0"
        aria-label="Kurangi"
      >
        <ChevronDown size={18} strokeWidth={3} />
      </button>
      
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className={`flex-1 min-w-0 text-center ${className}`}
      />
      
      <button 
        onClick={handleIncrement} 
        className="flex items-center justify-center bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-cyan-400 hover:bg-cyan-500/20 active:bg-cyan-500/30 transition-colors shadow-md flex-shrink-0"
        aria-label="Tambah"
      >
        <ChevronUp size={18} strokeWidth={3} />
      </button>
    </div>
  );
};

export default function Calculator() {
  const { pyodide, isLoading, status } = usePyodide();
  const [mode, setMode] = useState<"Persamaan" | "Tabel">("Persamaan");

  // Persamaan State
  const [eqStr, setEqStr] = useState("3*x*exp(x) - cos(x)");
  const [xVal, setXVal] = useState(1.0);
  const [hVal, setHVal] = useState(0.1);
  const [gridOffset, setGridOffset] = useState(4);

  // Tabel State
  const [tableData, setTableData] = useState([
    { x: 1.8, fx: 10.889365 },
    { x: 1.9, fx: 12.703199 },
    { x: 2.0, fx: 14.778112 },
    { x: 2.1, fx: 17.148957 },
    { x: 2.2, fx: 19.855033 },
  ]);
  const [targetX, setTargetX] = useState(2.0);
  const [hValTable, setHValTable] = useState(0.1);

  // Results State
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculatePersamaan = async () => {
    if (!pyodide) return;
    setIsCalculating(true);
    setError(null);
    setResult(null);
    if (!eqStr.trim() || isNaN(xVal) || isNaN(hVal) || isNaN(gridOffset)) {
      setError("Mohon isi semua input dengan angka yang valid.");
      setIsCalculating(false);
      return;
    }

    try {
      pyodide.globals.set("eq_str", eqStr);
      pyodide.globals.set("x_val", xVal);
      pyodide.globals.set("h_val", hVal);
      pyodide.globals.set("grid_offset", gridOffset);

      const code = `
import sys
if '/' not in sys.path:
    sys.path.append('/')

from methods.parser import parse_and_evaluate_equation
from methods.derivatives import first_derivative, second_derivative, third_derivative, fourth_derivative, richardson_extrapolation
import json

success, f_vals, exact_vals, exact_exprs, x_grid, err_msg = parse_and_evaluate_equation(eq_str, x_val, h_val, grid_offset)

if success:
    import sympy as sp
    # Substitusi logic
    expr_sym = sp.sympify(eq_str)
    x_sym = sp.Symbol('x')
    latex_func = sp.latex(expr_sym)
    
    substitusi_steps = []
    for i, xv in zip(range(-grid_offset, grid_offset + 1), x_grid):
        if i in f_vals:
            val = f_vals[i]
            num_str = f"({xv:.6f})" if xv < 0 else f"{xv:.6f}"
            dummy_x = sp.Symbol(num_str)
            subbed_expr = expr_sym.subs(x_sym, dummy_x)
            latex_subbed = sp.latex(subbed_expr)
            substitusi_steps.append({
                "x": xv,
                "val": val,
                "step": f"f(x) &= {latex_func} \\\\\\\\ f({xv:.6f}) &= {latex_subbed} \\\\\\\\ &= {val:.6f}"
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
            res = derivatives_funcs[orde](f_vals, ${hVal}, method=m)
            derivatives_data[orde].append({"method": m, "value": res["res"], "steps": res["step"]})
    
    derivatives_data["richardson"] = richardson_extrapolation(f_vals, ${hVal})
    
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

      // We no longer need this custom error calculation since it's dynamically rendered

      setResult({ mode: "Persamaan", h: hVal, target: xVal, ...res });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateTabel = async () => {
    if (!pyodide) return;
    setIsCalculating(true);
    setError(null);
    setResult(null);
    if (isNaN(targetX) || isNaN(hValTable)) {
      setError("Mohon isi Titik Target dan Ukuran Langkah dengan angka yang valid.");
      setIsCalculating(false);
      return;
    }
    for (let i = 0; i < tableData.length; i++) {
        if (isNaN(tableData[i].x) || isNaN(tableData[i].fx)) {
            setError("Ada sel tabel data yang kosong atau tidak valid.");
            setIsCalculating(false);
            return;
        }
    }
    try {
      const dfJson = JSON.stringify(tableData.map(d => ({ x: d.x, 'f(x)': d.fx })));
      pyodide.globals.set("df_json", dfJson);
      pyodide.globals.set("target_x", targetX);
      pyodide.globals.set("h_val_table", hValTable);

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

      setResult({ mode: "Tabel", h: res.h_ext, target: targetX, ...res });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsCalculating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-4 border-fuchsia-500 animate-spin animation-delay-150"></div>
          <FlaskConical className="absolute inset-0 m-auto text-cyan-300 w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-light text-slate-200 tracking-wider">Menghidupkan Mesin...</h2>
        <p className="text-cyan-400/80 animate-pulse">{status}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN - INPUT */}
      <div className="lg:col-span-4 space-y-6">
        <div className="flex flex-row p-1 bg-slate-800/80 backdrop-blur rounded-xl">
          <button
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'Persamaan' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setMode("Persamaan")}
          >
            <FunctionSquare size={18} className="shrink-0" /> <span className="hidden xs:inline">Persamaan f(x)</span><span className="inline xs:hidden">f(x)</span>
          </button>
          <button
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'Tabel' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setMode("Tabel")}
          >
            <Table size={18} className="shrink-0" /> Data Tabel
          </button>
        </div>

        <Card>
          <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4 mb-5">
            <Settings2 className="text-cyan-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold tracking-wide">Pengaturan Input</h3>
          </div>

          {mode === "Persamaan" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Persamaan Matematika (f(x))</label>
                <input
                  type="text"
                  value={eqStr}
                  onChange={e => setEqStr(e.target.value)}
                  className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all font-mono mb-2 shadow-inner text-sm sm:text-base"
                />
                <p className="text-xs text-slate-500">Panduan: Gunakan <code className="bg-slate-800 px-1 rounded text-cyan-400">*</code> untuk kali, <code className="bg-slate-800 px-1 rounded text-cyan-400">**</code> untuk pangkat. Contoh: <code className="bg-slate-800 px-1 rounded text-cyan-400">3*x**2 - exp(x) + sin(x)</code></p>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-800 flex justify-center items-center overflow-x-auto">
                <LatexBlock tex={`f(x) = ${eqStr.replaceAll('**', '^').replaceAll('*', ' ').replace(/exp\((.*?)\)/g, 'e^{$1}').replace(/sin/g, '\\sin').replace(/cos/g, '\\cos').replace(/tan/g, '\\tan').replace(/log/g, '\\log')}`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Titik Evaluasi (x)</label>
                  <CustomNumberInput step="0.1" value={xVal} onChange={(e: any) => setXVal(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Ukuran Langkah (h)</label>
                  <CustomNumberInput step="0.01" value={hVal} onChange={(e: any) => setHVal(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Batas Data Grid (Offset ±)</label>
                <CustomNumberInput step="1" min="1" max="10" value={gridOffset} onChange={(e: any) => setGridOffset(parseInt(e.target.value) || 1)} className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
              </div>

              <button
                onClick={handleCalculatePersamaan}
                disabled={isCalculating}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
              >
                {isCalculating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Activity size={20} />}
                {isCalculating ? 'Menghitung...' : 'Eksekusi Rumus'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-400 font-semibold mb-1">
                  <div>x</div><div>f(x)</div>
                </div>
                {tableData.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <CustomNumberInput step="0.1" value={row.x} wrapperClassName="flex-1 min-w-0" onChange={(e: any) => {
                      const newD = [...tableData];
                      newD[idx].x = parseFloat(e.target.value) || 0;
                      setTableData(newD);
                    }} className="bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm" />
                    <CustomNumberInput step="0.1" value={row.fx} wrapperClassName="flex-1 min-w-0" onChange={(e: any) => {
                      const newD = [...tableData];
                      newD[idx].fx = parseFloat(e.target.value) || 0;
                      setTableData(newD);
                    }} className="bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm" />
                    <button 
                      onClick={() => {
                        if (tableData.length <= 1) return; // minimal 1 baris
                        const newD = [...tableData];
                        newD.splice(idx, 1);
                        setTableData(newD);
                      }} 
                      disabled={tableData.length <= 1}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 shrink-0"
                      title="Hapus Baris"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setTableData([...tableData, { x: 0, fx: 0 }])} className="text-xs text-cyan-400 hover:text-cyan-300 py-2">+ Tambah Baris</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Titik Target (x)</label>
                  <CustomNumberInput step="0.1" value={targetX} onChange={(e: any) => setTargetX(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Langkah (h)</label>
                  <CustomNumberInput step="0.01" value={hValTable} onChange={(e: any) => setHValTable(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100" />
                </div>
              </div>

              <button
                onClick={handleCalculateTabel}
                disabled={isCalculating}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
              >
                {isCalculating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Activity size={20} />}
                {isCalculating ? 'Mengekstrak Data...' : 'Ekstrak & Hitung Tabel'}
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* RIGHT COLUMN - RESULTS */}
      <div className="lg:col-span-8">
        <Card className="min-h-[500px] flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4 mb-6">
            <Activity className="text-fuchsia-400" />
            <h3 className="text-xl font-semibold tracking-wide">Hasil Komputasi</h3>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
              <b>Error:</b> {error}
            </div>
          )}

          {!result && !error && !isCalculating && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center transform rotate-12">
                <CalcIcon size={32} className="text-slate-600" />
              </div>
              <p>Menunggu input untuk dihitung...</p>
            </div>
          )}

          {isCalculating && (
            <div className="flex-1 flex flex-col items-center justify-center text-cyan-500 space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="animate-pulse">Menghitung dengan SymPy Engine...</p>
            </div>
          )}

          {result && !isCalculating && (
            <ResultView result={result} />
          )}
        </Card>
      </div>
    </div>
  );
}

function ResultView({ result }: { result: any }) {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* GRID DATA */}
      {result.mode === "Persamaan" && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tabel Data Grid (Di Sekitar x)</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Index Offset</th>
                  <th className="px-4 py-3 font-medium">x</th>
                  <th className="px-4 py-3 font-medium">f(x)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {result.x_grid.map((x: number, idx: number) => {
                  const offset = idx - Math.floor(result.x_grid.length / 2);
                  const isCenter = offset === 0;
                  return (
                    <tr key={idx} className={isCenter ? 'bg-cyan-500/10 text-cyan-100 font-medium' : 'text-slate-300'}>
                      <td className="px-4 py-3">{offset}</td>
                      <td className="px-4 py-3">{x.toFixed(6)}</td>
                      <td className="px-4 py-3">{result.f_vals[offset] ? result.f_vals[offset].toFixed(6) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Expander title="Lihat Proses Substitusi f(x) ke Tabel">
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-slate-800">
              {result.substitusi_steps.map((s: any, i: number) => (
                <div key={i}>
                  <LatexBlock tex={`\\begin{aligned} ${s.step} \\end{aligned}`} />
                </div>
              ))}
            </div>
          </Expander>

          {result.exact_exprs && (
            <Expander title="Lihat Langkah Turunan Analitik Sejati">
              <div className="space-y-6 bg-slate-950/50 p-6 rounded-xl font-mono text-sm overflow-x-auto border border-slate-800">
                {[1, 2, 3, 4].map(orde => {
                  const expr = result.exact_exprs[orde];
                  if (!expr) return null;
                  return (
                    <div key={orde} className="border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                      <LatexBlock tex={`\\begin{aligned} ${expr} \\end{aligned}`} />
                    </div>
                  );
                })}
              </div>
            </Expander>
          )}
        </div>
      )}

      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-8" />

      {/* TABS */}
      <div>
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-6 overflow-x-auto">
          {[1, 2, 3, 4].map(orde => (
            <button
              key={orde}
              onClick={() => setActiveTab(orde)}
              className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === orde ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border-transparent' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              Turunan ke-{orde}
            </button>
          ))}
          <button
            onClick={() => setActiveTab(5)}
            className={`flex-1 min-w-[160px] py-3 px-4 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 5 ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25 border-transparent' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            Ekstrapolasi Richardson
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900/30 rounded-xl p-1">
          {activeTab <= 4 ? (
            <TurunanTab orde={activeTab} result={result} />
          ) : (
            <RichardsonTab result={result} />
          )}
        </div>
      </div>
    </div>
  )
}

function TurunanTab({ orde, result }: { orde: number, result: any }) {
  const exact = result.exact_vals ? result.exact_vals[orde] : null;
  const methods_list = result.derivatives[orde] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {exact !== null && (
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-6 flex items-center justify-between overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <span className="text-slate-300 font-medium tracking-wide">Nilai Sejati / Analitik</span>
          <span className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 group-hover:scale-105 transition-transform">{exact.toFixed(6)}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Metode</th>
              <th className="px-4 py-3 font-medium text-right">Nilai Hampiran (Hasil)</th>
              {exact !== null && <th className="px-4 py-3 font-medium text-right">Error / Galat</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {methods_list.map((m: any, idx: number) => (
              <tr key={idx} className="text-slate-300 hover:bg-slate-800/30">
                <td className="px-4 py-3 text-cyan-400">{m.method}</td>
                <td className="px-4 py-3 text-right">{m.value !== null && !isNaN(m.value) ? m.value.toFixed(6) : '-'}</td>
                {exact !== null && (
                  <td className="px-4 py-3 text-right text-red-400">
                    {m.value !== null && !isNaN(m.value) ? Math.abs(exact - m.value).toFixed(6) : '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Expander title="Lihat Rincian Langkah Penyelesaian">
        <div className="space-y-6 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
          {methods_list.map((m: any, idx: number) => {
            if (!m.steps) return null;
            return (
              <div key={idx} className="overflow-x-auto">
                <LatexBlock tex={`\\begin{aligned} ${m.steps} \\end{aligned}`} />
              </div>
            )
          })}
        </div>
      </Expander>
    </div>
  )
}

function RichardsonTab({ result }: { result: any }) {
  const data = result.derivatives.richardson;
  if (!data || data.C1 === null || isNaN(data.C1)) {
    return <div className="text-slate-400 p-4 text-center">Data tidak cukup untuk mencapai akurasi Ekstrapolasi Richardson O(h^6).</div>
  }

  const exact = result.exact_vals ? result.exact_vals[1] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-slate-900/80 border border-fuchsia-500/20 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <h5 className="text-sm font-semibold text-fuchsia-300 mb-4">Turunan Pertama (O(h^6))</h5>
        <div className="text-4xl font-mono text-slate-100 mb-6">{data.C1.toFixed(6)}</div>

        {exact !== null && (
          <div className="text-sm space-y-3 border-t border-slate-800 pt-5">
            <div className="flex justify-between text-slate-400">
              <span>Nilai Analitik (Sejati):</span>
              <span className="font-mono text-white">{exact.toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Error (Selisih):</span>
              <span className="font-mono text-fuchsia-400">{Math.abs(exact - data.C1).toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>

      <Expander title="Lihat Tabel Proses Ekstrapolasi">
        <div className="overflow-x-auto bg-slate-950/60 rounded-xl border border-slate-800">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Langkah</th>
                <th className="px-4 py-3 font-medium">O(h^2)</th>
                <th className="px-4 py-3 font-medium">O(h^4)</th>
                <th className="px-4 py-3 font-medium">O(h^6)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              <tr>
                <td className="px-4 py-3">h = {data.h.toFixed(4)}</td>
                <td className="px-4 py-3">{data.Dh.toFixed(6)}</td>
                <td className="px-4 py-3">{data.B1 ? data.B1.toFixed(6) : '-'}</td>
                <td className="px-4 py-3 text-fuchsia-400">{data.C1 ? data.C1.toFixed(6) : '-'}</td>
              </tr>
              <tr>
                <td className="px-4 py-3">2h = {(2 * data.h).toFixed(4)}</td>
                <td className="px-4 py-3">{data.D2h.toFixed(6)}</td>
                <td className="px-4 py-3">{data.B2 ? data.B2.toFixed(6) : '-'}</td>
                <td className="px-4 py-3">-</td>
              </tr>
              <tr>
                <td className="px-4 py-3">4h = {(4 * data.h).toFixed(4)}</td>
                <td className="px-4 py-3">{data.D4h.toFixed(6)}</td>
                <td className="px-4 py-3">-</td>
                <td className="px-4 py-3">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Expander>
    </div>
  )
}

function Expander({ title, children }: { title: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-slate-300 hover:bg-slate-700/30 transition-colors"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
      {open && (
        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}
