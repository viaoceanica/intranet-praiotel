/**
 * Utilitário para geração de thumbnails de vídeos
 */

/**
 * Gera thumbnail de um vídeo
 * @param file Ficheiro de vídeo
 * @param timeOffset Tempo em segundos para capturar o frame (default: 0.5s)
 * @param maxWidth Largura máxima do thumbnail (default: 320px)
 */
export async function generateVideoThumbnail(
  file: File,
  timeOffset: number = 0.5,
  maxWidth: number = 320
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      // Calcular dimensões mantendo aspect ratio
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      video.currentTime = Math.min(timeOffset, video.duration);
    };
    
    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Formata tamanho de ficheiro para exibição
 * @param bytes Tamanho em bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calcula duração estimada de upload
 * @param bytesRemaining Bytes restantes
 * @param bytesPerSecond Velocidade de upload em bytes/segundo
 */
export function formatTimeRemaining(bytesRemaining: number, bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return 'Calculando...';
  
  const secondsRemaining = Math.ceil(bytesRemaining / bytesPerSecond);
  
  if (secondsRemaining < 60) {
    return `${secondsRemaining}s`;
  } else if (secondsRemaining < 3600) {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
