import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NewInspection from "@/pages/new-inspection";
import InspectionChecklist from "@/pages/inspection-checklist";
import Settings from "@/pages/settings";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import CameraInterface from "@/components/camera-interface";
import { useState } from "react";
import NotFound from "@/pages/not-found";

function Router() {
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [currentInspectionId, setCurrentInspectionId] = useState<string | null>(null);
  const [cameraData, setCameraData] = useState<{inspectionId: string, itemName: string} | null>(null);

  const showCamera = (inspectionId: string, itemName: string) => {
    setCameraData({ inspectionId, itemName });
    setCurrentView("camera");
  };

  const hideCamera = () => {
    setCameraData(null);
    setCurrentView("checklist");
  };

  const openInspection = (inspectionId: string) => {
    setCurrentInspectionId(inspectionId);
    setCurrentView("checklist");
  };

  const closeInspection = () => {
    setCurrentInspectionId(null);
    setCurrentView("dashboard");
  };

  const handleNewInspectionComplete = (inspectionId: string) => {
    setCurrentInspectionId(inspectionId);
    setCurrentView("checklist");
  };

  return (
    <div className="min-h-screen bg-surface">
      {currentView !== "camera" && <Header onSettingsClick={() => setCurrentView("settings")} />}
      
      <main className={currentView !== "camera" ? "pb-20" : ""}>
        {currentView === "dashboard" && <Dashboard onOpenInspection={openInspection} />}
        {currentView === "new-inspection" && <NewInspection onCancel={() => setCurrentView("dashboard")} onComplete={handleNewInspectionComplete} />}
        {currentView === "checklist" && <InspectionChecklist inspectionId={currentInspectionId} onShowCamera={showCamera} onClose={closeInspection} />}
        {currentView === "settings" && <Settings onCancel={() => setCurrentView("dashboard")} />}
        {currentView === "camera" && cameraData && (
          <CameraInterface 
            inspectionId={cameraData.inspectionId}
            itemName={cameraData.itemName}
            onCancel={hideCamera}
            onPhotoTaken={hideCamera}
          />
        )}
      </main>

      {currentView !== "camera" && (
        <BottomNavigation 
          currentView={currentView} 
          onViewChange={setCurrentView}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
