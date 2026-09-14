import React from 'react';
import { ImpositionConfig, PageImage } from '../types';
import { PageView } from './PageView';
import { Scissors, HelpCircle, Check, Sparkles } from 'lucide-react';

interface MiniZineSpreadPreviewProps {
  pages: Map<number, PageImage>;
  config: ImpositionConfig;
}

export const MiniZineSpreadPreview: React.FC<MiniZineSpreadPreviewProps> = ({ pages, config }) => {
  // Mini fanzine 8 panels mapping:
  // Top row (180° inverted): [5, 4, 3, 2]
  // Bottom row (0° normal):  [6, 7, 8, 1]
  const topRowPages = [5, 4, 3, 2];
  const bottomRowPages = [6, 7, 8, 1];

  return (
    <div className="space-y-4">
      
      {/* Header Info */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-pink-400">Mini Fanzine One-Sheet</span>
          <span className="text-slate-400">• 1 Sola Hoja A4 • Impresión a 1 cara • 8 Páginas</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-xs"></span>
            Corte Central (Tijera)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 border-t border-dashed border-pink-400"></span>
            Líneas de Plegado
          </span>
        </div>
      </div>

      {/* A4 Landscape Paper Visual Canvas (297 mm x 210 mm = 1.414 ratio) */}
      <div className="relative aspect-[1.414/1] w-full max-w-4xl mx-auto bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-2xl p-2 sm:p-4 overflow-hidden flex flex-col justify-between">
        
        {/* Paper Corner Meta */}
        <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-500 z-30">
          Hoja A4 Desplegada (297 × 210 mm)
        </div>
        <div className="absolute top-2 right-3 text-[9px] font-mono text-slate-500 z-30 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-pink-400" />
          Imposición One-Sheet Zine
        </div>

        {/* 2x4 Panels Grid */}
        <div className="relative w-full flex-1 min-h-0 grid grid-rows-2 gap-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/60 p-1 my-1">
          
          {/* Top Row: 5, 4, 3, 2 (Rotated 180deg) */}
          <div className="grid grid-cols-4 gap-1 relative h-full min-h-0">
            {topRowPages.map((pageNum, colIdx) => {
              const page = pages.get(pageNum);
              return (
                <div
                  key={pageNum}
                  className="relative h-full w-full flex flex-col items-center justify-center bg-slate-950 rounded-lg overflow-hidden border border-slate-800 group"
                >
                  <PageView
                    page={page}
                    pageNumber={pageNum}
                    config={config}
                    rotationDeg={180}
                    showBadge={config.showPageNumbers}
                    aspectRatioClass="h-full w-full"
                  />

                  {/* Panel Identifier Pill */}
                  <div className="absolute top-1.5 left-1.5 z-20 bg-slate-900/90 border border-slate-700 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <span>PÁG {pageNum}</span>
                    <span className="text-[8px] text-slate-400">(180°)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Row: 6, 7, 8, 1 (Normal 0deg) */}
          <div className="grid grid-cols-4 gap-1 relative h-full min-h-0">
            {bottomRowPages.map((pageNum, colIdx) => {
              const page = pages.get(pageNum);
              const isCover = pageNum === 1;
              const isBackCover = pageNum === 8;

              return (
                <div
                  key={pageNum}
                  className="relative h-full w-full flex flex-col items-center justify-center bg-slate-950 rounded-lg overflow-hidden border border-slate-800 group"
                >
                  <PageView
                    page={page}
                    pageNumber={pageNum}
                    config={config}
                    rotationDeg={0}
                    showBadge={config.showPageNumbers}
                    aspectRatioClass="h-full w-full"
                  />

                  {/* Panel Identifier Pill */}
                  <div
                    className={`absolute bottom-1.5 left-1.5 z-20 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow border flex items-center gap-1 ${
                      isCover
                        ? 'bg-pink-950/90 text-pink-300 border-pink-500'
                        : isBackCover
                        ? 'bg-purple-950/90 text-purple-300 border-purple-500'
                        : 'bg-slate-900/90 text-indigo-300 border-slate-700'
                    }`}
                  >
                    <span>PÁG {pageNum}</span>
                    {isCover && <span className="text-[8px] text-pink-400 font-sans font-bold">PORTADA</span>}
                    {isBackCover && <span className="text-[8px] text-purple-400 font-sans font-bold">CONTRA</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- OVERLAY GUIDES (Fold lines & Center Slit) --- */}
          {/* Vertical Fold Lines at 25%, 50%, 75% */}
          <div className="absolute inset-y-0 left-1/4 w-0 border-r border-dashed border-pink-400/40 pointer-events-none z-20" />
          <div className="absolute inset-y-0 left-2/4 w-0 border-r border-dashed border-pink-400/40 pointer-events-none z-20" />
          <div className="absolute inset-y-0 left-3/4 w-0 border-r border-dashed border-pink-400/40 pointer-events-none z-20" />

          {/* Horizontal Fold Line across entire width */}
          <div className="absolute inset-x-0 top-1/2 h-0 border-b border-dashed border-pink-400/40 pointer-events-none z-20" />

          {/* Central Cut Slit (ONLY between middle columns: Col 1 & Col 2, i.e. 25% to 75%) */}
          <div className="absolute top-1/2 left-1/4 w-1/2 -translate-y-1/2 h-1 bg-red-500 shadow-lg shadow-red-500/50 pointer-events-none z-30 rounded-full flex items-center justify-center">
            <div className="bg-red-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow flex items-center gap-1 border border-red-300">
              <Scissors className="w-3 h-3" />
              <span>CORTE CENTRAL</span>
            </div>
          </div>

        </div>

        {/* Footer info inside paper */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Distribución 1 A4: Fila Superior [5 | 4 | 3 | 2] (rotadas) • Fila Inferior [6 | 7 | 8 | 1]</span>
          <span className="flex items-center gap-1 text-emerald-400 font-sans font-medium">
            <Check className="w-3 h-3" /> Imposición One-Sheet Zine Verificada
          </span>
        </div>

      </div>

      {/* Folding Instructions Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
        <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-pink-400" />
          ¿Cómo plegar este mini fanzine de 1 sola hoja?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-400 leading-relaxed">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-pink-300 block mb-0.5">1. Dobleces de cuadrícula:</strong>
            Dobla la hoja A4 por la mitad horizontalmente y luego en 4 partes verticalmente (marcando los 8 paneles).
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-red-400 block mb-0.5">2. Corte central:</strong>
            Dobla la hoja por la mitad a lo largo y realiza un corte con tijera por la línea roja central (solo los 2 paneles centrales).
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-emerald-300 block mb-0.5">3. Pliegue en cruz y librito:</strong>
            Abre la hoja, empuja los extremos hacia el centro para que el corte forme una cruz, y pliega hasta obtener el fanzine en orden 1 a 8.
          </div>
        </div>
      </div>

    </div>
  );
};
