import { PDFDocument, rgb } from 'pdf-lib';
import { getImpositionPlan, ImpositionConfig, PageImage } from '../types';

// Convert mm to PDF Points (1 inch = 25.4 mm, 1 point = 1/72 inch)
const mmToPt = (mm: number) => (mm * 72) / 25.4;

// Standard A4 Landscape Dimensions
const A4_WIDTH_PT = mmToPt(297); // 841.89 pt
const A4_HEIGHT_PT = mmToPt(210); // 595.28 pt
const A5_WIDTH_PT = A4_WIDTH_PT / 2; // 420.94 pt (148.5 mm)

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
 * Renders an A5 page image onto a high-DPI canvas applying fit mode, background, and optional page number badge.
 */
async function renderPageToCanvas(
  page: PageImage | undefined,
  targetWidthPx: number,
  targetHeightPx: number,
  config: ImpositionConfig,
  isLeftPage: boolean,
  actualPageNumber: number
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = config.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

  if (page && page.dataUrl) {
    try {
      const img = await loadImage(page.dataUrl);
      const imgW = img.width;
      const imgH = img.height;

      let drawX = 0;
      let drawY = 0;
      let drawW = targetWidthPx;
      let drawH = targetHeightPx;

      if (config.fitMode === 'contain') {
        const scale = Math.min(targetWidthPx / imgW, targetHeightPx / imgH);
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = (targetWidthPx - drawW) / 2;
        drawY = (targetHeightPx - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } else if (config.fitMode === 'cover') {
        const scale = Math.max(targetWidthPx / imgW, targetHeightPx / imgH);
        drawW = imgW * scale;
        drawH = imgH * scale;
        drawX = (targetWidthPx - drawW) / 2;
        drawY = (targetHeightPx - drawH) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, targetWidthPx, targetHeightPx);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        // Stretch
        ctx.drawImage(img, 0, 0, targetWidthPx, targetHeightPx);
      }
    } catch (e) {
      console.error(`Error rendering page ${actualPageNumber}:`, e);
      // Fallback empty box
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Error Carga Pág ${actualPageNumber}`, targetWidthPx / 2, targetHeightPx / 2);
    }
  } else {
    // Blank page placeholder
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, targetWidthPx - 40, targetHeightPx - 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`PÁGINA ${actualPageNumber}`, targetWidthPx / 2, targetHeightPx / 2);
    ctx.font = '18px sans-serif';
    ctx.fillText('(Página en Blanco)', targetWidthPx / 2, targetHeightPx / 2 + 40);
  }

  // Draw Page Number Badge if enabled
  if (config.showPageNumbers) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';

    let posX = targetWidthPx / 2;
    if (config.pageNumberPosition === 'bottom-outer') {
      posX = isLeftPage ? 50 : targetWidthPx - 50;
    } else if (config.pageNumberPosition === 'bottom-inner') {
      posX = isLeftPage ? targetWidthPx - 50 : 50;
    }

    const posY = targetHeightPx - 30;

    // Small background pill for badge legibility
    const textStr = `- ${actualPageNumber} -`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(posX - 35, posY - 22, 70, 30, 8);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillText(textStr, posX, posY);
  }

  // Convert canvas to JPEG blob bytes
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
 * Generates the complete 12-page fanzine saddle-stitched A4 PDF document.
 */
export async function generateFanzinePDF(
  pagesMap: Map<number, PageImage>,
  config: ImpositionConfig
): Promise<Uint8Array> {
  const pageCount = config.pageCount || 12;
  const impositionPlan = getImpositionPlan(pageCount);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Fanzine ${pageCount} Páginas - Imposición Cuadernillo A4`);
  pdfDoc.setAuthor('Generador de Fanzines - Ternura Radikal');
  pdfDoc.setSubject(`Imposición saddle-stitch ${pageCount} páginas en hojas A4 doble cara`);

  // Resolution setup: 300 DPI for high quality or 150 DPI for compact size
  const dpi = config.dpi || 300;
  const a5WidthPx = Math.round((148.5 / 25.4) * dpi); // e.g. 1754 px at 300 dpi
  const a5HeightPx = Math.round((210 / 25.4) * dpi); // e.g. 2480 px at 300 dpi

  const gutterPt = mmToPt(config.gutterMm || 0);

  for (const spread of impositionPlan) {
    // Add A4 Landscape page
    const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

    const leftPageData = pagesMap.get(spread.leftPageNum);
    const rightPageData = pagesMap.get(spread.rightPageNum);

    // Render left & right images to JPEG buffers
    const leftBytes = await renderPageToCanvas(
      leftPageData,
      a5WidthPx,
      a5HeightPx,
      config,
      true,
      spread.leftPageNum
    );
    const rightBytes = await renderPageToCanvas(
      rightPageData,
      a5WidthPx,
      a5HeightPx,
      config,
      false,
      spread.rightPageNum
    );

    const leftEmbed = await pdfDoc.embedJpg(leftBytes);
    const rightEmbed = await pdfDoc.embedJpg(rightBytes);

    // Calculate dimensions with Gutter Compensation (compensación de lomo)
    // Left Page: occupies X=0 to (A5_WIDTH - gutter), pushed away from spine line (X = A5_WIDTH_PT)
    const leftW = A5_WIDTH_PT - gutterPt;
    const leftX = 0; // Shift left page towards outer edge, leaving gutterPt gap at the spine
    const leftY = 0;
    const leftH = A4_HEIGHT_PT;

    // Right Page: occupies X=(A5_WIDTH + gutterPt) to A4_WIDTH, pushed away from spine line
    const rightW = A5_WIDTH_PT - gutterPt;
    const rightX = A5_WIDTH_PT + gutterPt;
    const rightY = 0;
    const rightH = A4_HEIGHT_PT;

    // Draw Left Page Image
    page.drawImage(leftEmbed, {
      x: leftX,
      y: leftY,
      width: leftW,
      height: leftH,
    });

    // Draw Right Page Image
    page.drawImage(rightEmbed, {
      x: rightX,
      y: rightY,
      width: rightW,
      height: rightH,
    });

    // Draw Spine Fold Guide Line if enabled
    if (config.showFoldLines) {
      // Dashed line along exact center
      page.drawLine({
        start: { x: A5_WIDTH_PT, y: 0 },
        end: { x: A5_WIDTH_PT, y: A4_HEIGHT_PT },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
        dashArray: [4, 4],
      });

      // Gutter zone indicator shading if gutter > 0
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

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
