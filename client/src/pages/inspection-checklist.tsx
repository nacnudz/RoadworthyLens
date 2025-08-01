import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Images, CheckCircle, Save, ArrowLeft, Loader2, Upload, RefreshCw, XCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CHECKLIST_ITEMS } from "@shared/schema";
import PhotoGallery from "@/components/photo-gallery";


interface Inspection {
  id: string;
  roadworthyNumber: string;
  clientName: string;
  vehicleDescription: string;
  status: string;
  checklistItems: Record<string, boolean>;
  photos: Record<string, string[]>;
  completedAt?: string;
  uploadedToVicRoadsAt?: string;
  createdAt: string;
  testNumber: number;
}

interface Settings {
  id: string;
  checklistItemSettings: Record<string, string>;
  checklistItemOrder?: string[];
}

interface InspectionChecklistProps {
  inspectionId: string | null;
  onShowCamera: (inspectionId: string, itemName: string) => void;
  onClose: () => void;
  isViewOnly?: boolean;
}

export default function InspectionChecklist({ inspectionId, onShowCamera, onClose, isViewOnly = false }: InspectionChecklistProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<"pass" | "fail">("pass");
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<string>("");


  const { data: currentInspection, isLoading: inspectionLoading } = useQuery<Inspection>({
    queryKey: ["/api/inspections", inspectionId],
    enabled: !!inspectionId,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const saveInspectionMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const response = await apiRequest("PATCH", `/api/inspections/${inspectionId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Success",
        description: "Inspection saved successfully",
      });
      
      // Auto-dismiss toast and close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save inspection",
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (data: { itemName: string; photoIndex: number }) => {
      const response = await apiRequest("DELETE", `/api/inspections/${inspectionId}/photos/${encodeURIComponent(data.itemName)}/${data.photoIndex}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections", inspectionId] });
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async ({ inspectionId, status }: { inspectionId: string; status: "pass" | "fail" }) => {
      // First update the status
      await apiRequest("PATCH", `/api/inspections/${inspectionId}`, { status });
      // Then complete the inspection
      const response = await apiRequest("POST", `/api/inspections/${inspectionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections/in-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections/completed"] });
      toast({
        title: "Success",
        description: "Inspection completed successfully",
      });
      setShowCompletionDialog(false);
      
      // Auto-dismiss toast and close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete inspection",
        variant: "destructive",
      });
    },
  });

  if (inspectionLoading || settingsLoading) {
    return (
      <div className="p-4 space-y-6">
        {/* Header skeleton */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        
        {/* Progress skeleton */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        
        {/* Checklist items skeleton */}
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!currentInspection || !currentInspection.id) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No inspection found. Please select an inspection from the dashboard.</p>
            <Button 
              onClick={onClose}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary-dark transition-all duration-200"
            >
              <ArrowLeft className="mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const checklistItems = (currentInspection.checklistItems as Record<string, boolean>) || {};
  const photos = (currentInspection.photos as Record<string, string[]>) || {};
  const checklistSettings = (settings?.checklistItemSettings as Record<string, string>) || {};

  const getProgressInfo = () => {
    if (!settings?.checklistItemSettings) {
      // Fallback to all items if settings not loaded
      const completed = Object.values(checklistItems).filter(Boolean).length;
      const total = CHECKLIST_ITEMS.length;
      const percentage = Math.round((completed / total) * 100);
      return { completed, total, percentage };
    }

    // Only count required items for progress calculation
    const requiredItems = CHECKLIST_ITEMS.filter(item => 
      settings.checklistItemSettings[item] === "required"
    );
    
    const completedRequired = requiredItems.filter(item => 
      checklistItems[item] === true
    ).length;
    
    const totalRequired = requiredItems.length;
    const percentage = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;
    
    return { completed: completedRequired, total: totalRequired, percentage };
  };

  const { completed, total, percentage } = getProgressInfo();

  const getItemStatus = (item: string) => {
    const isRequired = checklistSettings[item] === "required";
    const isCompleted = checklistItems[item];
    const photoCount = photos[item]?.length || 0;

    return {
      isRequired,
      isCompleted,
      photoCount,
      statusText: isRequired ? "Required" : "Optional",
      statusColor: isRequired ? "bg-accent/10 text-accent" : "bg-gray-200 text-gray-600"
    };
  };

  const canComplete = () => {
    // Check if all required items are completed
    const orderedItems = settings?.checklistItemOrder || CHECKLIST_ITEMS;
    return orderedItems.every(item => {
      const isRequired = checklistSettings[item] === "required";
      const isCompleted = checklistItems[item];
      return !isRequired || isCompleted;
    });
  };

  const handleSaveInspection = () => {
    if (currentInspection.id) {
      saveInspectionMutation.mutate(currentInspection.id);
    }
  };

  const handleCompleteInspection = () => {
    if (!canComplete()) {
      const missingItems = CHECKLIST_ITEMS.filter(item => 
        checklistSettings[item] === "required" && !checklistItems[item]
      );
      toast({
        title: "Missing Required Items",
        description: `Please complete: ${missingItems.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setShowCompletionDialog(true);
  };

  const handleFinalizeCompletion = () => {
    if (currentInspection.id) {
      completeInspectionMutation.mutate({ 
        inspectionId: currentInspection.id, 
        status: selectedResult 
      });
    }
  };

  const handleDeletePhoto = (photoIndex: number) => {
    deletePhotoMutation.mutate({ 
      itemName: selectedGalleryItem, 
      photoIndex 
    });
  };

  return (
    <div className="p-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2"
          onClick={onClose}
        >
          <ArrowLeft className="mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Inspection Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-medium text-on-surface">{currentInspection.roadworthyNumber}</h2>
              <p className="text-sm text-gray-600">{currentInspection.clientName || "No client name"}</p>
              <p className="text-xs text-gray-500">{currentInspection.vehicleDescription || "No vehicle description"}</p>
            </div>
            <div className="flex space-x-2 ml-4">
              {(currentInspection.status === "pass" || currentInspection.status === "fail") && (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-primary mt-1">Completed</span>
                </div>
              )}
              {currentInspection.uploadedToVicRoadsAt && (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 mt-1">Uploaded</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Only show progress bar for in-progress inspections */}
          {currentInspection.status === "in-progress" && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {completed} of {total} items completed
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Heading */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-on-surface bg-gray-50 px-4 py-2 rounded-lg border">
          {currentInspection.testNumber === 1 ? "Initial Inspection" : `Re-Test ${currentInspection.testNumber - 1}`}
        </h3>
        {currentInspection.createdAt && (
          <p className="text-sm text-gray-500 mt-2">
            Created: {new Date(currentInspection.createdAt).toLocaleDateString()} {new Date(currentInspection.createdAt).toLocaleTimeString()}
          </p>
        )}
        {currentInspection.completedAt && (
          <p className="text-sm text-gray-500">
            Completed: {new Date(currentInspection.completedAt).toLocaleDateString()} {new Date(currentInspection.completedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {(settings?.checklistItemOrder || CHECKLIST_ITEMS)
          .filter(item => {
            // Always filter out hidden items
            if (checklistSettings[item] === "hidden") return false;
            
            // For completed inspections, only show items that have photos
            if (isViewOnly || currentInspection.status === "completed") {
              const photoCount = photos[item]?.length || 0;
              return photoCount > 0;
            }
            
            // For in-progress inspections, show all non-hidden items
            return true;
          })
          .map((item) => {
          const { isRequired, isCompleted, photoCount, statusText, statusColor } = getItemStatus(item);
          
          return (
            <Card key={item}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isCompleted 
                        ? "border-secondary bg-secondary" 
                        : "border-gray-300"
                    }`}>
                      {isCompleted && <CheckCircle className="text-white text-xs" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-on-surface">{item}</h3>
                      <p className="text-xs text-gray-500">
                        {photoCount > 0 ? `${photoCount} photos taken` : "No photos"}
                      </p>
                    </div>
                  </div>
                  {/* Only show status badge if not completed and not view-only */}
                  {!isViewOnly && currentInspection.status === "in-progress" && (
                    <Badge className={statusColor}>
                      {statusText}
                    </Badge>
                  )}
                </div>
                
                <div className="flex w-full gap-2">
                  {!isViewOnly && currentInspection.status === "in-progress" && (
                    <>
                      <Button 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark text-xs px-2"
                        onClick={() => onShowCamera(currentInspection.id, item)}
                      >
                        <Camera className="mr-1 h-3 w-3" />
                        Take Photo
                      </Button>
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2"
                        onClick={() => {
                          setSelectedGalleryItem(item);
                          setPhotoGalleryOpen(true);
                        }}
                      >
                        <Images className="mr-1 h-3 w-3" />
                        View {photoCount > 0 ? `(${photoCount})` : ''}
                      </Button>
                    </>
                  )}
                  {isViewOnly && (
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2"
                      disabled={photoCount === 0}
                      onClick={() => {
                        if (photoCount > 0) {
                          setSelectedGalleryItem(item);
                          setPhotoGalleryOpen(true);
                        }
                      }}
                    >
                      <Images className="mr-1 h-3 w-3" />
                      View Photos {photoCount > 0 ? `(${photoCount})` : ''}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>



      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {isViewOnly ? (
          <Card>
            <CardContent className="p-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg transition-all duration-200"
                onClick={onClose}
              >
                <ArrowLeft className="mr-2" />
                Close Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <Button 
                  className="w-full bg-secondary text-secondary-foreground py-3 text-lg hover:bg-gray-600 transition-all duration-200"
                  onClick={handleSaveInspection}
                  disabled={saveInspectionMutation.isPending}
                >
                  {saveInspectionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" />
                      Save Inspection
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Save progress and return to dashboard
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <Button 
                  className="w-full bg-primary text-primary-foreground py-3 text-lg hover:bg-primary-dark transition-all duration-200"
                  onClick={handleCompleteInspection}
                  disabled={!canComplete() || completeInspectionMutation.isPending}
                >
                  {completeInspectionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2" />
                      Complete Inspection
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Finalize and upload all photos to network folder
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Inspection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please select the inspection result:
            </p>
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => {
                  setSelectedResult("pass");
                  handleFinalizeCompletion();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                disabled={completeInspectionMutation.isPending}
              >
                {completeInspectionMutation.isPending && selectedResult === "pass" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Passed"
                )}
              </Button>
              <Button 
                onClick={() => {
                  setSelectedResult("fail");
                  handleFinalizeCompletion();
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                disabled={completeInspectionMutation.isPending}
              >
                {completeInspectionMutation.isPending && selectedResult === "fail" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Failed"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCompletionDialog(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                disabled={completeInspectionMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Gallery */}
      <PhotoGallery
        itemName={selectedGalleryItem}
        photos={photos[selectedGalleryItem] || []}
        isOpen={photoGalleryOpen}
        onClose={() => {
          setPhotoGalleryOpen(false);
          setSelectedGalleryItem("");
        }}
        onDeletePhoto={!isViewOnly && !currentInspection.completedAt ? handleDeletePhoto : undefined}
        isReadOnly={isViewOnly || !!currentInspection.completedAt}
      />


    </div>
  );
}
