"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { aiApi } from "@/lib/api";
import toast from "react-hot-toast";

interface AIPreview {
  category: string;
  severity: string;
  risk_score: number;
  summary: string;
}

interface ImageUploadProps {
  onImageSelected: (file: File, preview: string) => void;
  onAIResult?: (result: AIPreview) => void;
}

export default function ImageUpload({ onImageSelected, onAIResult }: ImageUploadProps) {
  const [preview, setPreview]     = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult]   = useState<AIPreview | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file, url);

    // Quick AI analysis
    setAnalyzing(true);
    try {
      const result = await aiApi.quickAnalyze(file);
      setAiResult(result);
      onAIResult?.(result);
    } catch {
      toast.error("AI analysis unavailable — you can still submit manually.");
    } finally {
      setAnalyzing(false);
    }
  }, [onImageSelected, onAIResult]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const clear = () => {
    setPreview(null);
    setAiResult(null);
  };

  const SEVERITY_COLOR: Record<string, string> = {
    critical: "text-red-600 bg-red-50",
    high:     "text-orange-600 bg-orange-50",
    medium:   "text-yellow-600 bg-yellow-50",
    low:      "text-green-600 bg-green-50",
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-green-400 bg-green-50"
              : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {isDragActive ? "Drop the photo here" : "Drag & drop a photo, or click to select"}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · max 10MB</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="w-full h-48 object-cover" />
            <button
              onClick={clear}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Analysis result */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-3 rounded-lg"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is analyzing your photo…
              </motion.div>
            )}

            {aiResult && !analyzing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-green-100 bg-green-50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    AI Analysis
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{aiResult.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium px-2 py-1 bg-white rounded-full border border-green-200 text-gray-600 capitalize">
                    {aiResult.category}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${SEVERITY_COLOR[aiResult.severity] ?? "text-gray-600 bg-white"}`}>
                    {aiResult.severity} severity
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-white rounded-full border border-green-200 text-gray-600">
                    Risk: {aiResult.risk_score}/100
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
