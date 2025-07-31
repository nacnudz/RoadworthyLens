import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-12 w-auto" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const logoUrl = settings?.logoUrl;

  if (!logoUrl || imageError) {
    return (
      <div className={`${className} flex items-center justify-center bg-primary text-primary-foreground rounded font-bold text-lg`}>
        RWT
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt="Company Logo"
      className={className}
      onError={() => setImageError(true)}
      style={{ maxHeight: '48px', width: 'auto' }}
    />
  );
}