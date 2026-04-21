import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`h-6 w-6 animate-spin text-primary ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
