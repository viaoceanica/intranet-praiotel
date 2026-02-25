import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, formatTimeRemaining } from "@/lib/videoUtils";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface FileUploadWithProgressProps {
  file: File;
  ticketId: number;
  onSuccess: (fileUrl: string) => void;
  onError: (error: string) => void;
}

export function FileUploadWithProgress({
  file,
  ticketId,
  onSuccess,
  onError,
}: FileUploadWithProgressProps) {
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  
  const startUpload = async () => {
    try {
      // Converter ficheiro para base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (!base64) {
          setStatus('error');
          onError('Erro ao ler ficheiro');
          return;
        }

        // Simular progresso (já que tRPC não suporta progress events nativamente)
        // Em produção, isto seria substituído por XMLHttpRequest ou fetch com ReadableStream
        const totalSize = file.size;
        let uploaded = 0;
        const chunkSize = totalSize / 20; // 20 chunks para simular progresso
        const startTime = Date.now();

        const simulateProgress = () => {
          uploaded += chunkSize;
          const percent = Math.min((uploaded / totalSize) * 100, 95);
          setProgress(percent);
          
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = uploaded / elapsed;
          setUploadSpeed(speed);
          
          if (uploaded < totalSize) {
            setTimeout(simulateProgress, 100);
          }
        };
        
        simulateProgress();

        // Fazer upload real via tRPC
        const response = await fetch('/api/trpc/tickets.uploadAttachment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId,
            fileName: file.name,
            fileData: base64,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        setProgress(100);
        setStatus('success');
        const data = await response.json();
        onSuccess(data.result.data.fileUrl);
      };

      reader.onerror = () => {
        setStatus('error');
        onError('Erro ao ler ficheiro');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setStatus('error');
      onError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Iniciar upload automaticamente
  useState(() => {
    startUpload();
  });

  const bytesRemaining = file.size * (1 - progress / 100);
  const timeRemaining = uploadSpeed > 0 ? formatTimeRemaining(bytesRemaining, uploadSpeed) : 'Calculando...';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate flex-1">{file.name}</span>
        <span className="text-gray-500 ml-2">{formatFileSize(file.size)}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {status === 'uploading' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#F15A24]" />
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{Math.round(progress)}%</span>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div className="flex-1">
              <Progress value={100} className="h-2" />
            </div>
            <span className="text-xs text-green-600">Concluído</span>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <Progress value={progress} className="h-2 bg-red-100" />
            </div>
            <span className="text-xs text-red-600">Erro</span>
          </>
        )}
      </div>
      
      {status === 'uploading' && uploadSpeed > 0 && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatFileSize(uploadSpeed)}/s</span>
          <span>{timeRemaining} restante</span>
        </div>
      )}
    </div>
  );
}
