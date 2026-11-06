export const DEFAULT_DNS64 = "2a00:1098:2c::1";

export function nat64InstallArgs(enabled: boolean, platform: string): string[] {
  const args = enabled ? ["--fallback-dns", DEFAULT_DNS64] : [];
  if (platform !== "windows") {
    args.push("--install-dns64", enabled ? DEFAULT_DNS64 : "off");
  }
  return args;
}
