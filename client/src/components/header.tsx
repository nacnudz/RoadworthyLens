import Logo from "@/components/logo";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-3 mb-1">
            <Logo className="h-8 w-auto" />
            <h1 className="text-xl font-medium">Road Worthy Lens</h1>
          </div>
          <p className="text-sm opacity-75">Vehicle Inspection Management</p>
        </div>
      </div>
    </header>
  );
}
