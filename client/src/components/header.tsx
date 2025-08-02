import logoImage from "@assets/g5_OHHI6Nzo2KgfUVpTJD-Photoroom_1754111976984.png";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center">
          <img 
            src={logoImage} 
            alt="Roadworthy Lens" 
            className="h-36 w-auto object-contain"
          />
        </div>
      </div>
    </header>
  );
}
