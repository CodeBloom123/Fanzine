import React, { useState } from 'react';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageUploader } from './components/ImageUploader';
import { GaliciaPdfUploader } from './components/GaliciaPdfUploader';
import { ImpositionPreview } from './components/ImpositionPreview';
import { VirtualFanzine } from './components/VirtualFanzine';
import { PythonCodeModal } from './components/PythonCodeModal';
import { GaliciaPdfSource, ImpositionConfig, PageImage } from './types';
import { generateSampleFanzinePages } from './utils/sampleImages';
import { generateFanzinePDF } from './utils/pdfGenerator';
import { analyzeImageDimensions } from './utils/pageRenderer';
import { importGaliciaPdf } from './utils/galiciaPdfImporter';
import { BookOpen, Download, Layers } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [pages, setPages] = useState<Map<number, PageImage>>(new Map<number, PageImage>());

  const [config, setConfig] = useState<ImpositionConfig>({
    fanzineFormat: 'saddle-stitch',
    pageCount: 12,
    gutterMm: 2.0,
    fitMode: 'cover',
    showFoldLines: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center',
    backgroundColor: '#ffffff',
    useCustomSpineColor: false,
    spineColor: '#1e293b',
    spineApplyScope: 'all-pages',
    spineWidthMm: 6,
    dpi: 300,
  });

  const [galiciaPdfSource, setGaliciaPdfSource] = useState<GaliciaPdfSource | null>(null);
  const [isImportingGaliciaPdf, setIsImportingGaliciaPdf] = useState(false);
  const [galiciaImportProgress, setGaliciaImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [galiciaWarning, setGaliciaWarning] = useState<string | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'imposition' | 'reader'>('imposition');

  const isMiniZine = config.fanzineFormat === 'mini-zine-8';
  const isGaliciaPdf = config.fanzineFormat === 'galicia-pdf';
  const currentPageCount = isMiniZine
    ? 8
    : isGaliciaPdf
    ? galiciaPdfSource?.logicalPageCount || config.pageCount || 12
    : config.pageCount || 12;

  // Effective display config for clean preview rendering in Prueba Galicia
  const galiciaDisplayConfig: ImpositionConfig = {
    ...config,
    fanzineFormat: 'galicia-pdf',
    pageCount: currentPageCount,
  };
  const effectiveConfig = isGaliciaPdf ? galiciaDisplayConfig : config;

  // Single page upload
  const handleUploadPage = (pageNumber: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const existing = pages.get(pageNumber);

      const img = new Image();
      img.onload = () => {
        const origW = img.naturalWidth || 800;
        const origH = img.naturalHeight || 1130;
        const analysis = analyzeImageDimensions(origW, origH);

        const newImage: PageImage = {
          id: existing?.id || `page-${pageNumber}-${Date.now()}`,
          pageNumber,
          dataUrl,
          name: file.name,
          width: origW,
          height: origH,
          originalWidth: origW,
          originalHeight: origH,
          aspectRatio: analysis.ratio,
          suggestedRotation: analysis.suggestedRotation,
          fitMode: existing?.fitMode || (analysis.isLandscape ? 'smart' : config.fitMode || 'cover'),
          panX: existing?.panX ?? 0,
          panY: existing?.panY ?? 0,
          zoom: existing?.zoom ?? 1,
          rotation: existing?.rotation ?? 0,
          flipX: existing?.flipX ?? false,
          flipY: existing?.flipY ?? false,
          backgroundStrategy: existing?.backgroundStrategy || analysis.recommendedBg,
          backgroundColor: existing?.backgroundColor,
          textOverlay: existing?.textOverlay,
        };

        setPages((prev) => {
          const next = new Map<number, PageImage>(prev);
          next.set(pageNumber, newImage);
          return next;
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Bulk page upload
  const handleUploadMultiple = (files: FileList) => {
    const fileArray = Array.from(files).slice(0, currentPageCount);
    fileArray.forEach((file, index) => {
      const pageNum = index + 1;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const existing = pages.get(pageNum);

        const img = new Image();
        img.onload = () => {
          const origW = img.naturalWidth || 800;
          const origH = img.naturalHeight || 1130;
          const analysis = analyzeImageDimensions(origW, origH);

          const newImage: PageImage = {
            id: existing?.id || `page-${pageNum}-${Date.now()}`,
            pageNumber: pageNum,
            dataUrl,
            name: file.name,
            width: origW,
            height: origH,
            originalWidth: origW,
            originalHeight: origH,
            aspectRatio: analysis.ratio,
            suggestedRotation: analysis.suggestedRotation,
            fitMode: existing?.fitMode || (analysis.isLandscape ? 'smart' : config.fitMode || 'cover'),
            panX: existing?.panX ?? 0,
            panY: existing?.panY ?? 0,
            zoom: existing?.zoom ?? 1,
            rotation: existing?.rotation ?? 0,
            flipX: existing?.flipX ?? false,
            flipY: existing?.flipY ?? false,
            backgroundStrategy: existing?.backgroundStrategy || analysis.recommendedBg,
            backgroundColor: existing?.backgroundColor,
            textOverlay: existing?.textOverlay,
          };

          setPages((prev) => {
            const next = new Map<number, PageImage>(prev);
            next.set(pageNum, newImage);
            return next;
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Update page composition
  const handleUpdatePageComposition = (pageNumber: number, updates: Partial<PageImage>) => {
    setPages((prev) => {
      const next = new Map<number, PageImage>(prev);
      const existing = next.get(pageNumber);
      if (existing) {
        const updatedItem: PageImage = {
          ...existing,
          ...updates,
          pageNumber,
        };
        next.set(pageNumber, updatedItem);
      }
      return next;
    });
  };

  // Remove page
  const handleRemovePage = (pageNumber: number) => {
    setPages((prev) => {
      const next = new Map<number, PageImage>(prev);
      next.delete(pageNumber);
      return next;
    });
  };

  // Move / Swap page positions preserving all composition properties
  const handleMovePage = (fromPage: number, toPage: number) => {
    if (toPage < 1 || toPage > currentPageCount) return;

    setPages((prev) => {
      const next = new Map<number, PageImage>(prev);
      const imgFrom = next.get(fromPage);
      const imgTo = next.get(toPage);

      if (imgFrom) {
        next.set(toPage, { ...imgFrom, pageNumber: toPage });
      } else {
        next.delete(toPage);
      }

      if (imgTo) {
        next.set(fromPage, { ...imgTo, pageNumber: fromPage });
      } else {
        next.delete(fromPage);
      }

      return next;
    });
  };

  // Clear all pages
  const handleClearAll = () => {
    setPages(new Map());
    if (isGaliciaPdf) {
      setGaliciaPdfSource(null);
      setGaliciaWarning(null);
      setGaliciaImportProgress(null);
    }
  };

  // Import Canva/Slides PDF in Prueba Galicia
  const handleImportGaliciaPdf = async (file: File) => {
    setIsImportingGaliciaPdf(true);
    setGaliciaWarning(null);
    try {
      const result = await importGaliciaPdf(file, (curr, total) => {
        setGaliciaImportProgress({ current: curr, total });
      });
      setPages(result.pagesMap);
      setGaliciaPdfSource(result.galiciaSource);
      if (result.warning) {
        setGaliciaWarning(result.warning);
      }
      setConfig((prev) => ({
        ...prev,
        fanzineFormat: 'galicia-pdf',
        pageCount: result.galiciaSource.logicalPageCount,
      }));
    } catch (err: unknown) {
      console.error('Error importando PDF Galicia:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setIsImportingGaliciaPdf(false);
      setGaliciaImportProgress(null);
    }
  };

  // Align last page of Galicia PDF to physical booklet back cover if not multiple of 4
  const handleAlignGaliciaBackCover = () => {
    if (!galiciaPdfSource) return;
    const rawCount = galiciaPdfSource.logicalPageCount;
    const physicalCount = Math.ceil(rawCount / 4) * 4;
    if (physicalCount === rawCount) return;

    if (currentPageCount === rawCount) {
      // Move page rawCount to physicalCount
      setPages((prev) => {
        const next = new Map(prev);
        const lastPage = next.get(rawCount);
        if (lastPage) {
          next.delete(rawCount);
          next.set(physicalCount, { ...lastPage, pageNumber: physicalCount });
        }
        return next;
      });
      setConfig((prev) => ({ ...prev, pageCount: physicalCount }));
    } else {
      // Revert page physicalCount to rawCount
      setPages((prev) => {
        const next = new Map(prev);
        const lastPage = next.get(physicalCount);
        if (lastPage) {
          next.delete(physicalCount);
          next.set(rawCount, { ...lastPage, pageNumber: rawCount });
        }
        return next;
      });
      setConfig((prev) => ({ ...prev, pageCount: rawCount }));
    }
  };

  // Auto-generate sample fanzine pages
  const handleGenerateSample = async () => {
    setIsGeneratingPdf(true);
    try {
      const samplePages = await generateSampleFanzinePages(currentPageCount);
      const map = new Map<number, PageImage>();
      samplePages.forEach((p) => map.set(p.pageNumber, p));
      setPages(map);
    } catch (e) {
      console.error('Error al generar fanzine de prueba:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate and Download PDF
  const handleGeneratePdf = async () => {
    if (isGaliciaPdf && !galiciaPdfSource) {
      alert('Primero importa un PDF de dobles páginas.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pdfBytes = await generateFanzinePDF(
        pages,
        effectiveConfig,
        galiciaPdfSource?.bytes
      );
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = isGaliciaPdf
        ? `prueba_galicia_${currentPageCount}_paginas_a4.pdf`
        : isMiniZine
        ? 'mini_fanzine_1_hoja_a4_8_paginas.pdf'
        : `fanzine_cuadernillo_${currentPageCount}_paginas_a4.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      console.error('Error generando PDF:', e);
      const msg = e instanceof Error ? e.message : 'Ocurrió un error al generar el PDF. Por favor reintenta.';
      alert(msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        pageCount={currentPageCount}
        fanzineFormat={config.fanzineFormat}
        onGenerateSample={handleGenerateSample}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onGeneratePdf={handleGeneratePdf}
        isGeneratingPdf={isGeneratingPdf}
        pagesLoadedCount={pages.size}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Settings Panel with Format Switcher */}
        <SettingsPanel config={config} onChange={setConfig} />

        {/* Page Uploader: Dedicated Galicia PDF Uploader vs Standard Image Uploader */}
        {isGaliciaPdf ? (
          <GaliciaPdfUploader
            pages={pages}
            pageCount={currentPageCount}
            galiciaSource={galiciaPdfSource}
            isImporting={isImportingGaliciaPdf}
            importProgress={galiciaImportProgress}
            warning={galiciaWarning}
            onImportPdf={handleImportGaliciaPdf}
            onMovePage={handleMovePage}
            onClearAll={handleClearAll}
            onAlignBackCover={handleAlignGaliciaBackCover}
            onUpdatePageComposition={handleUpdatePageComposition}
          />
        ) : (
          <ImageUploader
            pages={pages}
            pageCount={currentPageCount}
            config={config}
            onUploadPage={handleUploadPage}
            onUploadMultiple={handleUploadMultiple}
            onRemovePage={handleRemovePage}
            onMovePage={handleMovePage}
            onClearAll={handleClearAll}
            onUpdatePageComposition={handleUpdatePageComposition}
          />
        )}

        {/* Tab View Selector (Imposition Preview vs Virtual Reader) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pt-2 pb-1 gap-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="tab-imposition-btn"
              onClick={() => setActiveTab('imposition')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'imposition'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              {isGaliciaPdf
                ? 'Prueba Galicia · Imposición A4 (Caras y Pliegos)'
                : isMiniZine
                ? 'Pliego Mini Fanzine (1 Hoja A4 · 8 Pág)'
                : 'Esquema de Imposición A4 (Caras y Pliegos)'}
            </button>

            <button
              type="button"
              id="tab-reader-btn"
              onClick={() => setActiveTab('reader')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
                activeTab === 'reader'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Lector Virtual Flipbook (1 a {currentPageCount})
            </button>
          </div>

          <button
            type="button"
            id="download-pdf-mid-btn"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isGaliciaPdf
              ? `DESCARGAR PDF PRUEBA GALICIA (${currentPageCount} Pág A4)`
              : isMiniZine
              ? 'Descargar PDF Mini Fanzine (1 Hoja A4)'
              : `Descargar PDF Cuadernillo (${currentPageCount} Pág)`}
          </button>
        </div>

        {/* Active Tab View */}
        <ErrorBoundary fallbackTitle="Error al renderizar la previsualización">
          {activeTab === 'imposition' ? (
            <ImpositionPreview pages={pages} config={effectiveConfig} />
          ) : (
            <VirtualFanzine pages={pages} pageCount={currentPageCount} config={effectiveConfig} />
          )}
        </ErrorBoundary>

      </main>

      {/* Python Code Modal */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-4 text-center text-xs text-slate-500">
        Ternura Radikal — Generador de Fanzines & Atajo Lauriña (Cuadernillos A5 & Mini Fanzine 1 A4)
      </footer>

    </div>
  );
}
