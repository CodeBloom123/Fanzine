import React from 'react';
import { PageImage, ImpositionConfig, FitMode, BackgroundStrategy } from '../types';
import { PageView } from './PageView';
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  Palette,
} from 'lucide-react';
import { analyzeImageDimensions } from '../utils/pageRenderer';

interface PageEditModalProps {
  pageNumber: number;
  page?: PageImage;
  config: ImpositionConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<PageImage>) => void;
}

export const PageEditModal: React.FC<PageEditModalProps> = ({
  pageNumber,
  page,
  config,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen || !page) return null;

  const currentFit: FitMode = page.fitMode || config.fitMode || 'cover';
  const panX = page.panX ?? 0;
  const panY = page.panY ?? 0;
  const zoom = page.zoom ?? 1;
  const rotation = page.rotation || 0;
  const flipX = !!page.flipX;
  const flipY = !!page.flipY;
  const bgStrategy: BackgroundStrategy = page.backgroundStrategy || 'solid';

  const textOverlay = page.textOverlay || {
    enabled: false,
    text: '',
    x: 50,
    y: 80,
    fontSize: 18,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  };

  const imageStats =
    page.width && page.height
      ? analyzeImageDimensions(page.width, page.height)
      : null;

  const handleSetFit = (mode: FitMode) => {
    onUpdate({ fitMode: mode });
  };

  const handleRotate = (degreesToAdd: number) => {
    const nextRotation = ((rotation + degreesToAdd) % 360 + 360) % 360;
    onUpdate({ rotation: nextRotation });
  };

  const handleToggleFlipX = () => {
    onUpdate({ flipX: !flipX });
  };

  const handleToggleFlipY = () => {
    onUpdate({ flipY: !flipY });
  };

  const handleResetComposition = () => {
    onUpdate({
      panX: 0,
      panY: 0,
      zoom: 1,
    });
  };

  const handleResetTransforms = () => {
    onUpdate({
      rotation: 0,
      flipX: false,
      flipY: false,
      panX: 0,
      panY: 0,
      zoom: 1,
    });
  };

  const handleZoomChange = (delta: number) => {
    const nextZoom = Math.max(1, Math.min(3, Math.round((zoom + delta) * 10) / 10));
    onUpdate({ zoom: nextZoom });
  };

  const handleToggleText = (enabled: boolean) => {
    onUpdate({
      textOverlay: {
        ...textOverlay,
        enabled,
      },
    });
  };

  const handleTextContentChange = (text: string) => {
    onUpdate({
      textOverlay: {
        ...textOverlay,
        text,
      },
    });
  };

  const colors = [
    { label: 'Blanco', value: '#ffffff' },
    { label: 'Negro', value: '#000000' },
    { label: 'Rosa Ternura', value: '#f43f5e' },
    { label: 'Amarillo', value: '#eab308' },
    { label: 'Cian', value: '#06b6d4' },
    { label: 'Lima', value: '#84cc16' },
  ];

  const bgStyles = [
    { label: 'Pastilla Oscura', value: 'rgba(0, 0, 0, 0.75)' },
    { label: 'Pastilla Clara', value: 'rgba(255, 255, 255, 0.85)' },
    { label: 'Pastilla Rosa', value: 'rgba(225, 29, 72, 0.85)' },
    { label: 'Sin Fondo', value: 'transparent' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-pink-600 text-white">
              PÁGINA {pageNumber}
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              Edición Individual: Encuadre, Rotación, Fondo y Texto
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 p-5 overflow-y-auto">
          
          {/* Left Column: Interactive Page View Canvas (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
            <div className="w-full max-w-[320px] sm:max-w-[360px] shadow-2xl rounded-lg overflow-hidden border border-slate-700 relative">
              <PageView
                page={page}
                pageNumber={pageNumber}
                config={config}
                interactive={true}
                onUpdateComposition={onUpdate}
                showBadge={config.showPageNumbers}
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full max-w-[360px] text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-pink-400" />
                Arrastra la imagen o el texto para reubicar
              </span>
              {(panX !== 0 || panY !== 0 || zoom !== 1 || rotation !== 0 || flipX || flipY) && (
                <button
                  type="button"
                  onClick={handleResetTransforms}
                  className="text-pink-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Restablecer todo
                </button>
              )}
            </div>

            {/* Image meta indicator */}
            {imageStats && (
              <div className="mt-2 w-full max-w-[360px] bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>
                  Original: {page.width} × {page.height} px ({imageStats.isLandscape ? 'Apaisada' : imageStats.isPortrait ? 'Vertical' : 'Cuadrada'})
                </span>
                {imageStats.isLandscape && rotation === 0 && (
                  <button
                    type="button"
                    onClick={() => handleRotate(90)}
                    className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-0.5"
                    title="Girar 90° para que encaje verticalmente sin recortar"
                  >
                    <RotateCw className="w-3 h-3" /> Girar 90°
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Controls Panel (5 cols) */}
          <div className="md:col-span-5 space-y-4 text-xs overflow-y-auto pr-1">
            
            {/* 1. MODO DE ENCAJE INDIVIDUAL */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <label className="font-bold text-slate-200 block text-xs flex items-center justify-between">
                <span>Modo de Ajuste de Imagen</span>
                <span className="text-[10px] font-mono text-pink-400 uppercase font-semibold">
                  {currentFit}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetFit('cover')}
                  className={`p-2 rounded-lg border text-left font-bold text-xs transition flex flex-col justify-between ${
                    currentFit === 'cover'
                      ? 'bg-pink-950/60 border-pink-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>RELLENAR</span>
                  <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                    Ocupa todo el marco. Permite arrastrar.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetFit('contain')}
                  className={`p-2 rounded-lg border text-left font-bold text-xs transition flex flex-col justify-between ${
                    currentFit === 'contain'
                      ? 'bg-pink-950/60 border-pink-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>AJUSTAR</span>
                  <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                    Imagen completa visible sin recortes.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetFit('smart')}
                  className={`p-2 rounded-lg border text-left font-bold text-xs transition flex flex-col justify-between ${
                    currentFit === 'smart'
                      ? 'bg-pink-950/60 border-pink-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    <span>INTELIGENTE</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                    Auto-proporción y fondo suave.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetFit('stretch')}
                  className={`p-2 rounded-lg border text-left font-bold text-xs transition flex flex-col justify-between ${
                    currentFit === 'stretch'
                      ? 'bg-pink-950/60 border-pink-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>ESTIRAR</span>
                  <span className="text-[10px] font-normal text-slate-400 mt-0.5">
                    Fuerza a llenar ancho y alto.
                  </span>
                </button>
              </div>
            </div>

            {/* 2. TRANSFORMACIONES: ROTACIÓN Y VOLTEO */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <label className="font-bold text-slate-200 block text-xs">
                Girar y Voltear
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRotate(90)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition"
                  title="Girar 90 grados en sentido horario"
                >
                  <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                  <span>+90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRotate(180)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition"
                  title="Girar 180 grados"
                >
                  <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                  <span>180°</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRotate(270)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition"
                  title="Girar 270 grados"
                >
                  <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                  <span>270°</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleToggleFlipX}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition ${
                    flipX
                      ? 'bg-pink-950/80 border-pink-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-pink-400" />
                  <span>Espejo Horizontal</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFlipY}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition ${
                    flipY
                      ? 'bg-pink-950/80 border-pink-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5 text-pink-400" />
                  <span>Espejo Vertical</span>
                </button>
              </div>

              {(rotation !== 0 || flipX || flipY) && (
                <div className="pt-1 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Giro: {rotation}° {flipX ? '· Flip H' : ''} {flipY ? '· Flip V' : ''}</span>
                  <button
                    type="button"
                    onClick={() => onUpdate({ rotation: 0, flipX: false, flipY: false })}
                    className="text-pink-400 hover:underline"
                  >
                    Restablecer giro
                  </button>
                </div>
              )}
            </div>

            {/* 3. ESTRATEGIA DE FONDO CUANDO NO CUBRE TODO */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <label className="font-bold text-slate-200 block text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" />
                <span>Fondo en modo Ajustar / Bandas</span>
              </label>

              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => onUpdate({ backgroundStrategy: 'solid' })}
                  className={`py-1.5 px-1.5 rounded-lg border text-center font-medium transition ${
                    bgStrategy === 'solid'
                      ? 'bg-pink-950/70 border-pink-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Fondo Sólido
                </button>

                <button
                  type="button"
                  onClick={() => onUpdate({ backgroundStrategy: 'blur' })}
                  className={`py-1.5 px-1.5 rounded-lg border text-center font-medium transition ${
                    bgStrategy === 'blur'
                      ? 'bg-pink-950/70 border-pink-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Difuminado
                </button>

                <button
                  type="button"
                  onClick={() => onUpdate({ backgroundStrategy: 'mirror' })}
                  className={`py-1.5 px-1.5 rounded-lg border text-center font-medium transition ${
                    bgStrategy === 'mirror'
                      ? 'bg-pink-950/70 border-pink-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Reflejado
                </button>
              </div>
            </div>

            {/* 4. REENCUADRE (PAN & ZOOM) */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 text-xs">
                  Zoom y Encuadre
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={zoom <= 1}
                    onClick={() => handleZoomChange(-0.2)}
                    className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-pink-400 font-bold min-w-[32px] text-center text-xs">
                    {zoom.toFixed(1)}x
                  </span>
                  <button
                    type="button"
                    disabled={zoom >= 3}
                    onClick={() => handleZoomChange(0.2)}
                    className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sliders Desplazamiento */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block mb-1">Offset Horizontal: {panX}%</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panX}
                    onChange={(e) => onUpdate({ panX: parseInt(e.target.value, 10) })}
                    className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Offset Vertical: {panY}%</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={panY}
                    onChange={(e) => onUpdate({ panY: parseInt(e.target.value, 10) })}
                    className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono text-[10px]">
                  X: {panX}% · Y: {panY}% · {zoom}x
                </span>
                <button
                  type="button"
                  onClick={handleResetComposition}
                  className="text-pink-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Centrar
                </button>
              </div>
            </div>

            {/* 5. TEXTO EN ESTA PÁGINA */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Type className="w-4 h-4 text-pink-400" />
                  <label className="font-bold text-slate-200 text-xs">
                    Texto en esta Página
                  </label>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textOverlay.enabled}
                    onChange={(e) => handleToggleText(e.target.checked)}
                    className="rounded accent-pink-500 w-4 h-4"
                  />
                  <span className="text-[11px] font-medium text-slate-300">Activar</span>
                </label>
              </div>

              {textOverlay.enabled && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <input
                      type="text"
                      placeholder="Escribe el texto de esta página..."
                      value={textOverlay.text}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  {/* Sliders Posición X / Y */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block mb-1">Posición X ({textOverlay.x}%)</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={textOverlay.x}
                        onChange={(e) =>
                          onUpdate({
                            textOverlay: { ...textOverlay, x: parseInt(e.target.value, 10) },
                          })
                        }
                        className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Posición Y ({textOverlay.y}%)</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={textOverlay.y}
                        onChange={(e) =>
                          onUpdate({
                            textOverlay: { ...textOverlay, y: parseInt(e.target.value, 10) },
                          })
                        }
                        className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Tamaño y Color */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">
                        Tamaño ({textOverlay.fontSize}px)
                      </span>
                      <input
                        type="range"
                        min="12"
                        max="36"
                        value={textOverlay.fontSize}
                        onChange={(e) =>
                          onUpdate({
                            textOverlay: { ...textOverlay, fontSize: parseInt(e.target.value, 10) },
                          })
                        }
                        className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Color del Texto</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {colors.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() =>
                              onUpdate({
                                textOverlay: { ...textOverlay, color: c.value },
                              })
                            }
                            className={`w-5 h-5 rounded-full border transition ${
                              textOverlay.color === c.value
                                ? 'border-pink-500 scale-110 shadow'
                                : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pastilla de Fondo */}
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block mb-1">Estilo de Pastilla</span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {bgStyles.map((bg) => (
                        <button
                          key={bg.value}
                          type="button"
                          onClick={() =>
                            onUpdate({
                              textOverlay: { ...textOverlay, backgroundColor: bg.value },
                            })
                          }
                          className={`py-1 px-2 rounded border text-center transition ${
                            textOverlay.backgroundColor === bg.value
                              ? 'bg-pink-600/30 border-pink-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Los cambios se guardan automáticamente en tu proyecto.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-pink-600 hover:bg-pink-500 text-white transition shadow-sm"
          >
            Listo / Guardar
          </button>
        </div>

      </div>
    </div>
  );
};
