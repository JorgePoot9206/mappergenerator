"use client";

import { useRef, useState, useCallback } from "react";

interface Props {
  onImageSelected: (file: File, base64: string, mimeType: string) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUploader({ onImageSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        alert("Unsupported format. Please upload a JPEG, PNG, GIF, or WebP image.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX = 1024;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
          // Reduce quality until base64 is under 4MB (safe for all APIs)
          let quality = 0.85;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length * 0.75 > 4 * 1024 * 1024 && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          onImageSelected(file, dataUrl.split(",")[1], "image/jpeg");
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={`
        relative flex flex-col items-center justify-center gap-4
        w-full max-w-xl mx-auto py-16 px-8
        border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-200 select-none
        ${isDragging
          ? "border-indigo-400 bg-indigo-500/10"
          : "border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handleChange}
      />

      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-slate-200 font-semibold text-lg">
          {isDragging ? "Drop your image here" : "Upload an image"}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          Drag & drop or click to browse
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Supports floor plans, maps, parking lots, offices — any spatial image
        </p>
        <p className="text-slate-600 text-xs mt-1">
          JPEG · PNG · WebP · GIF
        </p>
      </div>
    </div>
  );
}
