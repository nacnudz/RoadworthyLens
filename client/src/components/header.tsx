import { Car, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Car className="text-2xl" />
            <h1 className="text-xl font-medium">Roadworthy Tests</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onSettingsClick}
            className="text-primary-foreground hover:bg-primary-dark"
          >
            <Settings className="text-xl" />
          </Button>
        </div>
      </div>
    </header>
  );
}
