/*
Restoration tier: P2
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl; evidence/full-chain/raw/command-index.json; evidence/full-chain/raw/validation-summary.json
Frontend module: routes/desktop/main/_shared
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { BentoCard } from '@/components/ui/bento-card';
import { getIpcCommandsForDomain, type IpcCommandDomain } from '@/contracts/ipc';

interface ModuleSkeletonPageProps {
  title: string;
  moduleId: string;
  domain: IpcCommandDomain;
}

export function ModuleSkeletonPage({ title, moduleId, domain }: ModuleSkeletonPageProps) {
  const commands = getIpcCommandsForDomain(domain);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{moduleId}</p>
        </div>
        <span className="rounded-[8px] border border-border px-2.5 py-1 text-xs text-muted-foreground">
          {commands.length} IPC contracts
        </span>
      </div>
      <BentoCard>
        <div className="grid gap-3 md:grid-cols-2">
          {commands.slice(0, 8).map((item) => (
            <div key={item.command} className="rounded-[8px] border border-border/80 p-3">
              <div className="text-sm font-medium">{item.command}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.wrapperNames.length > 0 ? item.wrapperNames.join(', ') : 'wrapper unresolved'}
              </div>
            </div>
          ))}
        </div>
      </BentoCard>
    </div>
  );
}
