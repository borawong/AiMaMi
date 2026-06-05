import { skillsInitialState } from './initial-state';
import { selectSkillsModuleId } from './selectors';

export const skillsStore = {
  initialState: skillsInitialState,
  selectors: {
    selectModuleId: selectSkillsModuleId,
  },
};
