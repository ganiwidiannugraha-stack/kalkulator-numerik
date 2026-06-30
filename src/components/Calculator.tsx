/**
 * @file Calculator.tsx
 * @description Komponen utama Kalkulator Numerik. UI dirender di sini,
 * sementara logika komputasi di-extract ke \`useCalculatorLogic\` hook
 * dan sub-komponen terpisah agar file tetap modular dan bersih.
 */

'use client';

import React from 'react';
import { usePyodide } from '../hooks/usePyodide';
import { useCalculatorLogic } from '../hooks/useCalculatorLogic';
import { Card } from './ui';
import { Calculator as CalcIcon, Table, FunctionSquare, Settings2, Activity, FlaskConical, Trash2 } from 'lucide-react';
import { CustomNumberInput } from './CustomNumberInput';
import { ResultView } from './ResultView';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
      };
    }
  }
}

export default function Calculator() {
  const { pyodide, isLoading, status } = usePyodide();
  
  const {
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
    result,
    error,
    handleCalculatePersamaan,
    handleCalculateTabel
  } = useCalculatorLogic(pyodide);

  React.useEffect(() => {
    import('mathlive').then((ml) => {
      // MathLive initialized
      if (typeof window !== 'undefined' && (window as any).mathVirtualKeyboard) {
        const mvk = (window as any).mathVirtualKeyboard;
        
        // Mencegah bug keyboard virtual mantul (terbuka lagi) di mobile saat tombol tutup ditekan
        const handleToggle = () => {
          if (!mvk.visible && document.activeElement?.tagName.toLowerCase() === 'math-field') {
            (document.activeElement as HTMLElement).blur();
          }
        };
        
        // Bersihkan listener lama (berguna untuk React Strict Mode) agar tidak menumpuk
        if ((window as any).__mvkToggleHandler) {
          mvk.removeEventListener('virtual-keyboard-toggle', (window as any).__mvkToggleHandler);
        }
        (window as any).__mvkToggleHandler = handleToggle;
        mvk.addEventListener('virtual-keyboard-toggle', handleToggle);

        // Define Custom Layout for Calculator
        mvk.layouts = [
          {
            label: '123',
            rows: [
              [
                { latex: 'x', class: 'keycap font-bold text-xl' },
                { latex: 'y', class: 'keycap font-bold text-xl' },
                { latex: 'e', class: 'keycap font-bold text-lg' },
                { latex: '\\pi', class: 'keycap font-bold text-lg' },
                { label: '7', key: '7', class: 'keycap font-bold text-lg' },
                { label: '8', key: '8', class: 'keycap font-bold text-lg' },
                { label: '9', key: '9', class: 'keycap font-bold text-lg' },
                { latex: '\\div', class: 'keycap action font-bold text-lg' },
                { latex: '\\sin', class: 'keycap font-bold' },
                { latex: '\\cos', class: 'keycap font-bold' }
              ],
              [
                { latex: 'x^2', insert: '^2', class: 'keycap font-bold text-lg' },
                { latex: 'x^\\square', insert: '^{#?}', class: 'keycap font-bold text-lg' },
                { latex: '\\sqrt{#?}', class: 'keycap font-bold text-lg' },
                { latex: '|#?|', class: 'keycap font-bold text-lg' },
                { label: '4', key: '4', class: 'keycap font-bold text-lg' },
                { label: '5', key: '5', class: 'keycap font-bold text-lg' },
                { label: '6', key: '6', class: 'keycap font-bold text-lg' },
                { latex: '\\times', class: 'keycap action font-bold text-lg' },
                { latex: '\\tan', class: 'keycap font-bold' },
                { latex: '\\log', class: 'keycap font-bold' }
              ],
              [
                { latex: '(', class: 'keycap font-bold text-xl' },
                { latex: ')', class: 'keycap font-bold text-xl' },
                { latex: '\\frac{#?}{#?}', class: 'keycap font-bold text-lg' },
                { latex: '\\ln', class: 'keycap font-bold' },
                { label: '1', key: '1', class: 'keycap font-bold text-lg' },
                { label: '2', key: '2', class: 'keycap font-bold text-lg' },
                { label: '3', key: '3', class: 'keycap font-bold text-lg' },
                { latex: '-', class: 'keycap action font-bold text-xl' },
                { label: '⌫', command: ['performWithFeedback', 'deleteBackward'], class: 'keycap action font-glyph bottom right text-red-400 w20', title: 'Hapus' }
              ],
              [
                { label: '←', command: ['performWithFeedback', 'moveToPreviousChar'], class: 'keycap action' },
                { label: '→', command: ['performWithFeedback', 'moveToNextChar'], class: 'keycap action' },
                { label: ',', key: ',', class: 'keycap font-bold text-xl' },
                { latex: '=', class: 'keycap font-bold text-xl' },
                { label: '0', key: '0', class: 'keycap font-bold text-lg w20' },
                { label: '.', key: '.', class: 'keycap font-bold text-xl' },
                { latex: '+', class: 'keycap action font-bold text-xl' },
                { label: '↓', command: ['toggleVirtualKeyboard'], class: 'keycap action font-bold text-cyan-400 w20', title: 'Tutup Keyboard' }
              ]
            ]
          },
          'symbols',
          'alphabetic',
          'greek'
        ];
      }
    }).catch(err => console.error("Mathlive failed to load", err));
  }, []);

  const mfRef = React.useRef<any>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-4 border-fuchsia-500 animate-spin animation-delay-150"></div>
          <FlaskConical className="absolute inset-0 m-auto text-cyan-300 w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-light text-slate-800 dark:text-slate-200 tracking-wider">Menghidupkan Mesin WASM...</h2>
        <p className="text-cyan-400/80 animate-pulse">{status}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      <div className="xl:col-span-4 space-y-6">
        <div className="flex flex-row p-1 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur rounded-xl">
          <button
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'Persamaan' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-300/50 dark:hover:text-slate-100 dark:hover:bg-slate-700/50'}`}
            onClick={() => setMode("Persamaan")}
          >
            <FunctionSquare size={18} className="shrink-0" /> <span className="hidden xs:inline">Persamaan f(x)</span><span className="inline xs:hidden">f(x)</span>
          </button>
          <button
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'Tabel' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-300/50 dark:hover:text-slate-100 dark:hover:bg-slate-700/50'}`}
            onClick={() => setMode("Tabel")}
          >
            <Table size={18} className="shrink-0" /> Data Tabel
          </button>
        </div>

        <Card>
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-4 mb-5">
            <Settings2 className="text-cyan-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold tracking-wide">Pengaturan Input</h3>
          </div>

          {mode === "Persamaan" ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Persamaan Matematika (f(x))</label>
                <div className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 text-slate-900 dark:text-slate-100 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all mb-2 shadow-inner text-lg sm:text-xl flex items-center">
                  {React.createElement('math-field', {
                    ref: mfRef,
                    onInput: (e: any) => {
                      try {
                        let val = e.target.getValue('ascii-math');
                        // Handle cases where mathlive ascii-math fails or returns nothing for certain keyboard buttons
                        if (!val || val.trim() === '') {
                           val = e.target.value; // Fallback to latex if ascii-math is empty
                        }
                        
                        // Sanitize spasi di dalam nama fungsi akibat pengetikan manual (contoh: 's i n' menjadi 'sin')
                        val = val.replace(/s\s*i\s*n/g, 'sin')
                                 .replace(/c\s*o\s*s/g, 'cos')
                                 .replace(/t\s*a\s*n/g, 'tan')
                                 .replace(/l\s*o\s*g/g, 'log')
                                 .replace(/l\s*n/g, 'ln')
                                 .replace(/e\s*x\s*p/g, 'exp')
                                 .replace(/s\s*q\s*r\s*t/g, 'sqrt')
                                 .replace(/a\s*b\s*s/g, 'abs')
                                 .replace(/p\s*i/g, 'pi');

                        let pythonSafe = val.replace(/\^/g, '**');
                        
                        // Fix implicit multiplication generated by ascii-math
                        // 1. Angka ketemu huruf: 3x -> 3*x, 3 pi -> 3*pi
                        pythonSafe = pythonSafe.replace(/(\d)\s*([a-zA-Z])/g, '$1*$2');
                        // 2. Huruf ketemu fungsi/konstanta: x e -> x*e, x sin -> x*sin, x pi -> x*pi
                        pythonSafe = pythonSafe.replace(/([a-zA-Z])\s+(e|pi|exp|sin|cos|tan|log|ln|abs|sqrt)/g, '$1*$2');
                        // 3. Huruf pi ketemu huruf lain (jaga-jaga): pi x -> pi*x
                        pythonSafe = pythonSafe.replace(/(pi)\s+([a-zA-Z])/g, '$1*$2');
                        // 4. Kurung tutup ketemu huruf: )x -> )*x
                        pythonSafe = pythonSafe.replace(/(\))\s*([a-zA-Z])/g, '$1*$2');
                        // 5. Huruf ketemu kurung buka: x( -> x*(
                        pythonSafe = pythonSafe.replace(/([a-zA-Z0-9])\s*\(/g, '$1*(');
                        // 6. Kurung tutup ketemu kurung buka: )( -> )*(
                        pythonSafe = pythonSafe.replace(/(\))\s*\(/g, '$1*(');
                        // Tapi pastikan nama fungsi tidak rusak menjadi function*(
                        pythonSafe = pythonSafe.replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)\*\(/g, '$1(');
                        
                        // Konversi nilai mutlak |x| menjadi abs(x) untuk Python
                        pythonSafe = pythonSafe.replace(/\|([^\|]+)\|/g, 'abs($1)');

                        setEqStr(pythonSafe);
                      } catch (err) {
                        console.error(err);
                      }
                    },
                    style: { flex: 1, minWidth: 0, outline: 'none', background: 'transparent', border: 'none', color: '#f1f5f9', '--text-color': '#f1f5f9' } as any
                  }, "3xe^x - \\cos(x)")}
                </div>
                <div className="flex justify-between items-center mb-2 text-xs">
                  <p className="text-slate-500 dark:text-slate-500">
                    Klik kotak di atas untuk memunculkan <i>keyboard</i> matematika.
                  </p>
                  <code className="text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded">
                    Python: {eqStr}
                  </code>
                </div>

                {/* Panduan Penulisan Rumus */}
                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-400 mt-3 border border-slate-200 dark:border-slate-700/50">
                  <p className="font-semibold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span className="text-cyan-500">💡</span> Panduan Penulisan Cepat:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none ml-0">
                    <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">•</span> <div><strong>Pangkat:</strong> Gunakan tombol <code className="text-slate-800 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">x<sup>□</sup></code> di keyboard virtual (Atau ketik <code className="text-cyan-600 dark:text-cyan-400 font-bold">^</code> di laptop)</div></li>
                    <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">•</span> <div><strong>Eksponensial & Pi:</strong> Gunakan tombol <code className="text-slate-800 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">e</code> atau <code className="text-slate-800 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">π</code> di keyboard virtual (Atau ketik abjad <code className="text-slate-800 dark:text-slate-200">e</code> / <code className="text-slate-800 dark:text-slate-200">pi</code>)</div></li>
                    <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">•</span> <div><strong>Pecahan:</strong> Gunakan tombol <code className="text-slate-800 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded inline-flex flex-col items-center align-middle text-[0.7em]"><span className="border-b border-slate-500 dark:border-slate-400 leading-none px-0.5">□</span><span className="leading-none px-0.5 pt-0.5">□</span></code> (Atau ketik garis miring <code className="text-cyan-600 dark:text-cyan-400 font-bold">/</code> di laptop)</div></li>
                    <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">•</span> <div><strong>Fungsi Khusus:</strong> Tombol <code className="text-slate-800 dark:text-slate-200">sin</code>, <code className="text-slate-800 dark:text-slate-200">cos</code>, <code className="text-slate-800 dark:text-slate-200">log</code>, <code className="text-slate-800 dark:text-slate-200">ln</code>, mutlak <code className="text-slate-800 dark:text-slate-200">|x|</code> sudah tersedia di keyboard virtual.</div></li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Titik Evaluasi (x)</label>
                  <CustomNumberInput step="0.1" value={xVal} onChange={(e: any) => setXVal(e.target.value === '' ? '' : e.target.value)} className="w-full bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Ukuran Langkah (h)</label>
                  <CustomNumberInput step="0.01" value={hVal} onChange={(e: any) => setHVal(e.target.value === '' ? '' : e.target.value)} className="w-full bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Batas Data Grid (Offset ±)</label>
                  <CustomNumberInput step="1" min="1" max="10" value={gridOffset} onChange={(e: any) => setGridOffset(e.target.value === '' ? '' : e.target.value)} className="w-full bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Presisi (Angka Koma)</label>
                  <CustomNumberInput step="1" min="1" max="15" value={precision} onChange={(e: any) => setPrecision(e.target.value === '' ? '' : e.target.value)} className="w-full bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all" />
                </div>
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
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-slate-700 dark:text-slate-400 font-semibold mb-1">
                  <div>x</div><div>f(x)</div>
                </div>
                {tableData.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <CustomNumberInput hideControls={true} step="0.1" value={row.x} wrapperClassName="flex-1 min-w-0" onChange={(e: any) => {
                      const newD = [...tableData];
                      newD[idx].x = e.target.value === '' ? '' : e.target.value;
                      setTableData(newD);
                    }} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm" />
                    <CustomNumberInput hideControls={true} step="0.1" value={row.fx} wrapperClassName="flex-1 min-w-0" onChange={(e: any) => {
                      const newD = [...tableData];
                      newD[idx].fx = e.target.value === '' ? '' : e.target.value;
                      setTableData(newD);
                    }} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-sm" />
                    <button 
                      onClick={() => {
                        if (tableData.length <= 1) return;
                        const newD = [...tableData];
                        newD.splice(idx, 1);
                        setTableData(newD);
                      }} 
                      disabled={tableData.length <= 1}
                      className="p-2 text-slate-500 dark:text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:text-slate-500 shrink-0"
                      title="Hapus Baris"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setTableData([...tableData, { x: 0, fx: 0 }])} className="text-xs text-cyan-400 hover:text-cyan-300 py-2">+ Tambah Baris</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Titik Target (x)</label>
                  <CustomNumberInput step="0.1" value={targetX} onChange={(e: any) => setTargetX(e.target.value === '' ? '' : e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-2">Langkah (h)</label>
                  <CustomNumberInput step="0.01" value={hValTable} onChange={(e: any) => setHValTable(e.target.value === '' ? '' : e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100" />
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

      <div className="xl:col-span-8">
        <Card className="min-h-[500px] flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-4 mb-6">
            <Activity className="text-fuchsia-400" />
            <h3 className="text-xl font-semibold tracking-wide">Hasil Komputasi</h3>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
              <b>Pemberitahuan Sistem:</b> {error}
            </div>
          )}

          {!result && !error && !isCalculating && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center transform rotate-12">
                <CalcIcon size={32} className="text-slate-700" />
              </div>
              <p>Sistem siaga. Menunggu parameter masukan...</p>
            </div>
          )}

          {isCalculating && (
            <div className="flex-1 flex flex-col items-center justify-center text-cyan-500 space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="animate-pulse">Mesin SymPy sedang melakukan perbandingan analitik & numerik...</p>
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
