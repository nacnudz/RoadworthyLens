import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoGalleryProps {
  itemName: string;
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  onDeletePhoto?: (photoIndex: number) => void;
  isReadOnly?: boolean;
}

export default function PhotoGallery({ 
  itemName, 
  photos, 
  isOpen, 
  onClose, 
  onDeletePhoto,
  isReadOnly = false
}: PhotoGalleryProps) {
  const { toast } = useToast();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);



  const handleDelete = () => {
    if (onDeletePhoto) {
      onDeletePhoto(currentPhotoIndex);
      
      // Adjust current index if needed
      if (currentPhotoIndex >= photos.length - 1 && photos.length > 1) {
        setCurrentPhotoIndex(photos.length - 2);
      } else if (photos.length === 1) {
        // Close modal when last photo is deleted
        onClose();
      }
    }
  };

  // Close modal if no photos remain (after deletion)
  if (isOpen && photos.length === 0) {
    onClose();
    return null;
  }

  if (!isOpen || photos.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black flex flex-col dialog-shadow">
        <DialogHeader className="p-4 bg-black/80 text-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white">{itemName} Photos</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {currentPhotoIndex + 1} of {photos.length}
              </Badge>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main photo display */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
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
        </div>

        {/* Photo thumbnails */}
        {photos.length > 1 && (
          <div className="p-4 bg-black/80">
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    index === currentPhotoIndex
                      ? "border-primary"
                      : "border-gray-600"
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
        {onDeletePhoto && !isReadOnly && (
          <div className="p-4 bg-black/80 border-t border-gray-700">
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}