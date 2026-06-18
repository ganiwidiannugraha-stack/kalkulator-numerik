import { useState, useEffect } from 'react';

export function usePyodide() {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Menyiapkan Mesin Kalkulator...");

  useEffect(() => {
    let isMounted = true;
    async function initPyodide() {
      try {
        if (!isMounted) return;
        setStatus("Mengunduh Engine WebAssembly...");
        // @ts-ignore
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        if (!isMounted) return;
        setStatus("Memuat Pustaka Matematika (SymPy, Pandas, NumPy)...");
        await py.loadPackage("micropip");
        const micropip = py.pyimport("micropip");
        await micropip.install(['sympy', 'pandas', 'numpy']);
        
        if (!isMounted) return;
        setStatus("Menyalin Modul Inti Kalkulator...");
        // Fetch our python logic files from public/ with cache buster
        const timestamp = new Date().getTime();
        const parserRes = await fetch(`/python_logic/parser.py?t=${timestamp}`);
        const parserCode = await parserRes.text();
        const derivRes = await fetch(`/python_logic/derivatives.py?t=${timestamp}`);
        const derivCode = await derivRes.text();
        
        if (!isMounted) return;
        // Write to virtual filesystem
        try { py.FS.mkdir('/methods'); } catch(e) {} // ignore if exists
        py.FS.writeFile('/methods/__init__.py', '');
        py.FS.writeFile('/methods/parser.py', parserCode);
        py.FS.writeFile('/methods/derivatives.py', derivCode);
        
        if (!isMounted) return;
        setStatus("Inisialisasi Selesai!");
        setPyodide(py);
        setIsLoading(false);
      } catch (err) {
        console.error("Pyodide init failed:", err);
        if (isMounted) {
          setStatus("Gagal memuat sistem matematika. Coba refresh halaman.");
        }
      }
    }
    
    // Check if pyodide script is loaded
    if ((window as any).loadPyodide) {
      initPyodide();
    } else {
      const interval = setInterval(() => {
        if ((window as any).loadPyodide) {
          clearInterval(interval);
          initPyodide();
        }
      }, 100);
    }
    
    return () => { isMounted = false; };
  }, []);

  return { pyodide, isLoading, status };
}
