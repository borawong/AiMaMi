function normalizedPlatform(): string {
  const platformNavigator = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const userAgentData = platformNavigator.userAgentData;
  const fromUserAgentData = userAgentData?.platform?.toLowerCase();
  if (fromUserAgentData) {
    return fromUserAgentData;
  }

  const fromPlatform = navigator.platform?.toLowerCase();
  if (fromPlatform) {
    return fromPlatform;
  }

  return navigator.userAgent.toLowerCase();
}

export function isMacPlatform(): boolean {
  const platform = normalizedPlatform();
  return platform.includes("mac");
}

export function isWindowsPlatform(): boolean {
  const platform = normalizedPlatform();
  return platform.includes("win");
}
