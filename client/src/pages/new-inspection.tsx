import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Loader2 } from "lucide-react";

interface NewInspectionProps {
  onCancel: () => void;
  onComplete: (inspectionId: string) => void;
}

export default function NewInspection({ onCancel, onComplete }: NewInspectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    roadworthyNumber: "",
    clientName: "",
    vehicleDescription: "",
    status: "in-progress"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createInspectionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Ensure status is always "in-progress" for new inspections
      const inspectionData = { ...data, status: "in-progress" };
      const response = await apiRequest("POST", "/api/inspections", inspectionData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections/in-progress"] });
      toast({
        title: "Success",
        description: "Inspection created successfully",
      });
      onComplete(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create inspection",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.roadworthyNumber.trim()) {
      newErrors.roadworthyNumber = "Roadworthy number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createInspectionMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="p-4">
      <Card className="form-shadow">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-6 text-on-surface">New Inspection</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="roadworthyNumber" className="text-sm font-medium text-gray-700">
                Roadworthy Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roadworthyNumber"
                type="text"
                value={formData.roadworthyNumber}
                onChange={(e) => updateFormData("roadworthyNumber", e.target.value)}
                placeholder="e.g., RWC-2024-005"
                className="mt-2"
                required
              />
              {errors.roadworthyNumber && (
                <p className="text-destructive text-sm mt-1">{errors.roadworthyNumber}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="clientName" className="text-sm font-medium text-gray-700">
                Client Name
              </Label>
              <Input
                id="clientName"
                type="text"
                value={formData.clientName}
                onChange={(e) => updateFormData("clientName", e.target.value)}
                placeholder="Enter client name (optional)"
                className="mt-2"
              />
              {errors.clientName && (
                <p className="text-destructive text-sm mt-1">{errors.clientName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="vehicleDescription" className="text-sm font-medium text-gray-700">
                Vehicle Description
              </Label>
              <Input
                id="vehicleDescription"
                type="text"
                value={formData.vehicleDescription}
                onChange={(e) => updateFormData("vehicleDescription", e.target.value)}
                placeholder="e.g., 2019 Toyota Camry - ABC123 (optional)"
                className="mt-2"
              />
              {errors.vehicleDescription && (
                <p className="text-destructive text-sm mt-1">{errors.vehicleDescription}</p>
              )}
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                onClick={onCancel} 
                disabled={createInspectionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary-dark transition-all duration-200 hover:scale-105"
                disabled={createInspectionMutation.isPending}
              >
                {createInspectionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Start Inspection"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
