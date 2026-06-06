export function useVoiceModule() {
  return {
    owner: "voice",
    restored: false,
  };
}

export type VoiceModuleView = ReturnType<typeof useVoiceModule>;
