import { Home, Plus, ListChecks, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "new-inspection", label: "New", icon: Plus },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => onViewChange(id)}
            className={`flex flex-col items-center py-3 px-4 rounded-lg transition-colors duration-200 ${
              currentView === id 
                ? "text-white bg-primary" 
                : "text-gray-500 hover:text-white hover:bg-primary"
            }`}
          >
            <Icon className="text-xl mb-1" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
