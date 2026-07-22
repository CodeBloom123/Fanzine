import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Code } from 'lucide-react';
import { PYTHON_STREAMLIT_CODE } from '../utils/pythonScript';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_STREAMLIT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([PYTHON_STREAMLIT_CODE], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'generador_fanzine.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Código Completo en Python (Streamlit + ReportLab + Pillow)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Quick Instructions */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Code className="w-4 h-4" /> Instrucciones para Ejecutar en tu Computadora Local:
            </div>
            <ol className="list-decimal list-inside text-slate-300 space-y-1 font-mono text-[11px]">
              <li>
                Instala las dependencias necesarias:{' '}
                <span className="text-emerald-300 font-bold">
                  pip install streamlit reportlab pillow
                </span>
              </li>
              <li>Guarda el siguiente código en un archivo llamado <span className="text-amber-300">generador_fanzine.py</span></li>
              <li>
                Ejecuta la aplicación web local con:{' '}
                <span className="text-indigo-300 font-bold">
                  streamlit run generador_fanzine.py
                </span>
              </li>
            </ol>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-mono">
              fanzine_app.py (Streamlit Web App)
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>
              <button
                type="button"
                onClick={handleDownloadPy}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Descargar generador_fanzine.py
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-[50vh] leading-relaxed">
            <pre>{PYTHON_STREAMLIT_CODE}</pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
