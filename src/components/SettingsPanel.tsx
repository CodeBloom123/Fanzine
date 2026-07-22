import React, { useState } from 'react';
import { Sliders, Maximize2, Hash, Layers, HelpCircle, X, BookOpen } from 'lucide-react';
import { FitMode, ImpositionConfig } from '../types';

interface SettingsPanelProps {
  config: ImpositionConfig;
  onChange: (newConfig: ImpositionConfig) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);

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

  const currentPageCount = config.pageCount || 12;

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
          Fanzine de {currentPageCount} Páginas
        </span>
      </div>

      {/* SECCIÓN NUEVA: Selección de número de páginas del Fanzine */}
      <div className="bg-slate-950/90 border border-pink-500/30 rounded-xl p-4 shadow-sm relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-xs text-slate-100 uppercase tracking-wide">
              ¿Cuántas páginas tiene tu Fanzine?
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

        {/* Explicación ayuda de selector de páginas */}
        {activeHelp === 'pageCount' && (
          <div className="mt-3 p-3 bg-slate-900 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
            <button
              onClick={() => setActiveHelp(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="font-bold text-pink-300 mb-1">¿Cómo elegir el número de páginas?</p>
            <p><strong>• 8 Páginas:</strong> Usa 2 hojas A4 impresas a doble cara. Ideal para fanzines breves, poemarios o fanzines fotográficos rápidos.</p>
            <p><strong>• 10 Páginas:</strong> Usa 3 hojas A4. Si tu contenido es exactamente de 10 páginas, la app agregará automáticamente 2 páginas en blanco al final para notas, dedicatorias o dibujos.</p>
            <p><strong>• 12 Páginas:</strong> El tamaño clásico de fanzine. Usa 3 hojas A4 impresas a doble cara.</p>
            <p><strong>• 16 Páginas:</strong> Para fanzines más largos, catálogos o cómics detallados. Usa 4 hojas A4 impresas a doble cara.</p>
          </div>
        )}
      </div>

      {/* Banner explicativo sencillo */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-start justify-between gap-3">
        <div>
          <span className="font-semibold text-pink-300">💡 ¿Cómo funciona esto?</span> Esta app ordena la preferencia de páginas elegida para tu fanzine ({currentPageCount} páginas en {Math.ceil(currentPageCount / 4)} hojas A4) para que al imprimir las hojas por ambos lados y doblarlas por el centro, obtengas un librito perfecto en orden secuencial (1 al {currentPageCount}).
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">

        
        {/* 1. Margen de Lomo (Gutter) */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label htmlFor="gutter-slider" className="font-semibold text-slate-100">
                Margen del Centro (Lomo)
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
            <span>0 mm (Ajustado)</span>
            <span>6 mm (Recomendado)</span>
            <span>12 mm</span>
          </div>

          {/* Explicación desplegable */}
          {activeHelp === 'gutter' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">¿Qué es el Margen del Centro (Lomo)?</p>
              Es el espacio en blanco extra que dejamos justo por donde vas a doblar y engrapar las hojas. Sirve para que tus dibujos o textos no se oculten ni se pierdan dentro del pliegue de las páginas al abrir el librito.
            </div>
          )}
        </div>

        {/* 2. Modo de Encaje de Imágenes */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-pink-400" />
              <label className="font-semibold text-slate-100">
                Encaje de Imagen
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

          {/* Explicación desplegable */}
          {activeHelp === 'fitMode' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">¿Cómo colocar tus fotos?</p>
              <p><strong>• Rellenar (Cover):</strong> Llena toda la página sin dejar bordes blancos. Si la foto no tiene la forma exacta, recortará un poquito los lados.</p>
              <p><strong>• Ajustar (Contain):</strong> Muestra la imagen completa 100% sin recortar nada. Si la foto no encaja perfecta, dejará bordes blancos arriba o a los lados.</p>
              <p><strong>• Estirar (Stretch):</strong> Fuerza la foto para que llene la hoja completa, aunque se deforme un poco.</p>
            </div>
          )}
        </div>

        {/* 3. Color de Fondo & Guías de Doblado */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <label className="font-semibold text-slate-100">
                Fondo y Guía de Doblez
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
              <span>Línea centro</span>
            </label>
          </div>

          {/* Explicación desplegable */}
          {activeHelp === 'background' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">Color de Fondo y Línea Centro</p>
              <p><strong>• Color de Fondo:</strong> El color que tendrán las partes vacías de la hoja si la imagen no llena toda la página (usualmente blanco #FFFFFF o negro #000000).</p>
              <p><strong>• Línea centro:</strong> Dibuja una fina línea punteada en el centro de la hoja A4 para guiarte al momento de doblar el papel por la mitad.</p>
            </div>
          )}
        </div>

        {/* 4. Numeración & Calidad de PDF */}
        <div className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-pink-400" />
              <label className="font-semibold text-slate-100">
                Número de Página y Calidad
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
              <span>Poner Nº pág</span>
            </label>

            <select
              id="dpi-select"
              value={config.dpi}
              onChange={(e) => onChange({ ...config, dpi: parseInt(e.target.value) || 300 })}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-pink-500"
            >
              <option value={300}>300 DPI (Alta Calidad Imprenta)</option>
              <option value={150}>150 DPI (Archivo Liviano)</option>
            </select>
          </div>

          {/* Explicación desplegable */}
          {activeHelp === 'numbers' && (
            <div className="mt-2 p-3 bg-slate-950 border border-pink-500/40 rounded-xl text-slate-300 text-[11px] leading-relaxed relative shadow-xl space-y-1.5">
              <button
                onClick={() => setActiveHelp(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="font-bold text-pink-300 mb-1">Numeración y Calidad (DPI)</p>
              <p><strong>• Poner Nº pág:</strong> Agrega automáticamente el número de página abajo al centro (- 1 -, - 2 -) para no perderte al armarlo.</p>
              <p><strong>• 300 DPI:</strong> La mejor definición para imprimir en papel. Dibujos e imágenes saldrán super nítidos.</p>
              <p><strong>• 150 DPI:</strong> Para generar un PDF rápido y liviano si solo quieres enviarlo por internet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
