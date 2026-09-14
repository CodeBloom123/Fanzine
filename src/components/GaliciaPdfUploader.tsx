import React, { useRef, useState } from 'react';
import {
  FileUp,
  Trash2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileCheck,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { GaliciaPdfSource, PageImage } from '../types';
import { GaliciaPageAdjustModal } from './GaliciaPageAdjustModal';

interface GaliciaPdfUploaderProps {
  pages: Map<number, PageImage>;
  pageCount: number;
  galiciaSource: GaliciaPdfSource | null;
  isImporting: boolean;
  importProgress: { current: number; total: number } | null;
  warning?: string | null;
  onImportPdf: (file: File) => void;
  onMovePage: (fromPage: number, toPage: number) => void;
  onClearAll: () => void;
  onAlignBackCover?: () => void;
  onUpdatePageComposition?: (pageNumber: number, updates: Partial<PageImage>) => void;
}

export const GaliciaPdfUploader: React.FC<GaliciaPdfUploaderProps> = ({
  pages,
  pageCount = 12,
  galiciaSource,
  isImporting,
  importProgress,
  warning,
  onImportPdf,
  onMovePage,
  onClearAll,
  onAlignBackCover,
  onUpdatePageComposition,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adjustingPage, setAdjustingPage] = useState<PageImage | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportPdf(file);
    }
    // Reset file input so user can re-select the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onImportPdf(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const filledCount = Array.from({ length: pageCount }, (_, i) => pages.has(i + 1)).filter(Boolean).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>1. Importar PDF Maquetado (Prueba Galicia)</span>
              <span className="text-xs font-mono font-bold bg-pink-950 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-md">
                {filledCount} / {pageCount} Páginas Lógicas
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cada página horizontal se divide exactamente por el centro en <strong>Izquierda</strong> y <strong>Derecha</strong>.
            Compatible con cualquier número de dobles páginas (2 = 4 págs, 4 = 8 págs, 6 = 12 págs, 7 = 14 págs, etc.).
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          <button
            type="button"
            id="import-galicia-pdf-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`inline-flex items-center px-4 py-2.5 text-xs font-bold rounded-xl text-white transition shadow-md ${
              isImporting
                ? 'bg-slate-700 cursor-not-allowed opacity-80'
                : 'bg-pink-600 hover:bg-pink-500 active:scale-[0.98]'
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-pink-300" />
                Importando PDF… {importProgress ? `${importProgress.current} / ${importProgress.total}` : ''}
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 mr-2" />
                IMPORTAR PDF / CANVA
              </>
            )}
          </button>

          {filledCount > 0 && !isImporting && (
            <button
              type="button"
              id="clear-galicia-pages-btn"
              onClick={onClearAll}
              className="inline-flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-950/40 border border-slate-800 hover:border-red-900 transition"
              title="Vaciar fanzine y PDF actual"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Warning Notice if applicable */}
      {warning && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{warning}</span>
          </div>
          {onAlignBackCover && galiciaSource && galiciaSource.logicalPageCount % 4 !== 0 && (
            <button
              type="button"
              id="align-galicia-back-cover-btn"
              onClick={onAlignBackCover}
              className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700/80 text-[11px] font-bold transition shadow-sm"
            >
              {pageCount === galiciaSource.logicalPageCount
                ? `📐 Colocar Pág ${galiciaSource.logicalPageCount} como Contraportada exterior`
                : `↩️ Restaurar orden correlativo (${galiciaSource.logicalPageCount} págs)`}
            </button>
          )}
        </div>
      )}

      {/* PDF Metadata Status Card */}
      {galiciaSource && (
        <div className="p-3.5 bg-slate-950/80 border border-pink-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pink-950/60 border border-pink-800/80 text-pink-300">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span>{galiciaSource.name}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.2 rounded-full font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PDF Vectorial Listo
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {galiciaSource.importMode === 'single-pages'
                  ? `${galiciaSource.sourcePageCount} páginas individuales origen · ${Math.round(galiciaSource.widthPt)} × ${Math.round(galiciaSource.heightPt)} pt`
                  : `${galiciaSource.sourcePageCount} dobles páginas origen → ${galiciaSource.logicalPageCount} páginas lógicas de fanzine · ${Math.round(galiciaSource.widthPt)} × ${Math.round(galiciaSource.heightPt)} pt`}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-pink-300 font-mono self-start sm:self-auto bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            Sin pérdida de calidad (100% Vectorial)
          </div>
        </div>
      )}

      {/* Content Area: Dropzone or Grid */}
      {filledCount === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isImporting && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isImporting
              ? 'border-pink-500/50 bg-pink-950/10 cursor-wait'
              : 'border-slate-800 hover:border-pink-500/60 bg-slate-950/40 hover:bg-slate-950/80'
          }`}
        >
          <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-800/40 text-pink-400">
            {isImporting ? (
              <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
            ) : (
              <FileUp className="w-8 h-8 text-pink-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {isImporting
                ? `Procesando y dividiendo páginas (${importProgress?.current || 0} / ${importProgress?.total || 0})…`
                : 'Haz clic o arrastra aquí tu PDF de dobles páginas'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Exportado desde Canva, PowerPoint o Google Slides en formato apaisado.
              Admite cualquier número de dobles páginas (por ejemplo 2, 4, 6, 7 u 8 dobles páginas).
            </p>
          </div>
          <span className="text-[11px] text-pink-300 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800 mt-1">
            Formatos admitidos: .pdf
          </span>
        </div>
      ) : (
        /* Grid of Logical Pages */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Páginas lógicas resultantes (orden secuencial de lectura 1 a {pageCount})</span>
            <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-pink-400" /> PDF original conservado · ajustes sin perder calidad
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: pageCount }, (_, index) => {
              const pageNum = index + 1;
              const page = pages.get(pageNum);
              const isCover = pageNum === 1;
              const isBackCover = pageNum === pageCount;
              const isSinglePages = galiciaSource?.importMode === 'single-pages';

              return (
                <div
                  key={pageNum}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-sm relative group hover:border-slate-700 transition"
                >
                  {/* Top Badge Info */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold font-mono text-xs text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      PÁG {pageNum}
                    </span>
                    {isCover && (
                      <span className="text-[10px] font-bold text-pink-300 bg-pink-950/80 border border-pink-800 px-1.5 py-0.5 rounded">
                        Portada
                      </span>
                    )}
                    {isBackCover && (
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-1.5 py-0.5 rounded">
                        Contra
                      </span>
                    )}
                    {!isCover && !isBackCover && page?.sourcePdfPage && (
                      <span className="text-[9px] font-mono text-slate-400">
                        {isSinglePages
                          ? `PDF ${page.sourcePdfPage}`
                          : `Doble ${page.sourcePdfPage} · ${page.sourcePdfHalf === 'left' ? 'Izq' : 'Der'}`}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Preview showing adjustments */}
                  <div className="aspect-[1/1.414] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative flex items-center justify-center">
                    {page?.dataUrl ? (
                      <img
                        src={page.dataUrl}
                        alt={`Página ${pageNum}`}
                        className="w-full h-full select-none"
                        style={{
                          objectFit: page.fitMode === 'cover' ? 'cover' : 'contain',
                          transform: page.zoom || page.panX || page.panY
                            ? `scale(${page.zoom || 1}) translate(${(page.panX || 0) / (page.zoom || 1)}%, ${(page.panY || 0) / (page.zoom || 1)}%)`
                            : undefined,
                          transformOrigin: 'center center',
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xs text-slate-600 font-mono">Página en blanco</span>
                    )}
                  </div>

                  {/* Footer metadata, adjust button & reorder controls */}
                  <div className="mt-2.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] gap-1">
                    <span className="text-slate-400 font-mono flex items-center gap-1 truncate">
                      {isSinglePages ? `Página ${page?.sourcePdfPage || pageNum}` : page?.sourcePdfHalf === 'left' ? 'Mitad Izq' : 'Mitad Der'}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Adjust Button */}
                      {page && (
                        <button
                          type="button"
                          id={`adjust-page-btn-${pageNum}`}
                          onClick={() => setAdjustingPage(page)}
                          className="px-2 py-1 rounded bg-slate-850 hover:bg-pink-950/80 text-slate-300 hover:text-pink-300 border border-slate-750 hover:border-pink-800 transition flex items-center gap-1 font-medium text-[10px]"
                          title="Ajustar encuadre o zoom"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-pink-400" />
                          <span>AJUSTAR</span>
                        </button>
                      )}

                      {/* Reorder Arrows */}
                      <div className="flex items-center space-x-0.5">
                        <button
                          type="button"
                          onClick={() => onMovePage(pageNum, pageNum - 1)}
                          disabled={pageNum === 1}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition"
                          title="Mover a la izquierda"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMovePage(pageNum, pageNum + 1)}
                          disabled={pageNum === pageCount}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition"
                          title="Mover a la derecha"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustingPage && (
        <GaliciaPageAdjustModal
          page={adjustingPage}
          isOpen={true}
          onClose={() => setAdjustingPage(null)}
          onSave={(updates) => {
            if (onUpdatePageComposition) {
              onUpdatePageComposition(adjustingPage.pageNumber, updates);
            }
          }}
        />
      )}
    </div>
  );
};
