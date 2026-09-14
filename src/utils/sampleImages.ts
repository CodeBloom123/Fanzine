import { PageImage } from '../types';

const SAMPLE_TITLES = [
  'PORTADA: FANZINE N°1',
  'Editorial & Manifiesto',
  'Ilustración: La Ciudad',
  'Poesía / Texto Urbano',
  'Cómic: Parte I',
  'Galería Central - Izq',
  'Galería Central - Der',
  'Cómic: Parte II',
  'Entrevista / Reseña',
  'Fotografía Análoga',
  'Sección Arte & Collage',
  'Fichas & Poemas',
  'Bocetos Nocturnos',
  'Pensamiento Crítico',
  'Agradecimientos & Créditos',
  'CONTRAPORTADA: Fin',
];

const SAMPLE_COLORS = [
  ['#4f46e5', '#818cf8'], // P1 Cover
  ['#0284c7', '#38bdf8'], // P2
  ['#059669', '#34d399'], // P3
  ['#d97706', '#fbbf24'], // P4
  ['#dc2626', '#f87171'], // P5
  ['#7c3aed', '#c084fc'], // P6
  ['#c084fc', '#7c3aed'], // P7
  ['#db2777', '#f472b6'], // P8
  ['#0891b2', '#22d3ee'], // P9
  ['#65a30d', '#a3e635'], // P10
  ['#ea580c', '#fb923c'], // P11
  ['#9333ea', '#c084fc'], // P12
  ['#2563eb', '#60a5fa'], // P13
  ['#0d9488', '#2dd4bf'], // P14
  ['#e11d48', '#fb7185'], // P15
  ['#1e293b', '#475569'], // P16 Back Cover
];

export async function generateSampleFanzinePages(targetPageCount: number = 12): Promise<PageImage[]> {
  const pages: PageImage[] = [];

  const centerL = Math.floor(targetPageCount / 2);
  const centerR = centerL + 1;

  for (let i = 1; i <= targetPageCount; i++) {
    const canvas = document.createElement('canvas');
    // A5 aspect ratio canvas (1240 x 1754 px ~ 300 DPI)
    canvas.width = 874;
    canvas.height = 1240;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const colorIndex = (i - 1) % SAMPLE_COLORS.length;
      const [col1, col2] = i === targetPageCount ? SAMPLE_COLORS[15] : SAMPLE_COLORS[colorIndex];

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, col1);
      grad.addColorStop(1, col2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.fillRect(x, 0, 20, canvas.height);
      }

      // Border box
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Large Page Number
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = 'bold 220px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i}`, canvas.width / 2, canvas.height / 2 - 40);

      // Page Title Header
      const titleText = i === 1 ? 'PORTADA: FANZINE' : i === targetPageCount ? 'CONTRAPORTADA: FIN' : SAMPLE_TITLES[(i - 1) % SAMPLE_TITLES.length];
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(titleText, canvas.width / 2, 120);

      // Illustration placeholder graphics
      if (i === 1) {
        // Cover badge
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 100, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${targetPageCount} PÁGINAS`, canvas.width / 2, canvas.height / 2 + 100);
      } else if (i === centerL || i === centerR) {
        // Center spread banner indicator
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(40, canvas.height / 2 + 140, canvas.width - 80, 60);
        ctx.fillStyle = '#4c1d95';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('⚡ CENTRO DEL FANZINE (PLIEGUE)', canvas.width / 2, canvas.height / 2 + 175);
      } else {
        // Geometric artsy shapes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(canvas.width / 2 - 180, canvas.height / 2 + 40, 360, 220, 20);
        } else {
          ctx.rect(canvas.width / 2 - 180, canvas.height / 2 + 40, 360, 220);
        }
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.font = '20px monospace';
        ctx.fillText(`Contenido de Pág ${i}`, canvas.width / 2, canvas.height / 2 + 130);
        ctx.fillText('148.5 x 210 mm (A5)', canvas.width / 2, canvas.height / 2 + 165);
      }

      // Page footer indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`PÁGINA ${i} DE ${targetPageCount}`, canvas.width / 2, canvas.height - 80);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      pages.push({
        id: `sample-${i}`,
        pageNumber: i,
        dataUrl,
        name: `Pagina_${i}.jpg`,
        width: canvas.width,
        height: canvas.height,
      });
    }
  }

  return pages;
}

