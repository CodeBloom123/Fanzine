import React, { useState } from 'react';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageUploader } from './components/ImageUploader';
import { ImpositionPreview } from './components/ImpositionPreview';
import { VirtualFanzine } from './components/VirtualFanzine';
import { PythonCodeModal } from './components/PythonCodeModal';
import { ImpositionConfig, PageImage } from './types';
import { generateSampleFanzinePages } from './utils/sampleImages';
import { generateFanzinePDF } from './utils/pdfGenerator';
import { BookOpen, Download, HelpCircle, Layers, Printer, Sparkles } from 'lucide-react';

export default function App() {
  const [pages, setPages] = useState<Map<number, PageImage>>(new Map<number, PageImage>());

  const [config, setConfig] = useState<ImpositionConfig>({
    pageCount: 12,
    gutterMm: 2.0,
    fitMode: 'cover',
    showFoldLines: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center',
    backgroundColor: '#ffffff',
    dpi: 300,
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'imposition' | 'reader'>('imposition');

  const currentPageCount = config.pageCount || 12;

  // Single page upload
  const handleUploadPage = (pageNumber: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newImage: PageImage = {
        id: `page-${pageNumber}-${Date.now()}`,
        pageNumber,
        dataUrl,
        name: file.name,
      };

      setPages((prev) => {
        const next = new Map(prev);
        next.set(pageNumber, newImage);
        return next;
      });
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
        const newImage: PageImage = {
          id: `page-${pageNum}-${Date.now()}`,
          pageNumber: pageNum,
          dataUrl,
          name: file.name,
        };

        setPages((prev) => {
          const next = new Map(prev);
          next.set(pageNum, newImage);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove page
  const handleRemovePage = (pageNumber: number) => {
    setPages((prev) => {
      const next = new Map(prev);
      next.delete(pageNumber);
      return next;
    });
  };

  // Move / Swap page positions
  const handleMovePage = (fromPage: number, toPage: number) => {
    if (toPage < 1 || toPage > currentPageCount) return;

    setPages((prev) => {
      const next = new Map(prev);
      const imgFrom = next.get(fromPage) as PageImage | undefined;
      const imgTo = next.get(toPage) as PageImage | undefined;

      if (imgFrom) {
        next.set(toPage, { id: imgFrom.id, pageNumber: toPage, dataUrl: imgFrom.dataUrl, name: imgFrom.name, width: imgFrom.width, height: imgFrom.height });
      } else {
        next.delete(toPage);
      }

      if (imgTo) {
        next.set(fromPage, { id: imgTo.id, pageNumber: fromPage, dataUrl: imgTo.dataUrl, name: imgTo.name, width: imgTo.width, height: imgTo.height });
      } else {
        next.delete(fromPage);
      }

      return next;
    });
  };

  // Clear all pages
  const handleClearAll = () => {
    setPages(new Map());
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
    setIsGeneratingPdf(true);
    try {
      const pdfBytes = await generateFanzinePDF(pages, config);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fanzine_${currentPageCount}_paginas_a4_impresion.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generando PDF:', e);
      alert('Ocurrió un error al generar el PDF. Por favor reintenta.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        pageCount={currentPageCount}
        onGenerateSample={handleGenerateSample}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onGeneratePdf={handleGeneratePdf}
        isGeneratingPdf={isGeneratingPdf}
        pagesLoadedCount={pages.size}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Settings Panel */}
        <SettingsPanel config={config} onChange={setConfig} />

        {/* Page Uploader Grid */}
        <ImageUploader
          pages={pages}
          pageCount={currentPageCount}
          onUploadPage={handleUploadPage}
          onUploadMultiple={handleUploadMultiple}
          onRemovePage={handleRemovePage}
          onMovePage={handleMovePage}
          onClearAll={handleClearAll}
        />

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
              Esquema de Imposición A4
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
            Descargar PDF Cuadernillo
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'imposition' ? (
          <ImpositionPreview pages={pages} config={config} />
        ) : (
          <VirtualFanzine pages={pages} pageCount={currentPageCount} />
        )}

      </main>

      {/* Python Code Modal */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-4 text-center text-xs text-slate-500">
        Ternura Radikal — Generador de Fanzines Atajo Lauriña para Hojas A4 Doble Cara
      </footer>

    </div>
  );
}

