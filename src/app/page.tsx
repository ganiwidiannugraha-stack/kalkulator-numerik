import Calculator from '@/components/Calculator';
import { Calculator as CalcIcon, Sigma, FunctionSquare, Pi } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Math Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Math Symbols & Functions */}
      <div className="absolute top-20 left-10 text-cyan-500/10 rotate-12 pointer-events-none"><Sigma size={120} /></div>
      <div className="absolute top-40 right-20 text-fuchsia-500/10 -rotate-12 pointer-events-none"><Pi size={150} /></div>
      <div className="absolute bottom-40 left-32 text-blue-500/10 rotate-45 pointer-events-none"><FunctionSquare size={100} /></div>
      
      {/* Calculus Text Symbols */}
      <div className="absolute top-1/4 right-1/4 text-cyan-400/5 -rotate-12 pointer-events-none font-serif text-8xl italic font-bold">sin(x)</div>
      <div className="absolute bottom-1/4 right-10 text-fuchsia-400/5 rotate-12 pointer-events-none font-serif text-7xl italic font-bold">cos(x)</div>
      <div className="absolute top-1/2 left-5 text-blue-400/5 -rotate-45 pointer-events-none font-serif text-9xl italic font-bold">tan(x)</div>
      <div className="absolute bottom-10 left-1/3 text-purple-400/5 rotate-[20deg] pointer-events-none font-serif text-8xl italic font-bold">f'(x)</div>
      <div className="absolute top-1/3 left-1/3 text-slate-400/5 rotate-[-15deg] pointer-events-none font-serif text-9xl italic font-bold">dy/dx</div>
      
      <div className="max-w-[1600px] w-full mx-auto space-y-8 relative z-10">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-widest rounded-full border border-cyan-500/20">
            <CalcIcon size={14} />
            KELOMPOK 9
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight flex justify-center items-center gap-4 flex-wrap">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 dark:from-slate-100 via-cyan-700 dark:via-cyan-200 to-fuchsia-700 dark:to-fuchsia-300">
              Kalkulator Turunan Numerik
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg font-light">
            Selesaikan fungsi matematika kompleks dan data diskrit menggunakan metode numerik kelas tinggi secara instan di dalam browser Anda.
          </p>
        </header>

        <Calculator />
      </div>

      <footer className="mt-20 text-center text-sm text-slate-600">
        @Kelompok 9 Metode Numerik 2026
      </footer>
    </main>
  );
}
