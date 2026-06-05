/*
Restoration tier: P2
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-contract-report.md; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/frontend-control-flow.jsonl; evidence/full-chain/raw/command-index.json; evidence/full-chain/raw/validation-summary.json
Frontend module: store/analytics/store
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { analyticsInitialState } from './initial-state';
import { selectAnalyticsModuleId } from './selectors';

export const analyticsStore = {
  initialState: analyticsInitialState,
  selectors: {
    selectModuleId: selectAnalyticsModuleId,
  },
};
