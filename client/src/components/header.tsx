interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-xl font-medium">Road Worthy Tests</h1>
          <p className="text-sm opacity-75 mt-1">Vehicle Inspection Management</p>
        </div>
      </div>
    </header>
  );
}
