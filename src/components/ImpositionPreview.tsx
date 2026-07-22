import React, { useState, useEffect } from 'react';
import { getImpositionPlan, ImpositionConfig, PageImage } from '../types';
import { FileText, AlertCircle, Check } from 'lucide-react';

interface ImpositionPreviewProps {
  pages: Map<number, PageImage>;
  config: ImpositionConfig;
}

export const ImpositionPreview: React.FC<ImpositionPreviewProps> = ({ pages, config }) => {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);

  const pageCount = config.pageCount || 12;
  const impositionPlan = getImpositionPlan(pageCount);

  // Reset selectedSheetIndex if out of bounds on pageCount change
  useEffect(() => {
    if (selectedSheetIndex >= impositionPlan.length) {
      setSelectedSheetIndex(0);
    }
  }, [pageCount, impositionPlan.length, selectedSheetIndex]);

  const activeSpread = impositionPlan[selectedSheetIndex] || impositionPlan[0];

  const leftPage = pages.get(activeSpread.leftPageNum);
  const rightPage = pages.get(activeSpread.rightPageNum);

  const totalPhysicalSheets = impositionPlan.length / 2;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>2. Vista Previa de Imposición en Pliegos A4</span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-medium">
              Saddle-Stitch {pageCount} Pág
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprueba cómo se distribuyen las páginas en las caras delanteras y traseras de las {totalPhysicalSheets} hojas de papel A4.
          </p>
        </div>

        {/* Sheet Selector Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
          {impositionPlan.map((spread, idx) => (
            <button
              key={idx}
              type="button"
              id={`sheet-tab-${idx}`}
              onClick={() => setSelectedSheetIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedSheetIndex === idx
                  ? 'bg-pink-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PDF Pág {spread.pdfPageNum}
            </button>
          ))}
        </div>
      </div>

      {/* Sheet Metadata Banner */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-pink-400" />
          <span className="font-bold text-slate-200">{activeSpread.sideName}</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-300">
          <span>⬅️ Izquierda: <strong className="text-amber-300">Pág {activeSpread.leftPageNum}</strong></span>
          <span>|</span>
          <span>➡️ Derecha: <strong className="text-indigo-300">Pág {activeSpread.rightPageNum}</strong></span>
          <span>|</span>
          <span>Lomo: <strong className="text-slate-400">{config.gutterMm} mm</strong></span>
        </div>
      </div>

      {/* Visual A4 Landscape Paper Simulation */}
      <div className="relative aspect-[1.414/1] w-full max-w-3xl mx-auto bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden p-3 sm:p-5 flex flex-col justify-between">
        
        {/* Paper Corner Guides */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400">A4 Landscape (297 mm x 210 mm)</div>
        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-400">Hoja {activeSpread.sheetNumber} - Cara {activeSpread.side === 'front' ? 'Delantera' : 'Trasera'}</div>

        {/* The 2 A5 Page Boxes inside A4 Sheet */}
        <div className="relative w-full h-full flex items-center justify-between gap-0 bg-slate-900/60 rounded-xl overflow-hidden p-2">
          
          {/* Left Page Box (A5) */}
          <div className="relative flex-1 h-full flex flex-col items-center justify-center bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 p-2 group">
            {leftPage ? (
              <img
                src={leftPage.dataUrl}
                alt={`Página ${activeSpread.leftPageNum}`}
                className="max-h-full max-w-full object-contain shadow"
              />
            ) : (
              <div className="text-center p-4">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block font-medium">Página {activeSpread.leftPageNum} Sin Cargar</span>
                <span className="text-[10px] text-slate-600">
                  {activeSpread.leftPageNum > pageCount ? '(Página extra para notas)' : '(Se imprimirá en blanco)'}
                </span>
              </div>
            )}

            {/* Page number badge indicator */}
            <div className="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-700 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 rounded shadow">
              PÁGINA {activeSpread.leftPageNum}
            </div>
          </div>

          {/* Center Spine Fold Line (Lomo) & Gutter Indicator */}
          <div className="relative h-full w-8 flex flex-col items-center justify-between py-2 shrink-0">
            {/* Spine Fold Dash */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-pink-400/60 z-10" />

            {/* Gutter Highlight Box */}
            {config.gutterMm > 0 && (
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-pink-500/10 border-x border-pink-500/30 z-0"
                style={{ width: `${Math.min(config.gutterMm * 3, 24)}px` }}
                title={`Compensación de lomo / Gutter: ${config.gutterMm} mm`}
              />
            )}

            <span className="z-20 bg-slate-900/90 text-pink-300 border border-pink-500/40 text-[9px] font-mono px-1 py-0.5 rounded shadow rotate-90">
              LOMO
            </span>
          </div>

          {/* Right Page Box (A5) */}
          <div className="relative flex-1 h-full flex flex-col items-center justify-center bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 p-2 group">
            {rightPage ? (
              <img
                src={rightPage.dataUrl}
                alt={`Página ${activeSpread.rightPageNum}`}
                className="max-h-full max-w-full object-contain shadow"
              />
            ) : (
              <div className="text-center p-4">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                <span className="text-xs text-slate-500 block font-medium">Página {activeSpread.rightPageNum} Sin Cargar</span>
                <span className="text-[10px] text-slate-600">
                  {activeSpread.rightPageNum > pageCount ? '(Página extra para notas)' : '(Se imprimirá en blanco)'}
                </span>
              </div>
            )}

            {/* Page number badge indicator */}
            <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-slate-700 text-indigo-300 font-mono font-bold text-xs px-2 py-0.5 rounded shadow">
              PÁGINA {activeSpread.rightPageNum}
            </div>
          </div>

        </div>

        {/* Footer info inside A4 paper */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>PDF Página {activeSpread.pdfPageNum} de {impositionPlan.length}</span>
          <span className="flex items-center gap-1 text-emerald-400 font-sans font-medium">
            <Check className="w-3 h-3" /> Atajo Lauriña Correcto
          </span>
        </div>

      </div>

      {/* Summary List of All Physical Sheets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs">
        {Array.from({ length: totalPhysicalSheets }, (_, sheetIdx) => {
          const front = impositionPlan[sheetIdx * 2];
          const back = impositionPlan[sheetIdx * 2 + 1];

          return (
            <div
              key={sheetIdx}
              onClick={() => setSelectedSheetIndex(sheetIdx * 2)}
              className={`p-3 rounded-xl border transition cursor-pointer ${
                Math.floor(selectedSheetIndex / 2) === sheetIdx
                  ? 'bg-pink-950/40 border-pink-600/80 text-slate-100 shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span>HOJA {sheetIdx + 1} DE {totalPhysicalSheets}</span>
                <span className="text-[10px] text-pink-400 font-mono">2 Caras</span>
              </div>
              <div className="text-[11px] font-mono space-y-0.5 text-slate-300">
                <div>• Delantera: [{front.leftPageNum} | {front.rightPageNum}]</div>
                <div>• Trasera: [{back.leftPageNum} | {back.rightPageNum}]</div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

