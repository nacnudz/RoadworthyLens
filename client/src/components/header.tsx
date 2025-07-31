import Logo from "@/components/logo";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo className="h-10 w-auto" />
          <div className="flex flex-col items-center text-center flex-1">
            <h1 className="text-[28px] font-bold">Road Worthy Lens</h1>
            <p className="text-sm opacity-75">Vehicle Inspection Management</p>
          </div>
          <div className="w-10"></div> {/* Spacer to balance the logo */}
        </div>
      </div>
    </header>
  );
}
