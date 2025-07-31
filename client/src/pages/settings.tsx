import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CHECKLIST_ITEMS } from "@shared/schema";

interface SettingsProps {
  onCancel: () => void;
}

export default function Settings({ onCancel }: SettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (checklistItemSettings: Record<string, string>) => {
      const response = await apiRequest("PATCH", "/api/settings", { checklistItemSettings });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      onCancel();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const checklistItemSettings = settings?.checklistItemSettings || {};

  const handleItemSettingChange = (item: string, value: string) => {
    const updatedSettings = {
      ...checklistItemSettings,
      [item]: value
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const getItemDescription = (item: string): string => {
    const descriptions: Record<string, string> = {
      "VIN": "Vehicle Identification Number documentation",
      "Under Vehicle": "Undercarriage inspection photos",
      "Vehicle on Hoist": "Vehicle positioning documentation",
      "Engine Bay": "Engine compartment inspection",
      "Compliance Plate": "Vehicle compliance documentation",
      "Front of Vehicle": "Front exterior inspection",
      "Rear of Vehicle": "Rear exterior inspection",
      "Head Light Aimer": "Headlight alignment documentation",
      "Dashboard Warning Lights": "Dashboard warning system check",
      "Odometer Before Road Test": "Pre-test odometer reading",
      "Odometer After Road Test": "Post-test odometer reading",
      "Brake Test Print": "Brake testing results documentation",
      "Engine Number": "Engine identification documentation",
      "Modification Plate": "Vehicle modification documentation",
      "LPG Tank Plate": "LPG system documentation",
      "Tint Read Out": "Window tint measurement results",
      "Noteworthy": "Notable observations during inspection",
      "Fault": "Identified faults or issues",
      "Other": "Additional documentation as needed"
    };
    return descriptions[item] || "Inspection documentation";
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-6 text-on-surface">Checklist Settings</h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure which items are required or optional for all inspections.
          </p>
          
          <div className="space-y-4">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <h3 className="font-medium text-on-surface">{item}</h3>
                  <p className="text-sm text-gray-500">{getItemDescription(item)}</p>
                </div>
                <RadioGroup
                  value={checklistItemSettings[item] || "optional"}
                  onValueChange={(value) => handleItemSettingChange(item, value)}
                  className="flex items-center space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="required" id={`${item}-required`} />
                    <Label htmlFor={`${item}-required`} className="text-sm cursor-pointer">
                      Required
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="optional" id={`${item}-optional`} />
                    <Label htmlFor={`${item}-optional`} className="text-sm cursor-pointer">
                      Optional
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button 
              variant="secondary"
              onClick={onCancel} 
              className="flex-1"
              disabled={updateSettingsMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => updateSettingsMutation.mutate(checklistItemSettings)}
              className="flex-1 bg-primary hover:bg-primary-dark"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
