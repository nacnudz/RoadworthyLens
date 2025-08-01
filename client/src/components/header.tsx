import logoImage from "@assets/g5_OHHI6Nzo2KgfUVpTJD_1754076026694.jpeg";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center">
          <img 
            src={logoImage} 
            alt="Road Worthy Lens" 
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>
    </header>
  );
}
