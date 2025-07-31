import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Camera, Images, CheckCircle, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CHECKLIST_ITEMS } from "@shared/schema";

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

  const { data: currentInspection } = useQuery({
    queryKey: ["/api/inspections", inspectionId],
    enabled: !!inspectionId,
  });

  const { data: settings } = useQuery({
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
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save inspection",
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
        description: "Inspection completed and uploaded to network folder",
      });
      setShowCompletionDialog(false);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete inspection",
        variant: "destructive",
      });
    },
  });

  if (!currentInspection || !currentInspection.id) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No inspection found. Please select an inspection from the dashboard.</p>
            <Button 
              onClick={onClose}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary-dark"
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
    const completed = Object.values(checklistItems).filter(Boolean).length;
    const total = CHECKLIST_ITEMS.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
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
    return CHECKLIST_ITEMS.every(item => {
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

  return (
    <div className="p-4">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="p-2"
        >
          <ArrowLeft className="mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Inspection Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-medium text-on-surface">{currentInspection.roadworthyNumber}</h2>
          <p className="text-sm text-gray-600">{currentInspection.clientName || "No client name"}</p>
          <p className="text-xs text-gray-500">{currentInspection.vehicleDescription || "No vehicle description"}</p>
          
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
        {CHECKLIST_ITEMS.map((item) => {
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
                  <Badge className={statusColor}>
                    {statusText}
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  {!isViewOnly && currentInspection.status === "in-progress" && (
                    <Button 
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark"
                      onClick={() => onShowCamera(currentInspection.id, item)}
                    >
                      <Camera className="mr-2" />
                      Take Photo
                    </Button>
                  )}
                  <Button 
                    variant="secondary"
                    size="icon"
                    disabled={photoCount === 0}
                  >
                    <Images />
                  </Button>
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
                className="w-full bg-secondary text-secondary-foreground py-3 text-lg hover:bg-gray-600"
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
                  className="w-full bg-secondary text-secondary-foreground py-3 text-lg hover:bg-gray-600"
                  onClick={handleSaveInspection}
                  disabled={saveInspectionMutation.isPending}
                >
                  <Save className="mr-2" />
                  {saveInspectionMutation.isPending ? "Saving..." : "Save Inspection"}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Save progress and return to dashboard
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <Button 
                  className="w-full bg-primary text-primary-foreground py-3 text-lg hover:bg-primary-dark"
                  onClick={handleCompleteInspection}
                  disabled={!canComplete() || completeInspectionMutation.isPending}
                >
                  <CheckCircle className="mr-2" />
                  {completeInspectionMutation.isPending ? "Completing..." : "Complete Inspection"}
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
            <RadioGroup value={selectedResult} onValueChange={(value: "pass" | "fail") => setSelectedResult(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pass" id="pass" />
                <Label htmlFor="pass" className="text-sm cursor-pointer">
                  Passed Test
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fail" id="fail" />
                <Label htmlFor="fail" className="text-sm cursor-pointer">
                  Failed Test
                </Label>
              </div>
            </RadioGroup>
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setShowCompletionDialog(false)}
                className="flex-1"
                disabled={completeInspectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFinalizeCompletion}
                className="flex-1 bg-primary hover:bg-primary-dark"
                disabled={completeInspectionMutation.isPending}
              >
                {completeInspectionMutation.isPending ? "Completing..." : "Done"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
