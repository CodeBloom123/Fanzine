import React, { useState, useEffect } from 'react';
import { ImpositionConfig, PageImage } from '../types';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { PageView } from './PageView';

interface VirtualFanzineProps {
  pages: Map<number, PageImage>;
  pageCount?: number;
  config: ImpositionConfig;
}

export const VirtualFanzine: React.FC<VirtualFanzineProps> = ({ pages, pageCount = 12, config }) => {
  const [spreadIndex, setSpreadIndex] = useState<number>(0);

  // Generate spreads dynamically based on pageCount
  const spreads: Array<{ left: number | null; right: number | null; label: string }> = [];

  // Cover spread
  spreads.push({ left: null, right: 1, label: `Portada (Página 1)` });

  const centerL = Math.floor(pageCount / 2);
  const centerR = centerL + 1;

  // Inside spreads: [2,3], [4,5] ... [N-2, N-1]
  for (let p = 2; p < pageCount; p += 2) {
    const isCenter = p === centerL && p + 1 === centerR;
    const label = isCenter
      ? `Páginas ${p} y ${p + 1} (Centro del Fanzine)`
      : `Páginas ${p} y ${p + 1}`;
    spreads.push({ left: p, right: p + 1, label });
  }

  // Back cover spread
  spreads.push({ left: pageCount, right: null, label: `Contraportada (Página ${pageCount})` });

  // Clamp spreadIndex safely
  const safeSpreadIndex = Math.min(spreadIndex, Math.max(0, spreads.length - 1));

  // Reset spreadIndex if out of bounds on pageCount change
  useEffect(() => {
    if (spreadIndex >= spreads.length) {
      setSpreadIndex(0);
    }
  }, [pageCount, spreads.length, spreadIndex]);

  const currentSpread = spreads[safeSpreadIndex] || spreads[0];

  const leftImg = currentSpread.left ? pages.get(currentSpread.left) : null;
  const rightImg = currentSpread.right ? pages.get(currentSpread.right) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-5 h-5 text-pink-400" />
            <span>3. Lectura Virtual del Fanzine (Orden 1 a {pageCount})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hojea tu fanzine como lo leerá tu público una vez impreso, doblado y engrapado.
          </p>
        </div>

        {/* Spread Navigation Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            id="prev-spread-btn"
            disabled={safeSpreadIndex === 0}
            onClick={() => setSpreadIndex(() => Math.max(0, safeSpreadIndex - 1))}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold bg-slate-950 text-pink-300 border border-slate-800 px-3 py-1.5 rounded-lg min-w-[150px] text-center">
            {currentSpread.label}
          </span>

          <button
            type="button"
            id="next-spread-btn"
            disabled={safeSpreadIndex === spreads.length - 1}
            onClick={() => setSpreadIndex(() => Math.min(spreads.length - 1, safeSpreadIndex + 1))}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Book Spread Simulation Canvas */}
      <div className="relative aspect-[1.414/1] w-full max-w-2xl mx-auto bg-slate-950 rounded-2xl border border-slate-800 p-3 sm:p-5 flex items-center justify-between gap-2 shadow-2xl">
        
        {/* Left Book Page */}
        <div className="flex-1 h-full bg-slate-900 rounded-l-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-1 relative group">
          {currentSpread.left ? (
            <PageView
              page={leftImg || undefined}
              pageNumber={currentSpread.left}
              config={config}
              isLeftPage={true}
              showBadge={config.showPageNumbers}
              aspectRatioClass="h-full w-full"
            />
          ) : (
            <div className="text-xs text-slate-600 font-mono italic text-center p-2">
              (Espacio Exterior - Portada en lado derecho)
            </div>
          )}

          {currentSpread.left && (
            <span className="absolute bottom-2 left-2 z-20 bg-slate-950/90 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              PÁG {currentSpread.left}
            </span>
          )}
        </div>

        {/* Center Spine Drop Shadow Line */}
        <div
          className="w-3 h-full border-x border-slate-800 flex items-center justify-center shrink-0 shadow-inner relative transition-colors"
          style={{
            backgroundColor:
              config?.useCustomSpineColor &&
              (config.spineApplyScope !== 'cover-only' || safeSpreadIndex === 0 || safeSpreadIndex === spreads.length - 1)
                ? config.spineColor || '#1e293b'
                : '#020617',
          }}
          title={
            config?.useCustomSpineColor
              ? `Lomo en color (${config.spineColor})`
              : 'Pliegue del lomo'
          }
        >
          <div className="w-0.5 h-full bg-slate-800/80" />
        </div>

        {/* Right Book Page */}
        <div className="flex-1 h-full bg-slate-900 rounded-r-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-1 relative group">
          {currentSpread.right ? (
            <PageView
              page={rightImg || undefined}
              pageNumber={currentSpread.right}
              config={config}
              isLeftPage={false}
              showBadge={config.showPageNumbers}
              aspectRatioClass="h-full w-full"
            />
          ) : (
            <div className="text-xs text-slate-600 font-mono italic text-center p-2">
              (Espacio Exterior - Contraportada en lado izquierdo)
            </div>
          )}

          {currentSpread.right && (
            <span className="absolute bottom-2 right-2 z-20 bg-slate-950/90 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              PÁG {currentSpread.right}
            </span>
          )}
        </div>

      </div>

    </div>
  );
};

