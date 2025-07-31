import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { CHECKLIST_ITEMS } from "@shared/schema";
import Logo from "@/components/logo";

interface Inspection {
  id: string;
  roadworthyNumber: string;
  clientName: string;
  vehicleDescription: string;
  status: string;
  checklistItems: Record<string, boolean>;
  photos: Record<string, string[]>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardProps {
  onOpenInspection: (inspectionId: string, isViewOnly?: boolean) => void;
  onOpenSettings: () => void;
  onCreateInspection: () => void;
}

export default function Dashboard({ onOpenInspection, onOpenSettings, onCreateInspection }: DashboardProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: inProgressInspections = [], isLoading: loadingInProgress } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections/in-progress"],
  });

  const { data: completedInspections = [], isLoading: loadingCompleted } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections/completed"],
  });

  const deleteInspectionMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const response = await apiRequest("DELETE", `/api/inspections/${inspectionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections/completed"] });
      toast({
        title: "Success",
        description: "Inspection deleted successfully",
      });
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
      setConfirmDelete(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inspection",
        variant: "destructive",
      });
    },
  });

  const createRetestMutation = useMutation({
    mutationFn: async (originalInspectionId: string) => {
      const response = await apiRequest("POST", `/api/inspections/${originalInspectionId}/retest`);
      return response.json();
    },
    onSuccess: (newInspection) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections/in-progress"] });
      toast({
        title: "Success",
        description: "Retest created successfully",
      });
      onOpenInspection(newInspection.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create retest",
        variant: "destructive",
      });
    },
  });

  // Loading skeleton component for inspection cards
  const InspectionCardSkeleton = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </CardContent>
    </Card>
  );

  const getProgressInfo = (inspection: Inspection) => {
    const completed = Object.values(inspection.checklistItems || {}).filter(Boolean).length;
    const total = CHECKLIST_ITEMS.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-secondary/10 text-secondary">Pass</Badge>;
      case "fail":
        return <Badge className="bg-destructive/10 text-destructive">Fail</Badge>;
      default:
        return <Badge className="bg-accent/10 text-accent">In Progress</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Less than 1 hour ago";
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  const handleDeleteClick = (inspection: Inspection) => {
    setInspectionToDelete(inspection);
    setDeleteDialogOpen(true);
    setConfirmDelete(false);
  };

  const handleConfirmDelete = () => {
    if (inspectionToDelete && confirmDelete) {
      deleteInspectionMutation.mutate(inspectionToDelete.id);
    }
  };

  const handleRetest = (inspectionId: string, roadworthyNumber: string) => {
    createRetestMutation.mutate(inspectionId);
  };

  if (loadingInProgress || loadingCompleted) {
    return (
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const completedToday = completedInspections.filter(inspection => {
    const completedDate = new Date(inspection.completedAt || inspection.updatedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="p-4 space-y-6 max-w-md mx-auto">
        
        {/* Header with Logo */}
        <div className="flex items-center justify-between">
          <Logo className="h-10 w-auto" />
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-on-surface">Road Worthy Lens</h1>
            <p className="text-sm text-gray-500">Vehicle inspection management</p>
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-medium text-accent">
              {loadingInProgress ? <Skeleton className="h-8 w-8" /> : inProgressInspections.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Completed Today</div>
            <div className="text-2xl font-medium text-secondary">
              {loadingCompleted ? <Skeleton className="h-8 w-8" /> : completedToday}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Inspections */}
      <section>
        <h2 className="text-lg font-medium mb-3 text-on-surface">In Progress</h2>
        {loadingInProgress ? (
          <>
            <InspectionCardSkeleton />
            <InspectionCardSkeleton />
          </>
        ) : inProgressInspections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No inspections in progress
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {inProgressInspections.map((inspection) => {
              const { completed, total, percentage } = getProgressInfo(inspection);
              return (
                <Card key={inspection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-on-surface">{inspection.roadworthyNumber}</h3>
                        <p className="text-sm text-gray-600">{inspection.clientName}</p>
                        <p className="text-xs text-gray-500">{inspection.vehicleDescription}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {new Date(inspection.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(inspection.status)}
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {completed} of {total} items completed
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary-dark transition-all duration-200 hover:scale-105"
                      onClick={() => onOpenInspection(inspection.id)}
                    >
                      Continue Inspection
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Inspections */}
      <section>
        <h2 className="text-lg font-medium mb-3 text-on-surface">Recent Completed</h2>
        {loadingCompleted ? (
          <>
            <InspectionCardSkeleton />
            <InspectionCardSkeleton />
          </>
        ) : completedInspections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No completed inspections
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedInspections.slice(0, 5).map((inspection) => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-on-surface">{inspection.roadworthyNumber}</h3>
                      <p className="text-sm text-gray-600">{inspection.clientName}</p>
                      <p className="text-xs text-gray-500">{inspection.vehicleDescription}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Completed: {inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : new Date(inspection.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(inspection.status)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary" 
                      className="flex-1 transition-all duration-200 hover:scale-105"
                      onClick={() => onOpenInspection(inspection.id, true)}
                    >
                      View Report
                    </Button>
                    {inspection.status === "fail" && (
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary-dark transition-all duration-200 hover:scale-105"
                        onClick={() => handleRetest(inspection.id, inspection.roadworthyNumber)}
                        disabled={createRetestMutation.isPending}
                      >
                        {createRetestMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Retest"
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => handleDeleteClick(inspection)}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inspection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure that you want to delete Inspection {inspectionToDelete?.roadworthyNumber}?
            </p>
            <p className="text-xs text-gray-500">
              Note: This will only delete the inspection from the app. Photos and folders in the network location will not be deleted.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confirmDelete" 
                checked={confirmDelete}
                onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
              />
              <Label htmlFor="confirmDelete" className="text-sm cursor-pointer">
                Yes, I am sure
              </Label>
            </div>
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1"
                disabled={deleteInspectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmDelete}
                className="flex-1"
                disabled={!confirmDelete || deleteInspectionMutation.isPending}
              >
                {deleteInspectionMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
