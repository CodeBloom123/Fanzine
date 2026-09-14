import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImpositionConfig, PageImage } from '../types';
import { drawPageOnCanvas } from '../utils/pageRenderer';
import { Move, AlertCircle } from 'lucide-react';

interface PageViewProps {
  page?: PageImage;
  pageNumber: number;
  config: ImpositionConfig;
  className?: string;
  isLeftPage?: boolean;
  interactive?: boolean; // When true, enables pointer drag-to-pan and text positioning
  rotationDeg?: number; // 0 or 180 (for 8-page mini fanzine top row)
  onUpdateComposition?: (updates: Partial<PageImage>) => void;
  showBadge?: boolean;
  aspectRatioClass?: string; // default aspect-[1/1.414]
}

export const PageView: React.FC<PageViewProps> = ({
  page,
  pageNumber,
  config,
  className = '',
  isLeftPage = false,
  interactive = false,
  rotationDeg = 0,
  onUpdateComposition,
  showBadge = true,
  aspectRatioClass = 'aspect-[1/1.414]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 300, height: 424 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);

  // Drag tracking refs
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPanX: number;
    startPanY: number;
    containerW: number;
    containerH: number;
  }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
    containerW: 100,
    containerH: 141,
  });

  const textDragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    containerW: number;
    containerH: number;
  }>({
    clientX: 0,
    clientY: 0,
    startX: 50,
    startY: 80,
    containerW: 100,
    containerH: 141,
  });

  // Observe container size to scale canvas crisply
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Redraw canvas on state changes using the unified engine
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina support (2x resolution for sharpness)
    const dpr = window.devicePixelRatio || 2;
    const targetW = Math.max(120, dimensions.width);
    const targetH = Math.max(160, dimensions.height);

    canvas.width = targetW * dpr;
    canvas.height = targetH * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    await drawPageOnCanvas(ctx, page, targetW, targetH, config, pageNumber, {
      isLeftPage,
      skipPageNumber: !showBadge,
      rotationDeg,
    });

    ctx.restore();
  }, [dimensions, page, config, pageNumber, isLeftPage, showBadge, rotationDeg]);

  useEffect(() => {
    let active = true;
    renderCanvas().catch((err) => {
      if (active) console.error('Error in PageView renderCanvas:', err);
    });
    return () => {
      active = false;
    };
  }, [renderCanvas]);

  // Image Drag-to-pan handlers
  const handleImagePointerDown = (e: React.PointerEvent) => {
    if (!interactive || !onUpdateComposition || !containerRef.current || !page) return;
    // Don't drag image if user is clicking text
    if ((e.target as HTMLElement).closest('.page-text-overlay')) return;

    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: page.panX ?? 0,
      startPanY: page.panY ?? 0,
      containerW: rect.width || 1,
      containerH: rect.height || 1,
    };

    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleImagePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !onUpdateComposition) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    const deltaPercentX = (deltaX / dragStartRef.current.containerW) * 100;
    const deltaPercentY = (deltaY / dragStartRef.current.containerH) * 100;

    // Invert delta if outer page is rotated 180
    const factor = rotationDeg === 180 ? -1 : 1;

    const nextPanX = Math.round(dragStartRef.current.startPanX + deltaPercentX * factor);
    const nextPanY = Math.round(dragStartRef.current.startPanY + deltaPercentY * factor);

    onUpdateComposition({
      panX: Math.max(-100, Math.min(100, nextPanX)),
      panY: Math.max(-100, Math.min(100, nextPanY)),
    });
  };

  const handleImagePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  // Text overlay drag handlers
  const handleTextPointerDown = (e: React.PointerEvent) => {
    if (!interactive || !onUpdateComposition || !containerRef.current || !page?.textOverlay?.enabled) return;
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    textDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: page.textOverlay.x ?? 50,
      startY: page.textOverlay.y ?? 80,
      containerW: rect.width || 1,
      containerH: rect.height || 1,
    };

    setIsDraggingText(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTextPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingText || !onUpdateComposition || !page?.textOverlay) return;
    e.stopPropagation();

    const deltaX = e.clientX - textDragStartRef.current.clientX;
    const deltaY = e.clientY - textDragStartRef.current.clientY;

    const deltaPercentX = (deltaX / textDragStartRef.current.containerW) * 100;
    const deltaPercentY = (deltaY / textDragStartRef.current.containerH) * 100;

    const factor = rotationDeg === 180 ? -1 : 1;

    const nextX = Math.round(textDragStartRef.current.startX + deltaPercentX * factor);
    const nextY = Math.round(textDragStartRef.current.startY + deltaPercentY * factor);

    onUpdateComposition({
      textOverlay: {
        ...page.textOverlay,
        x: Math.max(5, Math.min(95, nextX)),
        y: Math.max(5, Math.min(95, nextY)),
      },
    });
  };

  const handleTextPointerUp = (e: React.PointerEvent) => {
    if (isDraggingText) {
      setIsDraggingText(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  const effectiveFit = page?.fitMode || config.fitMode || 'cover';
  const zoom = page?.zoom ?? 1;
  const canPan = interactive && !!page && (effectiveFit === 'cover' || effectiveFit === 'smart' || zoom > 1);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectRatioClass} overflow-hidden select-none transition-shadow ${className}`}
      style={{
        backgroundColor: page?.backgroundColor || config.backgroundColor || '#090d16',
      }}
    >
      {/* 100% WYSIWYG Unified Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Interactive gesture overlay when in interactive mode */}
      {interactive && page && (
        <div
          onPointerDown={canPan ? handleImagePointerDown : undefined}
          onPointerMove={canPan ? handleImagePointerMove : undefined}
          onPointerUp={canPan ? handleImagePointerUp : undefined}
          onPointerCancel={canPan ? handleImagePointerUp : undefined}
          className={`absolute inset-0 z-10 ${
            canPan ? (isDragging ? 'cursor-grabbing' : 'cursor-grab hover:ring-2 hover:ring-pink-500/50') : ''
          }`}
          title={canPan ? 'Haz clic y arrastra con ratón o táctil para reencuadrar' : undefined}
        >
          {canPan && (
            <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-pink-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-medium opacity-0 hover:opacity-100 transition flex items-center gap-1 pointer-events-none shadow">
              <Move className="w-2.5 h-2.5" /> Reencuadrar
            </div>
          )}

          {/* Draggable interactive text handle if overlay enabled */}
          {page.textOverlay?.enabled && page.textOverlay.text.trim().length > 0 && (
            <div
              onPointerDown={handleTextPointerDown}
              onPointerMove={handleTextPointerMove}
              onPointerUp={handleTextPointerUp}
              onPointerCancel={handleTextPointerUp}
              className={`page-text-overlay absolute z-20 transform -translate-x-1/2 -translate-y-1/2 select-none cursor-move ${
                isDraggingText ? 'ring-2 ring-pink-400' : 'hover:ring-1 hover:ring-pink-400'
              }`}
              style={{
                left: `${page.textOverlay.x ?? 50}%`,
                top: `${page.textOverlay.y ?? 80}%`,
                width: 'auto',
                height: 'auto',
              }}
              title="Arrastra para mover la posición del texto"
            >
              <div className="px-2 py-0.5 opacity-0 hover:opacity-100 bg-pink-500/20 rounded border border-pink-400 text-[10px] text-pink-200 flex items-center gap-1 font-mono">
                <Move className="w-2.5 h-2.5" /> Mover
              </div>
            </div>
          )}
        </div>
      )}

      {!page && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-slate-600 mb-1" />
          <span>Pág {pageNumber}</span>
        </div>
      )}
    </div>
  );
};
