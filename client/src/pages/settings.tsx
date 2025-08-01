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
import { ArrowLeft, Upload, Loader2, GripVertical, Eye, EyeOff } from "lucide-react";
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
    networkFolderPath: string;
    networkUsername: string;
    networkPassword: string;
    logoUrl?: string;
  }>({
    checklistItemSettings: {},
    checklistItemOrder: [...CHECKLIST_ITEMS].sort(),
    networkFolderPath: "",
    networkUsername: "",
    networkPassword: "",
    logoUrl: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize local settings when data loads
  useEffect(() => {
    if (settings) {
      const hasPassword = !!(settings as any).networkPasswordHash;
      setHasStoredPassword(hasPassword);
      
      setLocalSettings({
        checklistItemSettings: (settings as any).checklistItemSettings || {},
        checklistItemOrder: (settings as any).checklistItemOrder || [...CHECKLIST_ITEMS].sort(),
        networkFolderPath: (settings as any).networkFolderPath || "",
        networkUsername: (settings as any).networkUsername || "",
        networkPassword: hasPassword ? "••••••••••" : "", // Show dots for stored password
        logoUrl: (settings as any).logoUrl || ""
      });
    }
  }, [settings]);

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      setLocalSettings(prev => ({ ...prev, logoUrl: data.logoUrl }));
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

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

  const handleItemSettingChange = (item: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      checklistItemSettings: {
        ...prev.checklistItemSettings,
        [item]: value
      }
    }));
  };

  const handleNetworkFolderChange = (value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      networkFolderPath: value
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        uploadLogoMutation.mutate(file);
      } else {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = () => {
    // Create payload, only include password if it's not the masked dots and has been changed
    const payload: any = {
      checklistItemSettings: localSettings.checklistItemSettings,
      checklistItemOrder: localSettings.checklistItemOrder,
      networkFolderPath: localSettings.networkFolderPath,
      networkUsername: localSettings.networkUsername,
      logoUrl: localSettings.logoUrl
    };
    
    // Only include password if it's been changed (not the masked dots)
    if (localSettings.networkPassword && localSettings.networkPassword !== "••••••••••") {
      payload.networkPassword = localSettings.networkPassword;
    }
    
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
          <h2 className="text-xl font-medium mb-6 text-on-surface">Application Settings</h2>
          
          {/* Logo Upload Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-on-surface">Company Logo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload your company logo to appear at the top of the app
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Logo className="h-12 w-auto border rounded p-1" />
              </div>
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                  className="w-full"
                >
                  {uploadLogoMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Network Folder Configuration */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 text-on-surface">Network Folder Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set the network folder path where completed inspection photos will be saved.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="networkFolder" className="text-sm font-medium text-gray-700">
                  Network Folder Path
                </Label>
                <Input
                  id="networkFolder"
                  type="text"
                  value={localSettings.networkFolderPath}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, networkFolderPath: e.target.value }))}
                  placeholder="e.g., \\\\server\\inspections or /mnt/network/inspections"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Photos will be organized as: [Network Folder]/[Roadworthy Number]/[Initial Test|Retest 1|Retest 2]/
                </p>
              </div>
              
              <div>
                <Label htmlFor="networkUsername" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="networkUsername"
                  type="text"
                  value={localSettings.networkUsername}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, networkUsername: e.target.value }))}
                  placeholder="Network username"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="networkPassword" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="networkPassword"
                    type={showPassword ? "text" : "password"}
                    value={localSettings.networkPassword}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, networkPassword: e.target.value }))}
                    placeholder={hasStoredPassword ? "••••••••••" : "Enter password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {hasStoredPassword ? "Leave blank to keep existing password" : "Password will be securely hashed before storage"}
                </p>
              </div>
            </div>
          </div>

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
              variant="secondary"
              onClick={onCancel} 
              className="flex-1"
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
