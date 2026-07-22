import React from 'react';
import { BookOpen, Code2, Sparkles, Download, Printer } from 'lucide-react';

const LOGO_URL = '/ternura_radikal_logo.jpg';

interface HeaderProps {
  pageCount?: number;
  onGenerateSample: () => void;
  onOpenPythonModal: () => void;
  onGeneratePdf: () => void;
  isGeneratingPdf: boolean;
  pagesLoadedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  pageCount = 12,
  onGenerateSample,
  onOpenPythonModal,
  onGeneratePdf,
  isGeneratingPdf,
  pagesLoadedCount,
}) => {
  const sheetsCount = Math.ceil(pageCount / 4);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title & Badge with Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-pink-500/40 bg-black shrink-0 group">
              <img
                src={LOGO_URL}
                alt="Ternura Radikal Logo"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <span className="text-pink-400">Ternura Radikal</span>
                  <span className="text-slate-400 font-normal text-sm">|</span>
                  <span className="text-slate-200">Maquetación Fanzines</span>
                </h1>
                <span className="bg-pink-500/20 text-pink-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-pink-500/30 hidden sm:inline-block">
                  Cuadernillo A4 ({pageCount} Pág)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Atajo Lauriña para maquetación automática
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="generate-sample-btn"
              onClick={onGenerateSample}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 transition shadow-sm hover:text-white"
              title="Generar imágenes de prueba ilustradas para probar inmediatamente"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-400" />
              Auto-Cargar Ejemplo ({pageCount} pág)
            </button>

            <button
              id="python-code-btn"
              onClick={onOpenPythonModal}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition hover:text-white"
              title="Ver el código completo en Python (Streamlit + ReportLab)"
            >
              <Code2 className="w-4 h-4 mr-1.5 text-emerald-400" />
              Código Python Streamlit
            </button>

            <button
              id="download-pdf-top-btn"
              onClick={onGeneratePdf}
              disabled={isGeneratingPdf}
              className={`inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg shadow-md transition ${
                isGeneratingPdf
                  ? 'bg-indigo-800 text-indigo-300 cursor-not-allowed opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:shadow-emerald-900/50'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" />
                  Descargar PDF Impresión ({pagesLoadedCount}/{pageCount})
                </>
              )}
            </button>
          </div>

        </div>

        {/* Quick Printing Tip Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Instrucción de Impresión:</strong> Al imprimir en tu impresora, selecciona <span className="text-slate-200 underline decoration-slate-600">Doble Cara</span> y ajusta la orientación a <span className="text-emerald-300 font-medium">Girar en el borde corto (Flip on Short Edge)</span>.
            </span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Hojas A4: {sheetsCount} | Páginas A5: {pageCount} | Formato final doblado: A5 (148.5 x 210 mm)
          </div>
        </div>

      </div>
    </header>
  );
};
