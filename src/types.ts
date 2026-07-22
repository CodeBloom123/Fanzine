export interface PageImage {
  id: string;
  pageNumber: number;
  dataUrl: string; // base64 image or object URL
  name: string;
  width?: number;
  height?: number;
}

export type FitMode = 'cover' | 'contain' | 'stretch';

export interface ImpositionConfig {
  pageCount: number; // 8, 10, 12, 16
  gutterMm: number; // Compensación de lomo / margen central en mm (0 - 15mm)
  fitMode: FitMode;
  showFoldLines: boolean; // Mostrar línea central de doblado
  showPageNumbers: boolean; // Mostrar numeración discreta en pie de página
  pageNumberPosition: 'bottom-center' | 'bottom-outer' | 'bottom-inner';
  backgroundColor: string; // Color de fondo si no cubre toda la página (#ffffff, #000000, etc)
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

