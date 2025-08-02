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
import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash-screen";
import NotFound from "@/pages/not-found";

function Router() {
  const [showSplash, setShowSplash] = useState(true);
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

  const openInspection = (inspectionId: string, isViewOnly = false) => {
    setCurrentInspectionId(inspectionId);
    setCurrentView(isViewOnly ? "view-report" : "checklist");
  };

  const closeInspection = () => {
    setCurrentInspectionId(null);
    setCurrentView("dashboard");
  };

  const handleNewInspectionComplete = (inspectionId: string) => {
    setCurrentInspectionId(inspectionId);
    setCurrentView("checklist");
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
      {currentView !== "camera" && <Header />}
      
      <main className={`flex-1 overflow-y-auto ${currentView !== "camera" ? "pb-20" : ""}`}>
        {currentView === "dashboard" && <Dashboard onOpenInspection={openInspection} onOpenSettings={() => setCurrentView("settings")} onCreateInspection={() => setCurrentView("new-inspection")} />}
        {currentView === "new-inspection" && <NewInspection onCancel={() => setCurrentView("dashboard")} onComplete={handleNewInspectionComplete} />}
        {currentView === "checklist" && <InspectionChecklist inspectionId={currentInspectionId} onShowCamera={showCamera} onClose={closeInspection} />}
        {currentView === "view-report" && <InspectionChecklist inspectionId={currentInspectionId} onShowCamera={showCamera} onClose={closeInspection} isViewOnly={true} />}
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
