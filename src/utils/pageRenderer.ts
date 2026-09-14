import { BackgroundStrategy, FitMode, ImpositionConfig, PageImage } from '../types';

export interface DrawBounds {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

/**
 * Image analysis helper for dimensions, ratios, and smart layout suggestions.
 */
export function analyzeImageDimensions(w: number, h: number) {
  const ratio = w > 0 && h > 0 ? w / h : 1;
  const isLandscape = ratio > 1.15;
  const isSquare = ratio >= 0.88 && ratio <= 1.15;
  const isPortrait = ratio < 0.88;
  const isPhonePortrait = ratio <= 0.62; // e.g. 9:16 = 0.5625

  let recommendedFit: FitMode = 'cover';
  let recommendedBg: BackgroundStrategy = 'solid';

  if (isLandscape) {
    recommendedFit = 'contain';
    recommendedBg = 'blur';
  } else if (isPhonePortrait) {
    recommendedFit = 'cover';
    recommendedBg = 'blur';
  } else {
    recommendedFit = 'cover';
    recommendedBg = 'solid';
  }

  return {
    ratio,
    isLandscape,
    isSquare,
    isPortrait,
    isPhonePortrait,
    suggestedRotation: isLandscape ? 90 : 0,
    recommendedFit,
    recommendedBg,
  };
}

// Global Image element cache for performance
const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Calculates effective fit mode when 'smart' is selected.
 */
export function resolveEffectiveFit(
  rawFit: FitMode | undefined,
  imgW: number,
  imgH: number,
  rotation: number = 0
): { fit: 'cover' | 'contain' | 'stretch'; autoBg: BackgroundStrategy } {
  const normRotation = ((rotation % 360) + 360) % 360;
  const isSideways = normRotation === 90 || normRotation === 270;
  const effectiveW = isSideways ? imgH : imgW;
  const effectiveH = isSideways ? imgW : imgH;
  const aspect = effectiveW / effectiveH;

  if (rawFit === 'smart') {
    // Target page aspect is ~0.707 (A5 portrait: 148.5 / 210)
    // If image aspect is wider than 1.0 (landscape), contain with blur background is best
    if (aspect > 1.05) {
      return { fit: 'contain', autoBg: 'blur' };
    }
    // If vertical (near 0.707) or phone portrait, cover works smoothly
    return { fit: 'cover', autoBg: 'blur' };
  }

  return {
    fit: rawFit === 'contain' || rawFit === 'stretch' ? rawFit : 'cover',
    autoBg: 'solid',
  };
}

/**
 * Centralized math used by both screen preview and PDF export.
 */
export function calculatePageDrawBounds(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
  fitMode: FitMode,
  panX: number = 0,
  panY: number = 0,
  zoom: number = 1,
  rotation: number = 0
): DrawBounds {
  const safeZoom = Math.max(1, zoom || 1);
  const normRotation = ((rotation % 360) + 360) % 360;
  const isSideways = normRotation === 90 || normRotation === 270;
  const effectiveImgW = isSideways ? imgH : imgW;
  const effectiveImgH = isSideways ? imgW : imgH;

  const { fit } = resolveEffectiveFit(fitMode, imgW, imgH, rotation);

  let drawW = containerW;
  let drawH = containerH;

  if (fit === 'contain') {
    const baseScale = Math.min(containerW / effectiveImgW, containerH / effectiveImgH);
    const scale = baseScale * safeZoom;
    drawW = (isSideways ? imgH : imgW) * scale;
    drawH = (isSideways ? imgW : imgH) * scale;
  } else if (fit === 'cover') {
    const baseScale = Math.max(containerW / effectiveImgW, containerH / effectiveImgH);
    const scale = baseScale * safeZoom;
    drawW = (isSideways ? imgH : imgW) * scale;
    drawH = (isSideways ? imgW : imgH) * scale;
  } else {
    // stretch
    drawW = containerW * safeZoom;
    drawH = containerH * safeZoom;
  }

  // Center position + pan offset (panX & panY are percentages of container size)
  const drawX = (containerW - drawW) / 2 + (panX / 100) * containerW;
  const drawY = (containerH - drawH) / 2 + (panY / 100) * containerH;

  return {
    drawX,
    drawY,
    drawW,
    drawH,
    leftPercent: (drawX / containerW) * 100,
    topPercent: (drawY / containerH) * 100,
    widthPercent: (drawW / containerW) * 100,
    heightPercent: (drawH / containerH) * 100,
  };
}

/**
 * Draws a single fanzine page onto an HTMLCanvasElement with 100% WYSIWYG fidelity.
 * Unifies:
 * - fitMode: cover | contain | stretch | smart
 * - panX & panY (drag to frame)
 * - zoom (1x to 3x)
 * - rotation (0, 90, 180, 270 deg)
 * - flipX & flipY
 * - background strategy: solid | blur | mirror
 * - independent text overlay
 * - discrete page numbers
 * - panel rotation (e.g. 180 deg for mini fanzine top row)
 */
export async function drawPageOnCanvas(
  ctx: CanvasRenderingContext2D,
  page: PageImage | undefined,
  targetWidthPx: number,
  targetHeightPx: number,
  config: ImpositionConfig,
  actualPageNumber: number,
  options?: {
    isLeftPage?: boolean;
    skipPageNumber?: boolean;
    rotationDeg?: number; // Outer sheet rotation (e.g. 180 for mini zine top row)
  }
): Promise<void> {
  const outerRotation = options?.rotationDeg || 0;

  if (outerRotation !== 0) {
    ctx.save();
    ctx.translate(targetWidthPx / 2, targetHeightPx / 2);
    ctx.rotate((outerRotation * Math.PI) / 180);
    ctx.translate(-targetWidthPx / 2, -targetHeightPx / 2);
  }

  // 1. Base solid background
  const baseBgColor = page?.backgroundColor || config.backgroundColor || '#ffffff';
  ctx.fillStyle = baseBgColor;
  ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);

  if (page && page.dataUrl) {
    try {
      const img = await loadImage(page.dataUrl);
      const imgW = img.naturalWidth || img.width || 800;
      const imgH = img.naturalHeight || img.height || 1130;

      const rawFit: FitMode = page.fitMode || config.fitMode || 'cover';
      const imgRotation = ((page.rotation || 0) % 360 + 360) % 360;
      const flipX = !!page.flipX;
      const flipY = !!page.flipY;
      const panX = page.panX ?? 0;
      const panY = page.panY ?? 0;
      const zoom = Math.max(1, page.zoom ?? 1);

      const { fit: effectiveFit, autoBg } = resolveEffectiveFit(rawFit, imgW, imgH, imgRotation);
      const bgStrategy: BackgroundStrategy = page.backgroundStrategy || (rawFit === 'smart' ? autoBg : 'solid');

      // 2. Draw Background Strategy if needed (e.g. blurred image or mirrored edges when in contain or panned)
      const needsBackground = effectiveFit === 'contain' || zoom > 1 || Math.abs(panX) > 5 || Math.abs(panY) > 5;

      if (needsBackground && bgStrategy === 'blur') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, targetWidthPx, targetHeightPx);
        ctx.clip();

        // Cover scale for blur background
        const bgScale = Math.max(targetWidthPx / imgW, targetHeightPx / imgH) * 1.25;
        const bgW = imgW * bgScale;
        const bgH = imgH * bgScale;
        const bgX = (targetWidthPx - bgW) / 2;
        const bgY = (targetHeightPx - bgH) / 2;

        try {
          ctx.filter = 'blur(28px) brightness(0.65)';
        } catch {
          // fallback if filter not supported
          ctx.globalAlpha = 0.5;
        }

        ctx.drawImage(img, bgX, bgY, bgW, bgH);

        // Reset filter
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
        ctx.restore();
      } else if (needsBackground && bgStrategy === 'mirror') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, targetWidthPx, targetHeightPx);
        ctx.clip();

        // Draw slightly enlarged flipped ghost image to mirror edges
        const mirrorScale = Math.max(targetWidthPx / imgW, targetHeightPx / imgH);
        const mW = imgW * mirrorScale;
        const mH = imgH * mirrorScale;
        ctx.globalAlpha = 0.35;
        ctx.drawImage(img, (targetWidthPx - mW) / 2, (targetHeightPx - mH) / 2, mW, mH);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }

      // 3. Draw Main Transformed Image
      const isSideways = imgRotation === 90 || imgRotation === 270;
      const orientedImgW = isSideways ? imgH : imgW;
      const orientedImgH = isSideways ? imgW : imgH;

      let drawW = targetWidthPx;
      let drawH = targetHeightPx;

      if (effectiveFit === 'contain') {
        const baseScale = Math.min(targetWidthPx / orientedImgW, targetHeightPx / orientedImgH);
        const scale = baseScale * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
      } else if (effectiveFit === 'cover') {
        const baseScale = Math.max(targetWidthPx / orientedImgW, targetHeightPx / orientedImgH);
        const scale = baseScale * zoom;
        drawW = imgW * scale;
        drawH = imgH * scale;
      } else {
        // stretch
        drawW = (isSideways ? targetHeightPx : targetWidthPx) * zoom;
        drawH = (isSideways ? targetWidthPx : targetHeightPx) * zoom;
      }

      ctx.save();
      // Clip to page boundary
      ctx.beginPath();
      ctx.rect(0, 0, targetWidthPx, targetHeightPx);
      ctx.clip();

      // Center point with pan offset
      const cx = targetWidthPx / 2 + (panX / 100) * targetWidthPx;
      const cy = targetHeightPx / 2 + (panY / 100) * targetHeightPx;

      ctx.translate(cx, cy);

      // Individual Image Rotation
      if (imgRotation !== 0) {
        ctx.rotate((imgRotation * Math.PI) / 180);
      }

      // Flips (Horizontal and/or Vertical)
      const scaleX = flipX ? -1 : 1;
      const scaleY = flipY ? -1 : 1;
      if (scaleX !== 1 || scaleY !== 1) {
        ctx.scale(scaleX, scaleY);
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } catch (e) {
      console.error(`Error rendering page ${actualPageNumber}:`, e);
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
      ctx.fillStyle = '#b91c1c';
      ctx.font = `bold ${Math.round(targetHeightPx * 0.04)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Error Pág ${actualPageNumber}`, targetWidthPx / 2, targetHeightPx / 2);
    }
  } else {
    // Blank page aesthetic placeholder
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(2, Math.round(targetWidthPx * 0.006));
    ctx.strokeRect(16, 16, targetWidthPx - 32, targetHeightPx - 32);

    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${Math.round(targetHeightPx * 0.045)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`PÁGINA ${actualPageNumber}`, targetWidthPx / 2, targetHeightPx / 2 - 12);
    ctx.font = `${Math.round(targetHeightPx * 0.026)}px sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('(Página disponible)', targetWidthPx / 2, targetHeightPx / 2 + 20);
  }

  // 4. Draw Independent Text Overlay if enabled
  if (page?.textOverlay && page.textOverlay.enabled && page.textOverlay.text.trim().length > 0) {
    const overlay = page.textOverlay;
    const textX = (overlay.x / 100) * targetWidthPx;
    const textY = (overlay.y / 100) * targetHeightPx;

    const baseFontSize = overlay.fontSize || 18;
    // Scale font relative to baseline 500px page height
    const scaledFontSize = Math.max(10, Math.round(baseFontSize * (targetHeightPx / 500)));

    ctx.save();
    ctx.font = `bold ${scaledFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(overlay.text);
    const padX = scaledFontSize * 0.55;
    const padY = scaledFontSize * 0.32;
    const boxW = textMetrics.width + padX * 2;
    const boxH = scaledFontSize * 1.35 + padY * 2;

    const bgColor = overlay.backgroundColor || 'rgba(0, 0, 0, 0.75)';
    if (bgColor !== 'transparent' && bgColor !== '') {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      const radius = Math.min(8, boxH / 2);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(textX - boxW / 2, textY - boxH / 2, boxW, boxH, radius);
      } else {
        ctx.rect(textX - boxW / 2, textY - boxH / 2, boxW, boxH);
      }
      ctx.fill();
    }

    ctx.fillStyle = overlay.color || '#ffffff';
    ctx.fillText(overlay.text, textX, textY);
    ctx.restore();
  }

  // 5. Draw Discrete Page Number Badge if enabled
  if (config.showPageNumbers && !options?.skipPageNumber) {
    const isLeft = options?.isLeftPage ?? false;
    let posX = targetWidthPx / 2;
    if (config.pageNumberPosition === 'bottom-outer') {
      posX = isLeft ? 45 : targetWidthPx - 45;
    } else if (config.pageNumberPosition === 'bottom-inner') {
      posX = isLeft ? targetWidthPx - 45 : 45;
    }
    const posY = targetHeightPx - 26;

    const textStr = `- ${actualPageNumber} -`;
    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(posX - 34, posY - 14, 68, 28, 6);
    } else {
      ctx.rect(posX - 34, posY - 14, 68, 28);
    }
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillText(textStr, posX, posY);
    ctx.restore();
  }

  if (outerRotation !== 0) {
    ctx.restore();
  }
}
