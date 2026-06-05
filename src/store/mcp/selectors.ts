import type { McpStoreState } from './types';

export function selectMcpModuleId(state: McpStoreState) {
  return state.moduleId;
}
