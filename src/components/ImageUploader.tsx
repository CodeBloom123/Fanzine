import React, { useRef } from 'react';
import {
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageImage } from '../types';

interface ImageUploaderProps {
  pages: Map<number, PageImage>;
  pageCount: number;
  onUploadPage: (pageNumber: number, file: File) => void;
  onUploadMultiple: (files: FileList) => void;
  onRemovePage: (pageNumber: number) => void;
  onMovePage: (fromPage: number, toPage: number) => void;
  onClearAll: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  pages,
  pageCount = 12,
  onUploadPage,
  onUploadMultiple,
  onRemovePage,
  onMovePage,
  onClearAll,
}) => {
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const handleBulkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadMultiple(e.target.files);
    }
  };

  const filledCount = Array.from({ length: pageCount }, (_, i) => pages.has(i + 1)).filter(Boolean).length;
  const centerL = Math.floor(pageCount / 2);
  const centerR = centerL + 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>1. Páginas en Orden Secuencial de Lectura</span>
              <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-md">
                {filledCount} / {pageCount} Subidas
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sube o arrastra tus {pageCount} imágenes consecutivas (Pág 1 = Portada, Pág {pageCount} = Contraportada). El sistema realiza la imposición automática.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={bulkInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleBulkChange}
          />
          <button
            type="button"
            id="bulk-upload-btn"
            onClick={() => bulkInputRef.current?.click()}
            className="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition shadow-sm"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Subir las {pageCount} Imágenes Juntas
          </button>

          {filledCount > 0 && (
            <button
              type="button"
              id="clear-all-pages-btn"
              onClick={onClearAll}
              className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-400 border border-slate-700 hover:border-red-800 transition"
              title="Borrar todas las imágenes subidas"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Grid of Page Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: pageCount }, (_, idx) => {
          const pageNum = idx + 1;
          const page = pages.get(pageNum);

          const isCover = pageNum === 1;
          const isBackCover = pageNum === pageCount;
          const isCenterSpread = pageNum === centerL || pageNum === centerR;

          return (
            <div
              key={pageNum}
              className={`relative group rounded-xl border transition-all flex flex-col justify-between overflow-hidden bg-slate-950 ${
                page
                  ? 'border-slate-700 hover:border-indigo-500'
                  : 'border-dashed border-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-[11px] font-medium">
                <span className="flex items-center space-x-1">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      isCover
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isBackCover
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : isCenterSpread
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    PÁG {pageNum}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[70px]">
                    {isCover ? 'Portada' : isBackCover ? 'Contra' : isCenterSpread ? 'Centro' : ''}
                  </span>
                </span>

                {page ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </div>

              {/* Main Content Area / Thumbnail */}
              <div className="relative aspect-[1/1.414] w-full flex items-center justify-center p-2 bg-slate-950/50">
                {page ? (
                  <div className="relative w-full h-full group/img flex items-center justify-center">
                    <img
                      src={page.dataUrl}
                      alt={`Página ${pageNum}`}
                      className="max-h-full max-w-full object-contain rounded shadow"
                    />

                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2 rounded">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={pageNum === 1}
                          onClick={() => onMovePage(pageNum, pageNum - 1)}
                          className="p-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30"
                          title="Mover a la izquierda"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={pageNum === pageCount}
                          onClick={() => onMovePage(pageNum, pageNum + 1)}
                          className="p-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30"
                          title="Mover a la derecha"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemovePage(pageNum)}
                        className="px-2 py-1 rounded-md bg-red-950/90 text-red-300 hover:bg-red-900 border border-red-800 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`file-input-${pageNum}`}
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-indigo-400 cursor-pointer transition text-center p-2"
                  >
                    <Plus className="w-6 h-6 stroke-1" />
                    <span className="text-[11px] font-medium">Subir Pág {pageNum}</span>
                  </label>
                )}

                {/* Hidden File Input */}
                <input
                  id={`file-input-${pageNum}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onUploadPage(pageNum, e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Footer info */}
              <div className="px-2 py-1 bg-slate-900/60 border-t border-slate-800/60 text-[10px] text-slate-400 text-center truncate">
                {page ? page.name : 'Vacío'}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

