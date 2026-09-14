import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Type,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { FitMode, ImpositionConfig, PageImage } from '../types';
import { PageView } from './PageView';
import { PageEditModal } from './PageEditModal';

interface ImageUploaderProps {
  pages: Map<number, PageImage>;
  pageCount: number;
  config: ImpositionConfig;
  onUploadPage: (pageNumber: number, file: File) => void;
  onUploadMultiple: (files: FileList) => void;
  onRemovePage: (pageNumber: number) => void;
  onMovePage: (fromPage: number, toPage: number) => void;
  onClearAll: () => void;
  onUpdatePageComposition: (pageNumber: number, updates: Partial<PageImage>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  pages,
  pageCount = 12,
  config,
  onUploadPage,
  onUploadMultiple,
  onRemovePage,
  onMovePage,
  onClearAll,
  onUpdatePageComposition,
}) => {
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [editingPageNum, setEditingPageNum] = useState<number | null>(null);

  const handleBulkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadMultiple(e.target.files);
    }
  };

  const filledCount = Array.from({ length: pageCount }, (_, i) => pages.has(i + 1)).filter(Boolean).length;
  const centerL = Math.floor(pageCount / 2);
  const centerR = centerL + 1;

  const editingPage = editingPageNum ? pages.get(editingPageNum) : undefined;

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
            Cada página tiene sus propios controles independientes de <strong>Rellenar / Ajustar / Estirar</strong>, <strong>reencuadre por arrastre</strong> y <strong>texto</strong>.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: pageCount }, (_, idx) => {
          const pageNum = idx + 1;
          const page = pages.get(pageNum);

          const isCover = pageNum === 1;
          const isBackCover = pageNum === pageCount;
          const isCenterSpread = pageNum === centerL || pageNum === centerR;

          const effectiveFit: FitMode = page?.fitMode || config.fitMode || 'cover';
          const isPanned = (page?.panX ?? 0) !== 0 || (page?.panY ?? 0) !== 0 || (page?.zoom ?? 1) !== 1;
          const hasText = !!(page?.textOverlay?.enabled && page.textOverlay.text.trim().length > 0);

          return (
            <div
              key={pageNum}
              className={`relative rounded-xl border transition-all flex flex-col justify-between overflow-hidden bg-slate-950 ${
                page
                  ? 'border-slate-700 shadow-md'
                  : 'border-dashed border-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Header Badge & Position Controls */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-[11px] font-medium">
                <span className="flex items-center space-x-1.5">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
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
                  <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[80px]">
                    {isCover ? 'Portada' : isBackCover ? 'Contra' : isCenterSpread ? 'Centro' : ''}
                  </span>
                </span>

                <div className="flex items-center space-x-1">
                  {page && (
                    <>
                      <button
                        type="button"
                        disabled={pageNum === 1}
                        onClick={() => onMovePage(pageNum, pageNum - 1)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                        title="Mover a la izquierda"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={pageNum === pageCount}
                        onClick={() => onMovePage(pageNum, pageNum + 1)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                        title="Mover a la derecha"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  {page ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>
              </div>

              {/* Main Content Area / Interactive PageView */}
              <div className="relative w-full flex items-center justify-center p-2 bg-slate-950/70">
                {page ? (
                  <div className="relative w-full max-w-[260px] mx-auto rounded-lg overflow-hidden border border-slate-800 group shadow-inner">
                    <PageView
                      page={page}
                      pageNumber={pageNum}
                      config={config}
                      interactive={true}
                      onUpdateComposition={(updates) => onUpdatePageComposition(pageNum, updates)}
                      showBadge={false}
                    />

                    {/* Quick overlay actions button */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition z-20">
                      <button
                        type="button"
                        onClick={() => setEditingPageNum(pageNum)}
                        className="p-1 rounded-md bg-slate-900/90 text-slate-200 hover:text-pink-400 border border-slate-700 text-[10px] flex items-center gap-0.5 shadow"
                        title="Abrir editor completo de encuadre y texto"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePage(pageNum)}
                        className="p-1 rounded-md bg-red-950/90 text-red-300 hover:text-red-100 border border-red-800 text-[10px] shadow"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`file-input-${pageNum}`}
                    className="w-full aspect-[1/1.414] max-w-[240px] mx-auto flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-pink-400 cursor-pointer transition text-center p-4 border border-dashed border-slate-800 rounded-lg bg-slate-900/40 hover:bg-slate-900"
                  >
                    <Plus className="w-8 h-8 stroke-1 text-slate-400" />
                    <span className="text-xs font-semibold">Subir Pág {pageNum}</span>
                    <span className="text-[10px] text-slate-500">Haz clic o arrastra</span>
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

              {/* Individual Page Composition Controls */}
              {page && (
                <div className="px-2.5 py-2 bg-slate-900/95 border-t border-slate-800 space-y-1.5 text-xs">
                  {/* Landscape notice & Quick 90 deg rotation */}
                  {page.aspectRatio && page.aspectRatio > 1.15 && (page.rotation || 0) % 180 === 0 && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded px-1.5 py-0.5 text-[9px] text-amber-300 flex items-center justify-between">
                      <span>Foto apaisada</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePageComposition(pageNum, {
                            rotation: ((page.rotation || 0) + 90) % 360,
                          })
                        }
                        className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-0.5"
                      >
                        <RotateCw className="w-2.5 h-2.5" /> Girar 90°
                      </button>
                    </div>
                  )}

                  {/* Fit mode buttons: RELLENAR | AJUSTAR | AUTO | ESTIRAR */}
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      id={`fit-cover-p${pageNum}`}
                      onClick={() => onUpdatePageComposition(pageNum, { fitMode: 'cover' })}
                      className={`py-1 px-0.5 text-[9px] font-bold rounded transition border text-center ${
                        effectiveFit === 'cover'
                          ? 'bg-pink-600 border-pink-400 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Rellenar marco completo"
                    >
                      LLENAR
                    </button>
                    <button
                      type="button"
                      id={`fit-contain-p${pageNum}`}
                      onClick={() => onUpdatePageComposition(pageNum, { fitMode: 'contain' })}
                      className={`py-1 px-0.5 text-[9px] font-bold rounded transition border text-center ${
                        effectiveFit === 'contain'
                          ? 'bg-pink-600 border-pink-400 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Ajustar completa sin recortar"
                    >
                      AJUSTAR
                    </button>
                    <button
                      type="button"
                      id={`fit-smart-p${pageNum}`}
                      onClick={() => onUpdatePageComposition(pageNum, { fitMode: 'smart' })}
                      className={`py-1 px-0.5 text-[9px] font-bold rounded transition border text-center ${
                        effectiveFit === 'smart'
                          ? 'bg-pink-600 border-pink-400 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Auto Inteligente"
                    >
                      AUTO
                    </button>
                    <button
                      type="button"
                      id={`fit-stretch-p${pageNum}`}
                      onClick={() => onUpdatePageComposition(pageNum, { fitMode: 'stretch' })}
                      className={`py-1 px-0.5 text-[9px] font-bold rounded transition border text-center ${
                        effectiveFit === 'stretch'
                          ? 'bg-pink-600 border-pink-400 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Estirar a todo el marco"
                    >
                      ESTIRAR
                    </button>
                  </div>

                  {/* Secondary row: +90° rotation, Text button, Edit modal, and Reset */}
                  <div className="flex items-center justify-between gap-1 text-[10px] pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePageComposition(pageNum, {
                            rotation: ((page.rotation || 0) + 90) % 360,
                          })
                        }
                        className={`p-1 rounded border transition flex items-center gap-0.5 ${
                          (page.rotation || 0) !== 0
                            ? 'bg-pink-950/70 border-pink-500 text-pink-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Girar 90 grados"
                      >
                        <RotateCw className="w-2.5 h-2.5" />
                        <span>{(page.rotation || 0) !== 0 ? `${page.rotation}°` : '90°'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingPageNum(pageNum)}
                        className={`px-1.5 py-1 rounded border transition flex items-center gap-0.5 ${
                          hasText
                            ? 'bg-indigo-950/80 border-indigo-600 text-indigo-200 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Añadir texto a esta página"
                      >
                        <Type className="w-2.5 h-2.5" />
                        <span>{hasText ? 'Texto' : '+Texto'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {isPanned && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePageComposition(pageNum, { panX: 0, panY: 0, zoom: 1 })
                          }
                          className="text-[9px] text-pink-400 hover:text-pink-300 font-medium flex items-center gap-0.5"
                          title="Restablecer encuadre"
                        >
                          <RotateCcw className="w-2 h-2" /> Centrar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingPageNum(pageNum)}
                        className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition flex items-center gap-1"
                        title="Abrir editor completo"
                      >
                        <SlidersHorizontal className="w-2.5 h-2.5 text-pink-400" />
                        <span>Ajustar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer filename */}
              <div className="px-2.5 py-1 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 truncate">
                {page ? page.name : 'Espacio disponible'}
              </div>

            </div>
          );
        })}
      </div>

      {/* Full Page Editing Modal */}
      {editingPageNum && editingPage && (
        <PageEditModal
          pageNumber={editingPageNum}
          page={editingPage}
          config={config}
          isOpen={true}
          onClose={() => setEditingPageNum(null)}
          onUpdate={(updates) => onUpdatePageComposition(editingPageNum, updates)}
        />
      )}

    </div>
  );
};


