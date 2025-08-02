import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CHECKLIST_ITEMS } from "@shared/schema";
import { ArrowLeft, Loader2, GripVertical } from "lucide-react";
import Logo from "@/components/logo";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
interface SortableItemProps {
  id: string;
  item: string;
  setting: string;
  description: string;
  onSettingChange: (item: string, value: string) => void;
}

function SortableItem({ id, item, setting, description, onSettingChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-4 bg-white border rounded-lg shadow-sm gap-3"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-on-surface truncate">{item}</h4>
          <p className="text-sm text-gray-600 truncate">{description}</p>
        </div>
      </div>
      <RadioGroup
        value={setting}
        onValueChange={(value) => onSettingChange(item, value)}
        className="flex flex-col sm:flex-row gap-2 sm:gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="required" id={`${item}-required`} />
          <Label htmlFor={`${item}-required`} className="text-sm">Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="optional" id={`${item}-optional`} />
          <Label htmlFor={`${item}-optional`} className="text-sm">Optional</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="hidden" id={`${item}-hidden`} />
          <Label htmlFor={`${item}-hidden`} className="text-sm">Hidden</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

interface SettingsProps {
  onCancel: () => void;
}

export default function Settings({ onCancel }: SettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const [localSettings, setLocalSettings] = useState<{
    checklistItemSettings: Record<string, string>;
    checklistItemOrder: string[];
  }>({
    checklistItemSettings: {},
    checklistItemOrder: [...CHECKLIST_ITEMS].sort()
  });

  // Initialize local settings when data loads
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        checklistItemSettings: (settings as any).checklistItemSettings || {},
        checklistItemOrder: (settings as any).checklistItemOrder || [...CHECKLIST_ITEMS].sort()
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
        variant: "success",
      });
      
      // Auto-dismiss the success toast after 2 seconds
      setTimeout(() => {
        onCancel();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleItemSettingChange = (item: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      checklistItemSettings: {
        ...prev.checklistItemSettings,
        [item]: value
      }
    }));
  };



  const handleSave = () => {
    const payload: any = {
      checklistItemSettings: localSettings.checklistItemSettings,
      checklistItemOrder: localSettings.checklistItemOrder
    };
    
    updateSettingsMutation.mutate(payload);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for checklist reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localSettings.checklistItemOrder.indexOf(active.id);
      const newIndex = localSettings.checklistItemOrder.indexOf(over.id);

      const newOrder = arrayMove(localSettings.checklistItemOrder, oldIndex, newIndex);
      setLocalSettings({ ...localSettings, checklistItemOrder: newOrder });
    }
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
        <Card className="card-shadow">
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
      <Card className="form-shadow">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-6 text-on-surface text-center">Application Settings</h2>
          


          {/* Checklist Settings with Drag and Drop */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-on-surface">Checklist Item Requirements & Order</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure which items are required or optional for all inspections. Drag to reorder items.
            </p>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localSettings.checklistItemOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {localSettings.checklistItemOrder.map((item) => (
                    <SortableItem
                      key={item}
                      id={item}
                      item={item}
                      setting={localSettings.checklistItemSettings[item] || "optional"}
                      description={getItemDescription(item)}
                      onSettingChange={handleItemSettingChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button 
              onClick={onCancel} 
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              disabled={updateSettingsMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
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
