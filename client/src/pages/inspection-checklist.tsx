import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, Images, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CHECKLIST_ITEMS } from "@shared/schema";

interface InspectionChecklistProps {
  onShowCamera: (inspectionId: string, itemName: string) => void;
}

export default function InspectionChecklist({ onShowCamera }: InspectionChecklistProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For demo purposes, using the first in-progress inspection
  const { data: inProgressInspections = [] } = useQuery({
    queryKey: ["/api/inspections/in-progress"],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const currentInspection = inProgressInspections[0];

  const completeInspectionMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const response = await apiRequest("POST", `/api/inspections/${inspectionId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Success",
        description: "Inspection completed and uploaded to network folder",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete inspection",
        variant: "destructive",
      });
    },
  });

  if (!currentInspection) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No inspection in progress. Please start a new inspection.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const checklistItems = currentInspection.checklistItems || {};
  const photos = currentInspection.photos || {};
  const checklistSettings = settings?.checklistItemSettings || {};

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

    completeInspectionMutation.mutate(currentInspection.id);
  };

  return (
    <div className="p-4">
      {/* Inspection Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-medium text-on-surface">{currentInspection.roadworthyNumber}</h2>
          <p className="text-sm text-gray-600">{currentInspection.clientName}</p>
          <p className="text-xs text-gray-500">{currentInspection.vehicleDescription}</p>
          
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
                  <Button 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark"
                    onClick={() => onShowCamera(currentInspection.id, item)}
                  >
                    <Camera className="mr-2" />
                    Take Photo
                  </Button>
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

      {/* Complete Button */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <Button 
            className="w-full bg-secondary text-secondary-foreground py-3 text-lg hover:bg-green-600"
            onClick={handleCompleteInspection}
            disabled={!canComplete() || completeInspectionMutation.isPending}
          >
            <CheckCircle className="mr-2" />
            {completeInspectionMutation.isPending ? "Completing..." : "Complete Inspection"}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            This will upload all photos to the network folder
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
