import { mcpInitialState } from './initial-state';
import { selectMcpModuleId } from './selectors';

export const mcpStore = {
  initialState: mcpInitialState,
  selectors: {
    selectModuleId: selectMcpModuleId,
  },
};
