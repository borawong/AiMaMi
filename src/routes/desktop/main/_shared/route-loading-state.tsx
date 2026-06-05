import { Skeleton } from '@/components/ui/skeleton';

export function RouteLoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-40 w-full rounded-[8px]" />
    </div>
  );
}
