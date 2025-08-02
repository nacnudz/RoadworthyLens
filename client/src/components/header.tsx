import logoImage from "@assets/g5_OHHI6Nzo2KgfUVpTJD-Photoroom_1754111976984.png";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50 h-16 overflow-visible">
      <div className="px-2 h-full">
        <div className="flex items-center justify-center h-full">
          <img 
            src={logoImage} 
            alt="Roadworthy Lens" 
            className="h-32 w-auto object-contain pt-2"
          />
        </div>
      </div>
    </header>
  );
}
