import React from 'react';
import { X, ZoomIn, ZoomOut, Move, RotateCcw, Crosshair, Check } from 'lucide-react';
import { PageImage } from '../types';

interface GaliciaPageAdjustModalProps {
  page: PageImage;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<PageImage>) => void;
}

export const GaliciaPageAdjustModal: React.FC<GaliciaPageAdjustModalProps> = ({
  page,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [fitMode, setFitMode] = React.useState<'contain' | 'cover'>(
    page.fitMode === 'cover' ? 'cover' : 'contain'
  );
  const [zoom, setZoom] = React.useState<number>(page.zoom || 1);
  const [panX, setPanX] = React.useState<number>(page.panX ?? 0);
  const [panY, setPanY] = React.useState<number>(page.panY ?? 0);

  // Zoom > 1 automatically switches fitMode to 'cover' as requested
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(3, Math.max(1, Math.round(newZoom * 10) / 10));
    setZoom(clamped);
    if (clamped > 1 && fitMode === 'contain') {
      setFitMode('cover');
    }
  };

  const handleCenter = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleReset = () => {
    setFitMode('contain');
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleApply = () => {
    onSave({
      fitMode,
      zoom,
      panX,
      panY,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Ajustar Encuadre · Pág {page.pageNumber}</span>
              <span className="text-[11px] font-mono text-pink-300 bg-pink-950/80 border border-pink-800 px-2 py-0.5 rounded">
                Vectorial
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajustes de zoom y desplazamiento sin perder la nitidez original del PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Area (A5 portrait ratio container) */}
        <div className="p-5 bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800">
          <div className="w-48 sm:w-56 aspect-[1/1.414] bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl relative flex items-center justify-center">
            {page.dataUrl ? (
              <img
                src={page.dataUrl}
                alt={`Página ${page.pageNumber}`}
                className="w-full h-full select-none pointer-events-none transition-transform duration-75 ease-out"
                referrerPolicy="no-referrer"
                style={{
                  objectFit: fitMode === 'cover' ? 'cover' : 'contain',
                  transform: `scale(${zoom}) translate(${panX / zoom}%, ${panY / zoom}%)`,
                  transformOrigin: 'center center',
                }}
              />
            ) : (
              <span className="text-xs text-slate-500 font-mono">Sin imagen</span>
            )}

            {/* Subtle center crosshair guide */}
            <div className="absolute inset-0 pointer-events-none border border-pink-500/10" />
          </div>
          <span className="text-[10px] text-slate-400 mt-2 font-mono">
            {fitMode === 'cover' ? 'Modo: ENCUADRAR' : 'Modo: COMPLETA'} · Zoom: {zoom.toFixed(1)}x · Pan: ({panX}, {panY})
          </span>
        </div>

        {/* Modal Controls */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Modo de Visualización
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFitMode('contain');
                  if (zoom > 1) setZoom(1);
                }}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                  fitMode === 'contain' && zoom === 1
                    ? 'bg-pink-950/70 border-pink-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs">COMPLETA</span>
                <span className="text-[10px] text-slate-400">Se ve toda la página.</span>
              </button>

              <button
                type="button"
                onClick={() => setFitMode('cover')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                  fitMode === 'cover' || zoom > 1
                    ? 'bg-pink-950/70 border-pink-500 text-white shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs">ENCUADRAR</span>
                <span className="text-[10px] text-slate-400">Llena la página y permite acercar o mover.</span>
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-pink-400" /> Zoom
              </span>
              <span className="font-mono text-pink-300 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800/60 text-[11px]">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.2)}
                disabled={zoom <= 1}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.2)}
                disabled={zoom >= 3}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pan Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Horizontal */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-pink-400" /> Desp. Horizontal
                </span>
                <span className="font-mono text-slate-300 text-[10px]">{panX}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Izq (-100)</span>
                <span>Centro</span>
                <span>Der (+100)</span>
              </div>
            </div>

            {/* Vertical */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-pink-400" /> Desp. Vertical
                </span>
                <span className="font-mono text-slate-300 text-[10px]">{panY}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Arriba (-100)</span>
                <span>Centro</span>
                <span>Abajo (+100)</span>
              </div>
            </div>
          </div>

          {/* Reset & Quick Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCenter}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition border border-slate-750 gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5 text-pink-400" />
                CENTRAR
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition border border-slate-750 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                RESTABLECER
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold transition shadow-md gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aplicar
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
