import * as pdfjsLib from 'pdfjs-dist';
import { GaliciaPdfSource, PageImage } from '../types';

// Configure PDF.js worker for Vite browser execution
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (err) {
    console.warn('PDF.js worker setup fallback:', err);
  }
}

export interface ImportGaliciaResult {
  pagesMap: Map<number, PageImage>;
  galiciaSource: GaliciaPdfSource;
  warning?: string;
}

/**
 * Imports a multi-spread PDF (e.g. Canva / PowerPoint export) for PRUEBA GALICIA:
 * 1. Preserves original bytes untouched for high-fidelity vector PDF generation.
 * 2. Renders each full double-page at 150 DPI.
 * 3. Splits exactly down the vertical center (left half & right half).
 * 4. Yields N * 2 logical pages with sourcePdfPage and sourcePdfHalf metadata.
 */
export async function importGaliciaPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ImportGaliciaResult> {
  const arrayBuffer = await file.arrayBuffer();
  const originalBytes = new Uint8Array(arrayBuffer);

  // Use a detached-safe copy for pdf.js to ensure originalBytes remains intact
  const pdfJsData = originalBytes.slice();

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: pdfJsData });
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('password')) {
      throw new Error('El PDF está protegido con contraseña y no puede procesarse.');
    }
    throw new Error(`No se ha podido abrir este PDF: ${message}`);
  }

  const sourcePageCount = pdfDoc.numPages;
  if (sourcePageCount < 1) {
    throw new Error('El PDF no contiene páginas para importar.');
  }

  // Inspect first page to determine baseline dimensions and orientation
  const firstPage = await pdfDoc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  const refWidthPt = firstViewport.width;
  const refHeightPt = firstViewport.height;

  // Check all pages for uniform dimensions and check for mixed orientation
  for (let i = 2; i <= sourcePageCount; i++) {
    const p = await pdfDoc.getPage(i);
    const vp = p.getViewport({ scale: 1.0 });

    const isFirstLandscape = refWidthPt > refHeightPt;
    const isCurrentLandscape = vp.width > vp.height;

    if (isFirstLandscape !== isCurrentLandscape) {
      throw new Error(
        'Este PDF mezcla páginas verticales y horizontales. Usa un PDF con todas las páginas del mismo formato.'
      );
    }

    if (Math.abs(vp.width - refWidthPt) > 3 || Math.abs(vp.height - refHeightPt) > 3) {
      throw new Error('Las páginas de este PDF no tienen el mismo tamaño. Prueba Galicia necesita páginas uniformes.');
    }
  }

  const isLandscape = refWidthPt > refHeightPt;
  const importMode: 'spreads' | 'single-pages' = isLandscape ? 'spreads' : 'single-pages';

  let logicalPageCount = 0;
  if (importMode === 'spreads') {
    logicalPageCount = sourcePageCount * 2;
  } else {
    // Single pages: must be 8, 10, 12, 16 (or at least valid page count)
    logicalPageCount = sourcePageCount;
    const supportedCounts = [8, 10, 12, 16];
    if (!supportedCounts.includes(logicalPageCount)) {
      throw new Error(
        `Este PDF contiene ${sourcePageCount} páginas individuales verticales. Para cuadernillo individual se admiten 8, 10, 12 o 16 páginas.`
      );
    }
  }

  const warningsList: string[] = [];

  const requiredPhysicalPages = Math.ceil(logicalPageCount / 4) * 4;
  const requiredSheets = requiredPhysicalPages / 4;
  const blankPagesCount = requiredPhysicalPages - logicalPageCount;
  if (blankPagesCount > 0) {
    warningsList.push(
      `Este PDF contiene ${logicalPageCount} páginas de fanzine. Para imprimir como cuadernillo en hojas A4 se requieren ${requiredSheets} hojas (${requiredPhysicalPages} páginas físicas), por lo que ${blankPagesCount} página${blankPagesCount > 1 ? 's quedan disponibles' : ' queda disponible'} para notas o cortesía.`
    );
  }

  const aspect = refWidthPt / refHeightPt;
  const isA4Like = isLandscape ? (aspect >= 1.35 && aspect <= 1.5) : (aspect >= 0.65 && aspect <= 0.75);

  if (isLandscape && !isA4Like) {
    warningsList.push(
      'Este PDF no tiene proporción A4. Se ajustará al formato de impresión sin deformarlo.'
    );
  }

  const warning = warningsList.length > 0 ? warningsList.join(' · ') : undefined;

  const pagesMap = new Map<number, PageImage>();
  const previewScale = 150 / 72; // ~2.08x scale for crisp 150 DPI preview

  // Process sequentially to conserve memory
  for (let sourceIndex = 1; sourceIndex <= sourcePageCount; sourceIndex++) {
    onProgress?.(sourceIndex, sourcePageCount);

    const page = await pdfDoc.getPage(sourceIndex);
    const viewport = page.getViewport({ scale: previewScale });

    // 1. Render FULL page into canvas
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = Math.round(viewport.width);
    fullCanvas.height = Math.round(viewport.height);
    const fullCtx = fullCanvas.getContext('2d', { alpha: false });

    if (!fullCtx) {
      throw new Error('No se pudo inicializar el contexto 2D para renderizar la página del PDF.');
    }

    await page.render({
      canvasContext: fullCtx,
      viewport,
      canvas: fullCanvas,
    } as any).promise;

    const fullWidth = fullCanvas.width;
    const fullHeight = fullCanvas.height;

    if (importMode === 'spreads') {
      // Exact mathematical cut down vertical center
      const splitX = Math.floor(fullWidth / 2);
      const leftWidth = splitX;
      const rightWidth = fullWidth - splitX;

      // LEFT half canvas
      const leftCanvas = document.createElement('canvas');
      leftCanvas.width = leftWidth;
      leftCanvas.height = fullHeight;
      const leftCtx = leftCanvas.getContext('2d');
      if (leftCtx) {
        leftCtx.drawImage(
          fullCanvas,
          0, 0, leftWidth, fullHeight,
          0, 0, leftWidth, fullHeight
        );
      }
      const leftDataUrl = leftCanvas.toDataURL('image/jpeg', 0.92);

      // RIGHT half canvas
      const rightCanvas = document.createElement('canvas');
      rightCanvas.width = rightWidth;
      rightCanvas.height = fullHeight;
      const rightCtx = rightCanvas.getContext('2d');
      if (rightCtx) {
        rightCtx.drawImage(
          fullCanvas,
          splitX, 0, rightWidth, fullHeight,
          0, 0, rightWidth, fullHeight
        );
      }
      const rightDataUrl = rightCanvas.toDataURL('image/jpeg', 0.92);

      // Free canvases memory
      leftCanvas.width = 0;
      leftCanvas.height = 0;
      rightCanvas.width = 0;
      rightCanvas.height = 0;

      const logicalLeftNum = (sourceIndex - 1) * 2 + 1;
      const logicalRightNum = (sourceIndex - 1) * 2 + 2;

      const leftPageImage: PageImage = {
        id: `galicia-p${logicalLeftNum}-${Date.now()}`,
        pageNumber: logicalLeftNum,
        dataUrl: leftDataUrl,
        name: `Pág ${logicalLeftNum} (Doble ${sourceIndex} · Izq)`,
        width: leftWidth,
        height: fullHeight,
        originalWidth: leftWidth,
        originalHeight: fullHeight,
        sourceType: 'galicia-pdf',
        sourcePdfPage: sourceIndex,
        sourcePdfHalf: 'left',
        sourcePdfRegion: 'left',
        fitMode: 'contain',
        zoom: 1,
        panX: 0,
        panY: 0,
      };

      const rightPageImage: PageImage = {
        id: `galicia-p${logicalRightNum}-${Date.now()}`,
        pageNumber: logicalRightNum,
        dataUrl: rightDataUrl,
        name: `Pág ${logicalRightNum} (Doble ${sourceIndex} · Der)`,
        width: rightWidth,
        height: fullHeight,
        originalWidth: rightWidth,
        originalHeight: fullHeight,
        sourceType: 'galicia-pdf',
        sourcePdfPage: sourceIndex,
        sourcePdfHalf: 'right',
        sourcePdfRegion: 'right',
        fitMode: 'contain',
        zoom: 1,
        panX: 0,
        panY: 0,
      };

      pagesMap.set(logicalLeftNum, leftPageImage);
      pagesMap.set(logicalRightNum, rightPageImage);
    } else {
      // importMode === 'single-pages' (vertical pages)
      const pageDataUrl = fullCanvas.toDataURL('image/jpeg', 0.92);
      const logicalNum = sourceIndex;

      const singlePageImage: PageImage = {
        id: `galicia-p${logicalNum}-${Date.now()}`,
        pageNumber: logicalNum,
        dataUrl: pageDataUrl,
        name: `Página PDF ${logicalNum}`,
        width: fullWidth,
        height: fullHeight,
        originalWidth: fullWidth,
        originalHeight: fullHeight,
        sourceType: 'galicia-pdf',
        sourcePdfPage: sourceIndex,
        sourcePdfHalf: 'full',
        sourcePdfRegion: 'full',
        fitMode: 'contain',
        zoom: 1,
        panX: 0,
        panY: 0,
      };

      pagesMap.set(logicalNum, singlePageImage);
    }

    fullCanvas.width = 0;
    fullCanvas.height = 0;
  }

  const galiciaSource: GaliciaPdfSource = {
    name: file.name,
    bytes: originalBytes,
    sourcePageCount,
    logicalPageCount,
    widthPt: refWidthPt,
    heightPt: refHeightPt,
    importMode,
    isA4Like,
    sourceAspectRatio: aspect,
  };

  return {
    pagesMap,
    galiciaSource,
    warning,
  };
}
