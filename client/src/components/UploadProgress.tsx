import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface UploadProgressProps {
  fileName: string;
  current: number;
  total: number;
}

export function UploadProgress({ fileName, current, total }: UploadProgressProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="h-5 w-5 animate-spin text-[#F15A24]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">A carregar ficheiros...</p>
          <p className="text-xs text-gray-500 truncate">{fileName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1 h-2" />
        <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}
