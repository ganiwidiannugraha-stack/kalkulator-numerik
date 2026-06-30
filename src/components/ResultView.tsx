import React, { useState } from 'react';
import { LatexBlock } from './LatexBlock';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Komponen Pemandangan Hasil (Result View Wrapper)
 * 
 * @description Bertugas memecah dan menampilkan hasil JSON komputasi yang dilempar dari Pyodide.
 * Mengemasnya ke dalam sebuah tab controller untuk kemudahan pemindahan sudut pandang observasi.
 * 
 * @param {Object} props Menyimpan data hasil mentah dari runtime Python
 */
export function ResultView({ result }: { result: any }) {
  // Mengontrol Active Tab dari 1 hingga 5 (1-4 = Orde Turunan, 5 = Ekstrapolasi)
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ---------------------------------------------------- */}
      {/* GRID DATA OBSERVASI (Hanya Tersedia di Mode Persamaan) */}
      {/* ---------------------------------------------------- */}
      {result.mode === "Persamaan" && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Tabel Data Grid Evaluasi (Fokus di sekitar nilai x)</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Index Offset</th>
                  <th className="px-4 py-3 font-medium">Nilai (x)</th>
                  <th className="px-4 py-3 font-medium">Substitusi f(x)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {result.x_grid.map((x: number, idx: number) => {
                  const offset = idx - Math.floor(result.x_grid.length / 2);
                  const isCenter = offset === 0;
                  return (
                    <tr key={idx} className={isCenter ? 'bg-cyan-500/10 text-cyan-100 font-medium' : 'text-slate-700 dark:text-slate-300'}>
                      <td className="px-4 py-3">{offset}</td>
                      <td className="px-4 py-3">{x.toFixed(result.precision || 6)}</td>
                      <td className="px-4 py-3">{result.f_vals[offset] ? result.f_vals[offset].toFixed(result.precision || 6) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Expander title="Lihat Riwayat Substitusi Fungsi ke Tabel">
            <div className="space-y-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl font-mono text-sm overflow-x-auto border border-slate-200 dark:border-slate-800">
              {result.substitusi_steps.map((s: any, i: number) => (
                <div key={i}>
                  <LatexBlock tex={`\\begin{aligned} ${s.step} \\end{aligned}`} />
                </div>
              ))}
            </div>
          </Expander>

          {result.exact_exprs && (
            <Expander title="Lihat Tahapan Penurunan Analitik (Sejati)">
              <div className="space-y-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-xl font-mono text-sm overflow-x-auto border border-slate-200 dark:border-slate-800">
                {[1, 2, 3, 4].map(orde => {
                  const expr = result.exact_exprs[orde];
                  if (!expr) return null;
                  return (
                    <div key={orde} className="border-b border-slate-200 dark:border-slate-800/50 pb-4 last:border-0 last:pb-0">
                      <LatexBlock tex={`\\begin{aligned} ${expr} \\end{aligned}`} />
                    </div>
                  );
                })}
              </div>
            </Expander>
          )}
        </div>
      )}

      {/* Garis Pemisah Visual */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-8" />

      {/* ---------------------------------------------------- */}
      {/* TABS (TURUNAN & RICHARDSON EXTRAPOLATION)           */}
      {/* ---------------------------------------------------- */}
      <div>
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-6 overflow-x-auto">
          {[1, 2, 3, 4].map(orde => (
            <button
              key={orde}
              onClick={() => setActiveTab(orde)}
              className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === orde ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border-transparent' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-300/50 dark:hover:text-slate-100 dark:hover:bg-slate-700/50'}`}
            >
              Turunan ke-{orde}
            </button>
          ))}
          <button
            onClick={() => setActiveTab(5)}
            className={`flex-1 min-w-[160px] py-3 px-4 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === 5 ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25 border-transparent' : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-300/50 dark:hover:text-slate-100 dark:hover:bg-slate-700/50'}`}
          >
            Ekstrapolasi Richardson
          </button>
        </div>

        {/* Konten Tab Aktif */}
        <div className="bg-slate-50/80 dark:bg-slate-900/30 rounded-xl p-1">
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

/**
 * Komponen Sub-Tab Orde Turunan Numerik
 */
function TurunanTab({ orde, result }: { orde: number, result: any }) {
  const [selectedMethod, setSelectedMethod] = useState("Semua Metode");
  const exact = result.exact_vals ? result.exact_vals[orde] : null;
  const methods_list = result.derivatives[orde] || [];
  const precision = result.precision || 6;

  const filtered_methods = selectedMethod === "Semua Metode" 
    ? methods_list 
    : methods_list.filter((m: any) => m.method.toLowerCase().includes(selectedMethod.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex justify-end">
        <select 
          value={selectedMethod} 
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none"
        >
          <option value="Semua Metode">Tampilkan Semua Metode</option>
          <option value="Selisih Maju">Selisih Maju</option>
          <option value="Selisih Mundur">Selisih Mundur</option>
          <option value="Selisih Pusat">Selisih Pusat</option>
        </select>
      </div>

      {/* Banner Nilai Evaluasi Analitik Sejati */}
      {exact !== null && (
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 flex items-center justify-between overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <span className="text-slate-700 dark:text-slate-300 font-medium tracking-wide">Target Nilai Sejati (Analitik)</span>
          <span className="text-2xl font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 group-hover:scale-105 transition-transform">{exact.toFixed(precision)}</span>
        </div>
      )}

      {/* Matriks Hasil Hampiran (Approximation) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/50">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Metode Bedah Hingga</th>
              <th className="px-4 py-3 font-medium text-right">Nilai Hampiran Numerik</th>
              {exact !== null && <th className="px-4 py-3 font-medium text-right">Galat Kesalahan (Error)</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {filtered_methods.map((m: any, idx: number) => (
              <tr key={idx} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 dark:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-cyan-400">{m.method}</td>
                <td className="px-4 py-3 text-right">{m.value !== null && !isNaN(m.value) ? m.value.toFixed(precision) : '-'}</td>
                {exact !== null && (
                  <td className="px-4 py-3 text-right text-red-400 font-bold">
                    {m.value !== null && !isNaN(m.value) ? Math.abs(exact - m.value).toFixed(precision) : '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Expander title="Pelajari Elaborasi Rumus Matematika">
        <div className="space-y-6 bg-slate-50 dark:bg-slate-950/60 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          {filtered_methods.map((m: any, idx: number) => {
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

/**
 * Komponen Tab Ekstrapolasi Richardson
 */
function RichardsonTab({ result }: { result: any }) {
  const data = result.derivatives.richardson;
  const precision = result.precision || 6;
  
  if (!data || data.C1 === null || isNaN(data.C1)) {
    return <div className="text-slate-700 dark:text-slate-400 p-4 text-center">Injeksi data interval grid (offset) yang anda sediakan tidak mencukupi untuk memenuhi syarat Ekstrapolasi Richardson orde O(h^6). Mohon perbesar offset grid.</div>
  }

  const exact = result.exact_vals ? result.exact_vals[1] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-fuchsia-500/20 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <h5 className="text-sm font-semibold text-fuchsia-300 mb-4">Estimasi Terbaik Turunan Pertama (Tingkat Ketepatan O(h^6))</h5>
        <div className="text-4xl font-mono text-slate-900 dark:text-slate-100 mb-6">{data.C1.toFixed(precision)}</div>

        {exact !== null && (
          <div className="text-sm space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex justify-between text-slate-700 dark:text-slate-400">
              <span>Nilai Sejati (Truth Value):</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{exact.toFixed(precision)}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-400">
              <span>Residu Galat Kesalahan:</span>
              <span className="font-mono text-fuchsia-500 font-bold">{Math.abs(exact - data.C1).toFixed(precision)}</span>
            </div>
          </div>
        )}
      </div>

      <Expander title="Tinjau Matriks Piramida Ekstrapolasi (D -> B -> C)">
        <div className="overflow-x-auto bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Resolusi Jarak</th>
                <th className="px-4 py-3 font-medium">Akurasi O(h^2) [D]</th>
                <th className="px-4 py-3 font-medium">Akurasi O(h^4) [B]</th>
                <th className="px-4 py-3 font-medium">Akurasi O(h^6) [C]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              <tr>
                <td className="px-4 py-3">h = {data.h.toFixed(4)}</td>
                <td className="px-4 py-3">{data.Dh.toFixed(precision)}</td>
                <td className="px-4 py-3">{data.B1 ? data.B1.toFixed(precision) : '-'}</td>
                <td className="px-4 py-3 text-fuchsia-500 font-bold">{data.C1 ? data.C1.toFixed(precision) : '-'}</td>
              </tr>
              <tr>
                <td className="px-4 py-3">2h = {(2 * data.h).toFixed(4)}</td>
                <td className="px-4 py-3">{data.D2h.toFixed(precision)}</td>
                <td className="px-4 py-3">{data.B2 ? data.B2.toFixed(precision) : '-'}</td>
                <td className="px-4 py-3">-</td>
              </tr>
              <tr>
                <td className="px-4 py-3">4h = {(4 * data.h).toFixed(4)}</td>
                <td className="px-4 py-3">{data.D4h.toFixed(precision)}</td>
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

/**
 * Komponen Utilitas (Accordion / Expander)
 */
function Expander({ title, children }: { title: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/30 transition-colors focus:outline-none"
      >
        {open ? <ChevronDown size={16} className="text-cyan-500" /> : <ChevronRight size={16} className="text-cyan-500" />}
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
