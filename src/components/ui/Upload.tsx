import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './Button';

export interface UploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
  accept?: string;
  maxSizeMB?: number;
  loading?: boolean;
  error?: string | null;
  label?: string;
  helpText?: string;
  className?: string;
}

export function Upload({ 
  onFileSelect, 
  file, 
  onClear, 
  accept = "*", 
  maxSizeMB = 5,
  loading = false,
  error = null,
  label = "Upload file",
  helpText = "Drag and drop or click to upload",
  className = "" 
}: UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSelect = (selectedFile: File) => {
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      // In a real app we might pass this error up or handle it internally
      // For now, we rely on the parent's error state, but we could also fire an onError prop.
      // We will still pass it up, parent can validate.
    }
    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/80 mb-2">
          {label}
        </label>
      )}
      
      <div 
        role="button"
        tabIndex={0}
        aria-label={file ? `Selected file: ${file.name}` : label}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && !loading && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !file && !loading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300
          ${isDragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'}
          ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          ${file ? 'cursor-default' : 'cursor-pointer'}
          p-8 flex flex-col items-center justify-center text-center
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-2 border-white/20 border-t-[var(--color-primary)] rounded-full mb-4"
            />
            <p className="text-white/90 font-medium">Processing...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center w-full">
            <div className="bg-[var(--color-primary)]/20 p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <p className="text-white font-medium mb-1 truncate max-w-full px-4">{file.name}</p>
            <p className="text-white/50 text-xs mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <Button 
              variant="ghost" 
               
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Remove File
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white/5 p-4 rounded-full mb-4 group-hover:bg-[var(--color-primary)]/20 transition-colors">
              <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-[var(--color-primary)]' : 'text-white/60'}`} />
            </div>
            <h3 className="text-white font-medium mb-2">{helpText}</h3>
            <p className="text-white/40 text-xs max-w-xs mx-auto">
              {accept === "*" ? "All files supported" : `Supported formats: ${accept}`} (Max {maxSizeMB}MB)
            </p>
          </>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="sr-only" 
          accept={accept}
          onChange={handleChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm mt-3 font-medium text-center"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
