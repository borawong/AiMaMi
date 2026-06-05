/*
Restoration tier: P2
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl; evidence/full-chain/raw/command-index.json; evidence/full-chain/raw/validation-summary.json
Frontend module: routes/desktop/main/_shared
This file is a structured reconstruction scaffold, not recovered original source.
*/
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
