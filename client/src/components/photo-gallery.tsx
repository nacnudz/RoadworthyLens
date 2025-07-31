import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoGalleryProps {
  itemName: string;
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  onDeletePhoto?: (photoIndex: number) => void;
}

export default function PhotoGallery({ 
  itemName, 
  photos, 
  isOpen, 
  onClose, 
  onDeletePhoto 
}: PhotoGalleryProps) {
  const { toast } = useToast();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? photos.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => 
      prev === photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleDownload = () => {
    if (photos[currentPhotoIndex]) {
      const link = document.createElement('a');
      link.href = photos[currentPhotoIndex];
      link.download = `${itemName}_photo_${currentPhotoIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Photo ${currentPhotoIndex + 1} is being downloaded`,
      });
    }
  };

  const handleDelete = () => {
    if (onDeletePhoto) {
      onDeletePhoto(currentPhotoIndex);
      
      // Adjust current index if needed
      if (currentPhotoIndex >= photos.length - 1 && photos.length > 1) {
        setCurrentPhotoIndex(photos.length - 2);
      } else if (photos.length === 1) {
        onClose();
      }
      
      toast({
        title: "Photo Deleted",
        description: `Photo ${currentPhotoIndex + 1} has been removed`,
      });
    }
  };

  if (!isOpen || photos.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-black">
        <DialogHeader className="p-4 bg-black/80 text-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white">{itemName} Photos</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {currentPhotoIndex + 1} of {photos.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main photo display */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <img
            src={photos[currentPhotoIndex]}
            alt={`${itemName} photo ${currentPhotoIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onError={() => {
              toast({
                title: "Image Error",
                description: "Failed to load photo",
                variant: "destructive",
              });
            }}
          />

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Photo thumbnails */}
        {photos.length > 1 && (
          <div className="p-4 bg-black/80">
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentPhotoIndex
                      ? "border-blue-500 ring-2 ring-blue-500/50"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 bg-black/80 border-t border-gray-700">
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {onDeletePhoto && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}