import { Copy } from "lucide-react";
import { t } from "i18next";

type ConnectionNode = {
  connection_source_ip?: string;
  ip_trust_eligible?: boolean;
};

export function NodeConnectionInfo({ node }: { node: ConnectionNode }) {
  const source = node.connection_source_ip;
  if (!source) return null;
  const mismatch = node.ip_trust_eligible !== true;
  return (
    <div
      className={`flex items-center gap-1 text-xs ${mismatch ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
      title={t(mismatch ? "admin.nodeTable.connectionMismatchTip" : "admin.nodeTable.connectionSourceTip", { ip: source })}
      data-connection-source={source}
    >
      <span>{t(mismatch ? "admin.nodeTable.relaySource" : "admin.nodeTable.connectionSource")}:</span>
      <span className="select-text break-all">{source}</span>
      <button
        type="button"
        className="shrink-0 p-1"
        aria-label={t("admin.nodeTable.copyConnectionSource")}
        onClick={() => { void navigator.clipboard.writeText(source); }}
      >
        <Copy size={12} />
      </button>
    </div>
  );
}
