'use client';

import React, { useState } from 'react';
import { ScreenshotItem } from '../types';
import { getScreenshotUrl } from '../lib/api';
import { Image as ImageIcon, ZoomIn, X } from 'lucide-react';

interface ScreenshotGalleryProps {
  taskId: string;
  screenshots: ScreenshotItem[];
}

export const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({ taskId, screenshots }) => {
  const [selectedImg, setSelectedImg] = useState<ScreenshotItem | null>(null);

  if (screenshots.length === 0) {
    return (
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-8 text-center">
        <ImageIcon className="w-10 h-10 mx-auto text-slate-700 mb-2" />
        <p className="text-xs text-slate-400">No Playwright visual regression screenshots captured yet.</p>
        <p className="text-[11px] text-slate-500 mt-1">Browser screenshots will appear during Tester Agent execution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screenshots.map((s) => {
          const imgUrl = getScreenshotUrl(taskId, s.filename);
          return (
            <div
              key={s.id}
              onClick={() => setSelectedImg(s)}
              className="group cursor-pointer bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all shadow-lg"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={s.step_description || s.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-2 rounded-full bg-slate-900/80 text-white shadow">
                    <ZoomIn className="w-5 h-5" />
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-white truncate">{s.filename}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.step_description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Preview */}
      {selectedImg && (
        <div
          onClick={() => setSelectedImg(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white">{selectedImg.filename}</span>
              <button
                onClick={() => setSelectedImg(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-[75vh] overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={getScreenshotUrl(taskId, selectedImg.filename)}
                alt={selectedImg.filename}
                className="max-h-[70vh] w-auto rounded border border-slate-800 object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
