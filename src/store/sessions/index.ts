/*
Restoration tier: P2
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl; evidence/full-chain/raw/command-index.json; evidence/full-chain/raw/validation-summary.json
Frontend module: store/sessions/index
This file is a structured reconstruction scaffold, not recovered original source.
Deep module boundary: expose only stable state contracts here.
*/
export { sessionsInitialState } from './initial-state';
export { sessionsStore } from './store';
export { selectSessionsModuleId } from './selectors';
export type { SessionsStoreState } from './types';
