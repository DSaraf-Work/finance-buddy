/**
 * ReceiptUpload
 *
 * Drag-and-drop file upload component for receipts.
 * Supports images (JPEG, PNG, WEBP) and PDFs.
 */

import { memo, useState, useCallback, useRef } from 'react';
import { Upload, Image, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RECEIPT_LIMITS, isValidReceiptFileType } from '@/types/receipts';

interface ReceiptUploadProps {
  /** Transaction ID for upload */
  transactionId: string;
  /** Called when upload completes successfully */
  onUploadComplete?: (receiptId: string) => void;
  /** Called on upload error */
  onError?: (error: string) => void;
  /** Disable upload */
  disabled?: boolean;
}

export const ReceiptUpload = memo(function ReceiptUpload({
  transactionId,
  onUploadComplete,
  onError,
  disabled = false,
}: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (!isValidReceiptFileType(file.type)) {
      return 'Invalid file type. Please upload JPEG, PNG, WEBP, or PDF.';
    }
    if (file.size > RECEIPT_LIMITS.MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(RECEIPT_LIMITS.MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        onError?.(error);
        return;
      }

      setSelectedFile(file);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `/api/transactions/${transactionId}/receipts`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        onUploadComplete?.(data.data.receipt.id);
      } catch (err: any) {
        onError?.(err.message || 'Failed to upload receipt');
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    },
    [transactionId, onUploadComplete, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-8 w-8" />;
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="h-8 w-8" />;
    }
    return <FileText className="h-8 w-8" />;
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-6
        transition-all duration-200
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col items-center justify-center text-center space-y-3">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Uploading...
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedFile?.name}
              </p>
            </div>
          </>
        ) : selectedFile ? (
          <>
            <div className="text-primary">{getFileIcon()}</div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </>
        ) : (
          <>
            <div className="text-muted-foreground">{getFileIcon()}</div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop receipt here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WEBP, or PDF up to{' '}
                {formatFileSize(RECEIPT_LIMITS.MAX_FILE_SIZE)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default ReceiptUpload;
