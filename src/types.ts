export type FanzineFormat = 'saddle-stitch' | 'mini-zine-8' | 'galicia-pdf';

export type FitMode = 'cover' | 'contain' | 'stretch' | 'smart';

export type BackgroundStrategy = 'solid' | 'blur' | 'mirror';

export interface GaliciaPdfSource {
  name: string;
  bytes: Uint8Array;
  sourcePageCount: number;
  logicalPageCount: number;
  widthPt: number;
  heightPt: number;
  importMode: 'spreads' | 'single-pages';
  isA4Like: boolean;
  sourceAspectRatio: number;
}

export interface GaliciaPrintOptions {
  gutterMm: number;
  useCustomSpineColor: boolean;
  spineColor: string;
  spineApplyScope: 'all-pages' | 'cover-only';
  spineWidthMm: number;
  backgroundColor: string;
}

export interface PageTextOverlay {
  enabled: boolean;
  text: string;
  x: number; // Porcentaje 0 a 100 horizontal (50 = centrado)
  y: number; // Porcentaje 0 a 100 vertical (80 = inferior)
  fontSize: number; // Tamaño relativo (12 a 36)
  color: string; // Color hexadecimal o rgba (ej. '#ffffff')
  backgroundColor?: string; // Fondo de la pastilla de texto (ej. 'rgba(0,0,0,0.65)' o 'transparent')
}

export interface PageImage {
  id: string;
  pageNumber: number;
  dataUrl: string; // base64 image or object URL
  name: string;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
  aspectRatio?: number;
  suggestedRotation?: number; // 0 o 90
  fitMode?: FitMode; // Individual fit mode ('cover' | 'contain' | 'stretch' | 'smart')
  panX?: number; // Desplazamiento horizontal en % (-100 a 100)
  panY?: number; // Desplazamiento vertical en % (-100 a 100)
  zoom?: number; // Nivel de zoom (1 a 3)
  rotation?: number; // Rotación de la imagen en grados: 0, 90, 180, 270
  flipX?: boolean; // Volteo horizontal (espejo)
  flipY?: boolean; // Volteo vertical
  backgroundStrategy?: BackgroundStrategy; // 'solid' | 'blur' | 'mirror'
  backgroundColor?: string; // Color de fondo personalizado si no llena la página
  textOverlay?: PageTextOverlay;
  sourceType?: 'image' | 'galicia-pdf';
  sourcePdfPage?: number; // 1-based index in source PDF (1..6)
  sourcePdfHalf?: 'left' | 'right' | 'full';
  sourcePdfRegion?: 'left' | 'right' | 'full';
}

export interface ImpositionConfig {
  fanzineFormat: FanzineFormat; // 'saddle-stitch' | 'mini-zine-8'
  pageCount: number; // 8, 10, 12, 16 para saddle-stitch; 8 fijo para mini-zine-8
  gutterMm: number; // Compensación de lomo / margen central en mm (0 - 15mm)
  fitMode: FitMode; // Fit mode global por defecto
  showFoldLines: boolean; // Mostrar líneas de doblado
  showCutLines?: boolean; // Mostrar línea de corte central en mini fanzine
  showPageNumbers: boolean; // Mostrar numeración discreta en pie de página
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'bottom-inner';
  backgroundColor: string; // Color de fondo si no cubre toda la página (#ffffff, #000000, etc)
  useCustomSpineColor?: boolean; // Activar color personalizado para la franja del lomo / centro
  spineColor?: string; // Hex color para el lomo (#000000, #f43f5e, etc)
  spineApplyScope?: 'all-pages' | 'cover-only'; // Aplicar en todas las hojas o solo portada/contraportada
  spineWidthMm?: number; // Ancho personalizado de la franja del lomo en mm
  dpi: number; // 150, 300
}

export interface ImpositionSpread {
  sheetNumber: number;
  side: 'front' | 'back';
  sideName: string;
  leftPageNum: number;
  rightPageNum: number;
  pdfPageNum: number;
}

export function getPhysicalPageCount(contentPageCount: number): number {
  return Math.ceil(contentPageCount / 4) * 4;
}

export function getImpositionPlan(contentPageCount: number): ImpositionSpread[] {
  const physicalPages = getPhysicalPageCount(contentPageCount);
  const totalSheets = physicalPages / 4;
  const spreads: ImpositionSpread[] = [];

  let pdfPageCounter = 1;

  for (let s = 1; s <= totalSheets; s++) {
    // Sheet s Front
    const leftFront = physicalPages - 2 * (s - 1);
    const rightFront = 2 * s - 1;

    let frontSideName = `Hoja ${s} - Cara Delantera`;
    if (s === 1) frontSideName = `Hoja 1 (Exterior) - Cara Delantera (Portada ${rightFront} & Contra ${leftFront})`;
    else if (s === totalSheets) frontSideName = `Hoja ${s} (Interior / Centro) - Cara Delantera`;

    spreads.push({
      sheetNumber: s,
      side: 'front',
      sideName: frontSideName,
      leftPageNum: leftFront,
      rightPageNum: rightFront,
      pdfPageNum: pdfPageCounter++,
    });

    // Sheet s Back
    const leftBack = 2 * s;
    const rightBack = physicalPages - 2 * s + 1;

    let backSideName = `Hoja ${s} - Cara Trasera`;
    if (s === 1) backSideName = `Hoja 1 (Exterior) - Cara Trasera`;
    else if (s === totalSheets) backSideName = `Hoja ${s} (Interior / Centro) - Cara Trasera (Pliegue Central)`;

    spreads.push({
      sheetNumber: s,
      side: 'back',
      sideName: backSideName,
      leftPageNum: leftBack,
      rightPageNum: rightBack,
      pdfPageNum: pdfPageCounter++,
    });
  }

  return spreads;
}

// Fallback constant for 12 pages compatibility
export const IMPOSITION_PLAN = getImpositionPlan(12);

