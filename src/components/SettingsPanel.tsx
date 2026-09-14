import React, { useState } from 'react';
import { Sliders, Maximize2, Hash, Layers, HelpCircle, X, BookOpen, Scissors, FileText, FileUp } from 'lucide-react';
import { FitMode, FanzineFormat, ImpositionConfig } from '../types';

interface SettingsPanelProps {
  config: ImpositionConfig;
  onChange: (newConfig: ImpositionConfig) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

  const isMiniZine = config.fanzineFormat === 'mini-zine-8';
  const isGaliciaPdf = config.fanzineFormat === 'galicia-pdf';
  const currentPageCount = isMiniZine ? 8 : (config.pageCount || 12);

  const handleFormatChange = (format: FanzineFormat) => {
    if (format === 'mini-zine-8') {
      onChange({
        ...config,
        fanzineFormat: 'mini-zine-8',
        pageCount: 8,
      });
    } else if (format === 'galicia-pdf') {
      onChange({
        ...config,
        fanzineFormat: 'galicia-pdf',
        pageCount: config.pageCount && config.pageCount >= 2 ? config.pageCount : 12,
      });
    } else {
      onChange({
        ...config,
        fanzineFormat: 'saddle-stitch',
        pageCount: config.pageCount && config.pageCount >= 8 ? config.pageCount : 12,
      });
    }
  };

  const handlePageCountChange = (count: number) => {
    onChange({ ...config, pageCount: count });
  };

  const handleGutterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, gutterMm: parseFloat(e.target.value) || 0 });
  };

  const handleFitModeChange = (mode: FitMode) => {
    onChange({ ...config, fitMode: mode });
  };

  const toggleHelp = (key: string) => {
    setActiveHelp(activeHelp === key ? null : key);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-slate-200 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-pink-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Ajustes de Impresión y Formato
          </h2>
        </div>
        <span className="text-xs text-pink-300 bg-pink-950/60 border border-pink-800/60 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
          {isGaliciaPdf
            ? `Prueba Galicia · ${currentPageCount} Páginas`
            : isMiniZine
            ? 'Mini Fanzine · 1 Hoja A4'
            : `Cuadernillo A5 · ${currentPageCount} Páginas`}
        </span>
      </div>

      {/* SELECTOR PRINCIPAL DE FORMATO */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-xs text-slate-100 uppercase tracking-wide">
              Formato del fanzine
            </span>
          </div>
          <span className="text-[11px] text-pink-300 font-mono">
            {isGaliciaPdf ? `${currentPageCount} Páginas (PDF)` : isMiniZine ? '1 Hoja A4' : `${currentPageCount} Páginas`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Format 1: Cuadernillo A5 */}
          <button
            type="button"
            id="format-saddle-stitch-btn"
            onClick={() => handleFormatChange('saddle-stitch')}
            className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
              !isMiniZine && !isGaliciaPdf
                ? 'bg-pink-950/60 border-pink-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${!isMiniZine && !isGaliciaPdf ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm">Cuadernillo A5</div>
            </div>
          </button>

          {/* Format 2: Mini Fanzine */}
          <button
            type="button"
            id="format-mini-zine-btn"
            onClick={() => handleFormatChange('mini-zine-8')}
            className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
              isMiniZine
                ? 'bg-pink-950/60 border-pink-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${isMiniZine ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm">Mini fanzine</div>
            </div>
          </button>

          {/* Format 3: Prueba Galicia */}
          <button
            type="button"
            id="format-galicia-pdf-btn"
            onClick={() => handleFormatChange('galicia-pdf')}
            className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
              isGaliciaPdf
                ? 'bg-pink-950/60 border-pink-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${isGaliciaPdf ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm">Prueba Galicia</div>
            </div>
          </button>
        </div>
      </div>

      {/* SECCIÓN ESPECÍFICA SEGÚN FORMATO */}
      {isGaliciaPdf ? (
        /* Prueba Galicia: Banner explicativo */
        <div className="bg-slate-950/90 border border-pink-500/30 rounded-xl p-4 text-xs text-slate-300 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <FileUp className="w-5 h-5 text-pink-400 shrink-0" />
            <div>
              <span className="font-bold text-pink-300">Prueba Galicia · PDF ya maquetado:</span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Importa un PDF de dobles páginas ya maquetadas (Canva, PowerPoint, Slides, etc.). Cada página horizontal se divide exactamente en mitad izquierda y derecha y se impone automáticamente para impresión en hojas A4 a doble cara.
              </p>
            </div>
          </div>
        </div>
      ) : !isMiniZine ? (
        /* Cuadernillo A5: Selector de páginas (8, 10, 12, 16) */
        <div className="bg-slate-950/90 border border-pink-500/30 rounded-xl p-4 shadow-sm relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-400" />
              <span className="font-bold text-xs text-slate-100 uppercase tracking-wide">
                ¿Cuántas páginas tiene tu Cuadernillo?
              </span>
              <button
                type="button"
                onClick={() => toggleHelp('pageCount')}
                className="p-1 rounded-full text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition"
                title="Ver explicación de páginas y hojas A4"
              >
                <HelpCircle className="w-4 h-4 text-pink-400" />
              </button>
            </div>
            <span className="text-[11px] text-pink-300 font-mono">
              {currentPageCount === 8 && '2 Hojas A4'}
              {currentPageCount === 10 && '3 Hojas A4 (10 + 2 notas)'}
              {currentPageCount === 12 && '3 Hojas A4'}
              {currentPageCount === 16 && '4 Hojas A4'}
            </span>
          </div>

          {/* Buttons Grid for Page Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[8, 10, 12, 16].map((count) => {
              const isSelected = currentPageCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  id={`page-count-btn-${count}`}
                  onClick={() => handlePageCountChange(count)}
                  className={`py-2.5 px-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-pink-600 border-pink-400 text-white shadow-md font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-black">{count} Páginas</span>
                  <span className={`text-[10px] ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>
                    {count === 8 && '2 Hojas A4'}
                    {count === 10 && '3 Hojas A4 (10+2)'}
                    {count === 12 && '3 Hojas A4'}
                    {count === 16 && '4 Hojas A4'}
                  </span>
                </button>
              );
            })}
          </div>

          {activeHelp === 'pageCount' && (
            <div className="mt-3 p-3 bg-slate-900 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">¿Cómo elegir el número de páginas?</p>
              <p><strong>• 8 Páginas:</strong> Usa 2 hojas A4 impresas a doble cara.</p>
              <p><strong>• 10 Páginas:</strong> Usa 3 hojas A4. Se agregan 2 páginas para notas al final.</p>
              <p><strong>• 12 Páginas:</strong> El tamaño clásico de fanzine. Usa 3 hojas A4.</p>
              <p><strong>• 16 Páginas:</strong> Para fanzines más extensos. Usa 4 hojas A4.</p>
            </div>
          )}
        </div>
      ) : (
        /* Mini Zine: Banner informativo de 8 páginas en 1 hoja */
        <div className="bg-slate-950/90 border border-pink-500/30 rounded-xl p-3.5 text-xs text-slate-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Scissors className="w-5 h-5 text-pink-400 shrink-0" />
            <div>
              <span className="font-bold text-pink-300">Imposición 1 Hoja A4 fija (8 páginas):</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pág 1 es Portada, Pág 8 es Contraportada. El PDF resultante tendrá 1 sola página A4 apaisada lista para imprimir por una sola cara.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLES TÉCNICOS DE PÁGINA Y RENDER (Ocultos en Prueba Galicia para mantener diseño cerrado y puro) */}
      {!isGaliciaPdf && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMiniZine ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4 text-xs`}>

        {/* 1. Margen de Lomo (Gutter) - Solo relevante en Cuadernillo A5 */}
        {!isMiniZine && (
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label htmlFor="gutter-slider" className="font-semibold text-slate-100">
                  Margen Lomo
                </label>
                <button
                  type="button"
                  onClick={() => toggleHelp('gutter')}
                  className="p-1 rounded-full text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition"
                  title="Ver qué es el margen de lomo"
                >
                  <HelpCircle className="w-4 h-4 text-pink-400" />
                </button>
              </div>
              <span className="font-mono text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded border border-pink-800 font-bold">
                {config.gutterMm} mm
              </span>
            </div>

            <input
              id="gutter-slider"
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={config.gutterMm}
              onChange={handleGutterChange}
              className="w-full accent-pink-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 mm</span>
              <span>6 mm</span>
              <span>12 mm</span>
            </div>

            {activeHelp === 'gutter' && (
              <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl">
                <button
                  onClick={() => setActiveHelp(null)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="font-bold text-pink-300 mb-1">Margen del Lomo</p>
                Espacio en blanco extra en el pliegue central para que tus dibujos o textos no se pierdan al grapar el cuadernillo.
              </div>
            )}
          </div>
        )}

        {/* 2. Modo de Encaje Global de Imágenes */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-pink-400" />
              <label className="font-semibold text-slate-100">
                Encaje Predeterminado
              </label>
              <button
                type="button"
                onClick={() => toggleHelp('fitMode')}
                className="p-1 rounded-full text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition"
                title="Ver diferencias entre modos de encaje"
              >
                <HelpCircle className="w-4 h-4 text-pink-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              id="fit-cover-btn"
              onClick={() => handleFitModeChange('cover')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition ${
                config.fitMode === 'cover'
                  ? 'bg-pink-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rellenar
            </button>

            <button
              type="button"
              id="fit-contain-btn"
              onClick={() => handleFitModeChange('contain')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition ${
                config.fitMode === 'contain'
                  ? 'bg-pink-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ajustar
            </button>

            <button
              type="button"
              id="fit-stretch-btn"
              onClick={() => handleFitModeChange('stretch')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition ${
                config.fitMode === 'stretch'
                  ? 'bg-pink-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estirar
            </button>
          </div>

          {activeHelp === 'fitMode' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">Encaje de imágenes</p>
              <p><strong>• Rellenar:</strong> Llena la página completa. Si abres el modal de cada página puedes mover y re-encuadrar con arrastre.</p>
              <p><strong>• Ajustar:</strong> Muestra la imagen completa sin recortar nada.</p>
              <p><strong>• Estirar:</strong> Fuerza la proporción de la página.</p>
            </div>
          )}
        </div>

        {/* 3. Color de Fondo & Guías */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <label className="font-semibold text-slate-100">
                Fondo y Guías
              </label>
              <button
                type="button"
                onClick={() => toggleHelp('background')}
                className="p-1 rounded-full text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition"
                title="Ver para qué sirve el color de fondo y guía"
              >
                <HelpCircle className="w-4 h-4 text-pink-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <input
                id="bg-color-picker"
                type="color"
                value={config.backgroundColor}
                onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="font-mono text-[11px] text-slate-300 uppercase font-medium">
                {config.backgroundColor}
              </span>
            </div>

            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer text-[11px]">
              <input
                id="fold-lines-checkbox"
                type="checkbox"
                checked={config.showFoldLines}
                onChange={(e) => onChange({ ...config, showFoldLines: e.target.checked })}
                className="rounded accent-pink-500 w-4 h-4"
              />
              <span>{isMiniZine ? 'Guías pliegue' : 'Línea centro'}</span>
            </label>
          </div>

          {activeHelp === 'background' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">Color de Fondo y Guías</p>
              <p><strong>• Color de Fondo:</strong> El color base que rodea a las imágenes en modo Ajustar.</p>
              <p><strong>• Guías:</strong> Dibuja finas líneas discontinuas para marcar los pliegues {isMiniZine && 'y el corte central'}.</p>
            </div>
          )}
        </div>

        {/* 4. Color de Lomo (Solo en Cuadernillo A5) */}
        {!isMiniZine && (
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                <label className="font-semibold text-slate-100">
                  Lomo en Color
                </label>
                <button
                  type="button"
                  onClick={() => toggleHelp('spine')}
                  className="p-1 rounded-full text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition"
                  title="Ver detalles sobre el color de lomo"
                >
                  <HelpCircle className="w-4 h-4 text-pink-400" />
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between gap-1">
                <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer text-[11px]">
                  <input
                    id="use-spine-color-checkbox"
                    type="checkbox"
                    checked={!!config.useCustomSpineColor}
                    onChange={(e) => onChange({ ...config, useCustomSpineColor: e.target.checked })}
                    className="rounded accent-pink-500 w-4 h-4"
                  />
                  <span className="font-medium">Pintar Lomo</span>
                </label>

                {config.useCustomSpineColor && (
                  <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
                    <input
                      id="spine-color-picker"
                      type="color"
                      value={config.spineColor || '#1e293b'}
                      onChange={(e) => onChange({ ...config, spineColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300 uppercase font-medium">
                      {config.spineColor || '#1e293b'}
                    </span>
                  </div>
                )}
              </div>

              {config.useCustomSpineColor && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-slate-400">Aplicar:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, spineApplyScope: 'all-pages' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                        config.spineApplyScope !== 'cover-only'
                          ? 'bg-pink-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, spineApplyScope: 'cover-only' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                        config.spineApplyScope === 'cover-only'
                          ? 'bg-pink-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Portada
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeHelp === 'spine' && (
              <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
                <button
                  onClick={() => setActiveHelp(null)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="font-bold text-pink-300 mb-1">Color de Lomo</p>
                <p>Pinta la franja central por donde se dobla el fanzine. En la portada da efecto de encuadernado profesional y en el interior separa las páginas con estilo.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. Numeración & Calidad de PDF */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-pink-400" />
              <label className="font-semibold text-slate-100">
                Páginas y Calidad
              </label>
              <button
                type="button"
                onClick={() => toggleHelp('numbers')}
                className="p-1 rounded-full text-slate-400 hover:text-pink-400 hover:bg-slate-800 transition"
                title="Ver detalles sobre numeración y DPI"
              >
                <HelpCircle className="w-4 h-4 text-pink-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer text-[11px]">
              <input
                id="page-numbers-checkbox"
                type="checkbox"
                checked={config.showPageNumbers}
                onChange={(e) => onChange({ ...config, showPageNumbers: e.target.checked })}
                className="rounded accent-pink-500 w-4 h-4"
              />
              <span>Nº pág</span>
            </label>

            <select
              id="dpi-select"
              value={config.dpi}
              onChange={(e) => onChange({ ...config, dpi: parseInt(e.target.value) || 300 })}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-pink-500"
            >
              <option value={300}>300 DPI</option>
              <option value={150}>150 DPI</option>
            </select>
          </div>

          {activeHelp === 'numbers' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">Numeración y Calidad</p>
              <p><strong>• Nº pág:</strong> Agrega automáticamente el número de página para ordenarlas fácilmente.</p>
              <p><strong>• 300 DPI:</strong> Calidad óptima de imprenta.</p>
            </div>
          )}
        </div>

      </div>
      )}
    </div>
  );
};
