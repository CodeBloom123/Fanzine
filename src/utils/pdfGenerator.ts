import { PDFDocument, rgb } from 'pdf-lib';
import { getImpositionPlan, ImpositionConfig, PageImage } from '../types';
import { drawPageOnCanvas } from './pageRenderer';

// Convert mm to PDF Points (1 inch = 25.4 mm, 1 point = 1/72 inch)
const mmToPt = (mm: number) => (mm * 72) / 25.4;

function hexToRgb(hex: string) {
  try {
    const cleanHex = (hex || '#000000').replace('#', '');
    const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split('').map((c) => c + c).join('') : cleanHex, 16);
    if (isNaN(bigint)) return rgb(0, 0, 0);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return rgb(r, g, b);
  } catch {
    return rgb(0, 0, 0);
  }
}

// Standard A4 Landscape Dimensions in Points (297 x 210 mm)
const A4_WIDTH_PT = mmToPt(297); // ~841.89 pt
const A4_HEIGHT_PT = mmToPt(210); // ~595.28 pt
const A5_WIDTH_PT = A4_WIDTH_PT / 2; // ~420.94 pt (148.5 mm)

/**
 * Loads an image URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Cache for loaded image elements during PDF generation
 */
const loadedImagesCache = new Map<string, HTMLImageElement>();

async function getLoadedImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  if (loadedImagesCache.has(url)) {
    return loadedImagesCache.get(url)!;
  }
  try {
    const img = await loadImage(url);
    loadedImagesCache.set(url, img);
    return img;
  } catch (e) {
    console.error('Failed to load image for PDF:', url, e);
    return null;
  }
}

/**
 * Renders a single page using the unified pageRenderer to ensure 100% WYSIWYG parity.
 */
async function renderPageToCanvasBytes(
  page: PageImage | undefined,
  widthPx: number,
  heightPx: number,
  config: ImpositionConfig,
  actualPageNumber: number,
  isLeftPage: boolean,
  rotationDeg: number = 0
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d')!;

  await drawPageOnCanvas(
    ctx,
    page,
    widthPx,
    heightPx,
    config,
    actualPageNumber,
    {
      isLeftPage,
      rotationDeg,
    }
  );

  return new Promise<Uint8Array>((resolve) => {
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const buffer = await blob.arrayBuffer();
          resolve(new Uint8Array(buffer));
        } else {
          resolve(new Uint8Array());
        }
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Generates the PDF for the 8-page One-Sheet Mini Fanzine (1 A4 sheet, 2x4 grid).
 * Layout:
 * Top row: [5, 4, 3, 2] rotated 180°
 * Bottom row: [6, 7, 8, 1] rotated 0°
 */
async function generateMiniZine8PDF(
  pagesMap: Map<number, PageImage>,
  config: ImpositionConfig
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Mini Fanzine 8 Páginas · 1 Hoja A4');
  pdfDoc.setAuthor('Generador de Fanzines · Ternura Radikal');
  pdfDoc.setSubject('Imposición Mini Zine 1 pliego A4 apaisado con corte central');

  // A4 Landscape: 297mm x 210mm
  const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

  const dpi = config.dpi || 300;
  // Panel dimensions in mm: Width = 297 / 4 = 74.25mm, Height = 210 / 2 = 105mm
  const panelWidthMm = 297 / 4;
  const panelHeightMm = 210 / 2;

  const panelWidthPt = A4_WIDTH_PT / 4; // ~210.47 pt
  const panelHeightPt = A4_HEIGHT_PT / 2; // ~297.64 pt

  const panelWidthPx = Math.round((panelWidthMm / 25.4) * dpi);
  const panelHeightPx = Math.round((panelHeightMm / 25.4) * dpi);

  // Top row: [5, 4, 3, 2] inverted 180°
  const topRowPages = [5, 4, 3, 2];
  // Bottom row: [6, 7, 8, 1] normal 0°
  const bottomRowPages = [6, 7, 8, 1];

  // Render Top Row (Y = panelHeightPt to A4_HEIGHT_PT in PDF coords where Y=0 is bottom)
  for (let col = 0; col < 4; col++) {
    const pageNum = topRowPages[col];
    const pageData = pagesMap.get(pageNum);

    const bytes = await renderPageToCanvasBytes(
      pageData,
      panelWidthPx,
      panelHeightPx,
      config,
      pageNum,
      false,
      180 // 180 degrees inverted
    );

    const embeddedJpg = await pdfDoc.embedJpg(bytes);

    page.drawImage(embeddedJpg, {
      x: col * panelWidthPt,
      y: panelHeightPt,
      width: panelWidthPt,
      height: panelHeightPt,
    });
  }

  // Render Bottom Row (Y = 0 to panelHeightPt)
  for (let col = 0; col < 4; col++) {
    const pageNum = bottomRowPages[col];
    const pageData = pagesMap.get(pageNum);

    const bytes = await renderPageToCanvasBytes(
      pageData,
      panelWidthPx,
      panelHeightPx,
      config,
      pageNum,
      false,
      0 // Normal 0 degrees
    );

    const embeddedJpg = await pdfDoc.embedJpg(bytes);

    page.drawImage(embeddedJpg, {
      x: col * panelWidthPt,
      y: 0,
      width: panelWidthPt,
      height: panelHeightPt,
    });
  }

  // Draw Folding & Cutting Guides if enabled
  if (config.showFoldLines) {
    const foldColor = rgb(0.75, 0.75, 0.75);

    // Vertical fold lines at 25%, 50%, 75%
    for (let i = 1; i <= 3; i++) {
      page.drawLine({
        start: { x: i * panelWidthPt, y: 0 },
        end: { x: i * panelWidthPt, y: A4_HEIGHT_PT },
        thickness: 0.5,
        color: foldColor,
        dashArray: [3, 3],
      });
    }

    // Outer segments of horizontal fold line (0 to 25%, and 75% to 100%)
    page.drawLine({
      start: { x: 0, y: panelHeightPt },
      end: { x: panelWidthPt, y: panelHeightPt },
      thickness: 0.5,
      color: foldColor,
      dashArray: [3, 3],
    });

    page.drawLine({
      start: { x: 3 * panelWidthPt, y: panelHeightPt },
      end: { x: A4_WIDTH_PT, y: panelHeightPt },
      thickness: 0.5,
      color: foldColor,
      dashArray: [3, 3],
    });

    // CENTRAL CUT LINE (Slit) from 25% to 75% along horizontal center
    const cutColor = rgb(0.85, 0.2, 0.3); // Solid red cut line
    page.drawLine({
      start: { x: panelWidthPt, y: panelHeightPt },
      end: { x: 3 * panelWidthPt, y: panelHeightPt },
      thickness: 1.2,
      color: cutColor,
    });

    // Small perpendicular ticks at cut boundaries to make start/end clear
    page.drawLine({
      start: { x: panelWidthPt, y: panelHeightPt - 4 },
      end: { x: panelWidthPt, y: panelHeightPt + 4 },
      thickness: 1,
      color: cutColor,
    });
    page.drawLine({
      start: { x: 3 * panelWidthPt, y: panelHeightPt - 4 },
      end: { x: 3 * panelWidthPt, y: panelHeightPt + 4 },
      thickness: 1,
      color: cutColor,
    });
  }

  return pdfDoc.save();
}

/**
 * Generates the multi-sheet saddle-stitch booklet PDF.
 */
async function generateSaddleStitchPDF(
  pagesMap: Map<number, PageImage>,
  config: ImpositionConfig
): Promise<Uint8Array> {
  const pageCount = config.pageCount || 12;
  const impositionPlan = getImpositionPlan(pageCount);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Fanzine ${pageCount} Páginas · Imposición Cuadernillo A4`);
  pdfDoc.setAuthor('Generador de Fanzines · Ternura Radikal');
  pdfDoc.setSubject(`Imposición saddle-stitch ${pageCount} páginas en hojas A4 doble cara`);

  const dpi = config.dpi || 300;
  const a5WidthPx = Math.round((148.5 / 25.4) * dpi);
  const a5HeightPx = Math.round((210 / 25.4) * dpi);
  const gutterPt = mmToPt(config.gutterMm || 0);

  for (const spread of impositionPlan) {
    const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

    const leftPageData = pagesMap.get(spread.leftPageNum);
    const rightPageData = pagesMap.get(spread.rightPageNum);

    const leftBytes = await renderPageToCanvasBytes(
      leftPageData,
      a5WidthPx,
      a5HeightPx,
      config,
      spread.leftPageNum,
      true,
      0
    );
    const rightBytes = await renderPageToCanvasBytes(
      rightPageData,
      a5WidthPx,
      a5HeightPx,
      config,
      spread.rightPageNum,
      false,
      0
    );

    const leftEmbed = await pdfDoc.embedJpg(leftBytes);
    const rightEmbed = await pdfDoc.embedJpg(rightBytes);

    const leftW = A5_WIDTH_PT - gutterPt;
    const leftX = 0;
    const leftY = 0;
    const leftH = A4_HEIGHT_PT;

    const rightW = A5_WIDTH_PT - gutterPt;
    const rightX = A5_WIDTH_PT + gutterPt;
    const rightY = 0;
    const rightH = A4_HEIGHT_PT;

    page.drawImage(leftEmbed, {
      x: leftX,
      y: leftY,
      width: leftW,
      height: leftH,
    });

    page.drawImage(rightEmbed, {
      x: rightX,
      y: rightY,
      width: rightW,
      height: rightH,
    });

    // Custom Spine Color Strip
    const shouldDrawSpine =
      config.useCustomSpineColor &&
      (config.spineApplyScope !== 'cover-only' || (spread.sheetNumber === 1 && spread.side === 'front'));

    if (shouldDrawSpine) {
      const spineMm = config.spineWidthMm || (config.gutterMm > 0 ? config.gutterMm * 2 : 6);
      const spineWidthPt = mmToPt(spineMm);
      const spineColorRgb = hexToRgb(config.spineColor || '#1e293b');

      page.drawRectangle({
        x: A5_WIDTH_PT - spineWidthPt / 2,
        y: 0,
        width: spineWidthPt,
        height: A4_HEIGHT_PT,
        color: spineColorRgb,
      });
    }

    // Fold guide line
    if (config.showFoldLines) {
      page.drawLine({
        start: { x: A5_WIDTH_PT, y: 0 },
        end: { x: A5_WIDTH_PT, y: A4_HEIGHT_PT },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
        dashArray: [4, 4],
      });

      if (gutterPt > 0) {
        page.drawRectangle({
          x: A5_WIDTH_PT - gutterPt,
          y: 0,
          width: gutterPt * 2,
          height: A4_HEIGHT_PT,
          color: rgb(0.9, 0.9, 0.9),
          opacity: 0.15,
        });
      }
    }
  }

  return pdfDoc.save();
}

// Helper to calculate source bounding region (Points)
interface GaliciaRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getGaliciaSourceRegion(
  mediaBox: { x: number; y: number; width: number; height: number },
  half: 'left' | 'right' | 'full' | undefined
): GaliciaRegion {
  const { x, y, width, height } = mediaBox;
  if (half === 'right') {
    return {
      x: x + width / 2,
      y,
      width: width / 2,
      height,
    };
  } else if (half === 'left') {
    return {
      x,
      y,
      width: width / 2,
      height,
    };
  }
  // 'full' or default
  return {
    x,
    y,
    width,
    height,
  };
}

/**
 * High-fidelity Vector PDF generator for PRUEBA GALICIA:
 * 1. Takes the original uploaded PDF bytes without rasterization or re-compression.
 * 2. Vector embedding with support for:
 *    - source region: left, right, full
 *    - fitMode: contain, cover
 *    - zoom: 1.0x to 3.0x
 *    - panX, panY: -100 to 100
 *    - A4-like source size preservation vs standard A4 landscape adaptation
 *    - optional spine overlay (gutterMm & custom color)
 * 3. Exact preservation of golden test when no adjustments are set.
 */
export async function generateGaliciaPDF(
  pagesMap: Map<number, PageImage>,
  config: ImpositionConfig,
  sourcePdfBytes?: Uint8Array
): Promise<Uint8Array> {
  if (!sourcePdfBytes) {
    throw new Error('Primero importa un PDF de dobles páginas para generar el fanzine de Prueba Galicia.');
  }

  const sourcePdf = await PDFDocument.load(sourcePdfBytes);
  const outputPdf = await PDFDocument.create();

  const sourcePages = sourcePdf.getPages();
  const sourcePageCount = sourcePages.length;
  const logicalPageCount = config.pageCount || sourcePageCount * 2;

  // Reference page dimensions
  const refPage = sourcePages[0];
  const refMediaBox = refPage.getMediaBox();
  const refWidth = refMediaBox.width;
  const refHeight = refMediaBox.height;

  const isLandscape = refWidth > refHeight;
  const aspect = refWidth / refHeight;
  const isA4Like = isLandscape ? (aspect >= 1.35 && aspect <= 1.5) : (aspect >= 0.65 && aspect <= 0.75);

  let outputWidth: number;
  let outputHeight: number;

  if (isLandscape && isA4Like) {
    // Exact Golden Path: maintain original source dimensions
    outputWidth = refWidth;
    outputHeight = refHeight;
  } else {
    // Non A4 or single pages: standard A4 landscape output (297 x 210 mm)
    outputWidth = A4_WIDTH_PT;
    outputHeight = A4_HEIGHT_PT;
  }

  const halfWidth = outputWidth / 2;

  // Helper to embed and place a page onto destination half
  const placeVectorPage = async (
    outPage: any,
    pageImage: PageImage | undefined,
    destX: number,
    destY: number,
    destWidth: number,
    destHeight: number
  ) => {
    if (!pageImage || !pageImage.sourcePdfPage) return;
    const srcPageIndex = pageImage.sourcePdfPage - 1;
    if (srcPageIndex < 0 || srcPageIndex >= sourcePageCount) return;

    const srcPage = sourcePages[srcPageIndex];
    const mediaBox = srcPage.getMediaBox();
    const half = pageImage.sourcePdfRegion || pageImage.sourcePdfHalf || 'left';
    const region = getGaliciaSourceRegion(mediaBox, half);

    const fitMode = pageImage.fitMode || 'contain';
    const zoom = Math.min(3, Math.max(1, pageImage.zoom || 1));
    const panX = Math.min(100, Math.max(-100, pageImage.panX ?? 0));
    const panY = Math.min(100, Math.max(-100, pageImage.panY ?? 0));

    // Golden test check: if contain, zoom=1, pan=0
    if (fitMode === 'contain' && zoom === 1 && panX === 0 && panY === 0) {
      // Direct whole region embed
      const embedded = await outputPdf.embedPage(srcPage, {
        left: region.x,
        bottom: region.y,
        right: region.x + region.width,
        top: region.y + region.height,
      });

      const scale = Math.min(destWidth / region.width, destHeight / region.height);
      const drawWidth = region.width * scale;
      const drawHeight = region.height * scale;
      const drawX = destX + (destWidth - drawWidth) / 2;
      const drawY = destY + (destHeight - drawHeight) / 2;

      outPage.drawPage(embedded, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
      return;
    }

    // Cover or adjusted mode
    let cropWidth: number;
    let cropHeight: number;

    const targetRatio = destWidth / destHeight;
    const sourceRatio = region.width / region.height;

    if (fitMode === 'cover' || zoom > 1) {
      let baseCropWidth: number;
      let baseCropHeight: number;

      if (sourceRatio > targetRatio) {
        baseCropHeight = region.height;
        baseCropWidth = region.height * targetRatio;
      } else {
        baseCropWidth = region.width;
        baseCropHeight = region.width / targetRatio;
      }

      cropWidth = baseCropWidth / zoom;
      cropHeight = baseCropHeight / zoom;
    } else {
      // contain with zoom=1 (already handled) or other
      cropWidth = region.width;
      cropHeight = region.height;
    }

    const availableX = Math.max(0, region.width - cropWidth);
    const availableY = Math.max(0, region.height - cropHeight);

    const cropLeft = region.x + ((panX + 100) / 200) * availableX;
    // PDF coordinate system origin is bottom-left
    const cropBottom = region.y + ((100 - panY) / 200) * availableY;

    const embedded = await outputPdf.embedPage(srcPage, {
      left: cropLeft,
      bottom: cropBottom,
      right: cropLeft + cropWidth,
      top: cropBottom + cropHeight,
    });

    const scale = Math.min(destWidth / cropWidth, destHeight / cropHeight);
    const drawWidth = cropWidth * scale;
    const drawHeight = cropHeight * scale;
    const drawX = destX + (destWidth - drawWidth) / 2;
    const drawY = destY + (destHeight - drawHeight) / 2;

    outPage.drawPage(embedded, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  };

  // Saddle-stitch imposition plan for logicalPageCount
  const impositionPlan = getImpositionPlan(logicalPageCount);

  for (let spreadIdx = 0; spreadIdx < impositionPlan.length; spreadIdx++) {
    const spread = impositionPlan[spreadIdx];
    const outPage = outputPdf.addPage([outputWidth, outputHeight]);

    // Optional background fill
    const bgColor = config.backgroundColor || '#ffffff';
    if (bgColor !== '#ffffff') {
      outPage.drawRectangle({
        x: 0,
        y: 0,
        width: outputWidth,
        height: outputHeight,
        color: hexToRgb(bgColor),
      });
    }

    // 1. Place left page
    const leftPageImage = pagesMap.get(spread.leftPageNum);
    await placeVectorPage(outPage, leftPageImage, 0, 0, halfWidth, outputHeight);

    // 2. Place right page
    const rightPageImage = pagesMap.get(spread.rightPageNum);
    await placeVectorPage(outPage, rightPageImage, halfWidth, 0, halfWidth, outputHeight);

    // 3. Optional Spine / Gutter overlay
    const gutterMm = config.gutterMm || 0;
    const useCustomSpine = !!config.useCustomSpineColor;

    if (gutterMm > 0 || useCustomSpine) {
      const isSheet1Front = spread.sheetNumber === 1 && spread.side === 'front';
      const shouldApplySpine =
        config.spineApplyScope !== 'cover-only' || isSheet1Front;

      if (shouldApplySpine) {
        const gutterPt = mmToPt(gutterMm);
        const spineWidthPt = useCustomSpine ? Math.max(gutterPt * 2, mmToPt(config.spineWidthMm || 6)) : gutterPt * 2;

        if (spineWidthPt > 0) {
          const spineColor = useCustomSpine
            ? hexToRgb(config.spineColor || '#1e293b')
            : hexToRgb(config.backgroundColor || '#ffffff');

          const spineX = outputWidth / 2 - spineWidthPt / 2;
          outPage.drawRectangle({
            x: spineX,
            y: 0,
            width: spineWidthPt,
            height: outputHeight,
            color: spineColor,
          });
        }
      }
    }
  }

  return outputPdf.save();
}

/**
 * Main PDF generator dispatcher supporting:
 * 1. Cuadernillo A5 (saddle-stitch)
 * 2. Mini Fanzine (1 A4 / 8 pág)
 * 3. PRUEBA GALICIA (Canva / PDF dobles páginas divididas e impuestas)
 */
export async function generateFanzinePDF(
  pagesMap: Map<number, PageImage>,
  config: ImpositionConfig,
  galiciaSourceBytes?: Uint8Array
): Promise<Uint8Array> {
  // Clear image element cache for clean memory
  loadedImagesCache.clear();

  if (config.fanzineFormat === 'mini-zine-8') {
    return generateMiniZine8PDF(pagesMap, config);
  }

  if (config.fanzineFormat === 'galicia-pdf') {
    return generateGaliciaPDF(pagesMap, config, galiciaSourceBytes);
  }

  return generateSaddleStitchPDF(pagesMap, config);
}
