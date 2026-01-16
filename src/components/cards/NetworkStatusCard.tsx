import React, { memo, useMemo } from "react";
import { ArrowDown, ArrowUp, Timer, Wifi } from "lucide-react";
import { Card } from "./Card";
import { CardComponentProps } from "../../types/cardProps";
import { useHomeAssistantStore } from "../../store/useHomeAssistantStore";
import { CardIconFrame } from "../ui/CardIconFrame";
import Badge from "../ui/Badge";

interface NetworkStatusCardSpecificProps {
  title: string;
  downloadThroughputEntityId?: string;
  uploadThroughputEntityId?: string;
  maxDownloadThroughputEntityId?: string;
  maxUploadThroughputEntityId?: string;
  latencyEntityId?: string;
  externalIpEntityId?: string;
}

type NetworkStatusCardProps = CardComponentProps<NetworkStatusCardSpecificProps>;

type ParsedNumber = { value: number | null; unit: string; raw: string; hasData: boolean };

const numberFromState = (state: string): number | null => {
  if (!state) return null;
  const compact = state.replace(/\s/g, "");
  // Capture full numeric token including thousand/decimal separators
  const match = compact.match(/-?[\d.,]+/);
  if (!match) return null;

  const token = match[0];
  const hasDot = token.includes(".");
  const hasComma = token.includes(",");

  // Normalize number tokens like:
  // - "283.130" (de-DE thousands) -> 283130
  // - "283,13" (de-DE decimal) -> 283.13
  // - "1.234,56" -> 1234.56
  // - "1,234.56" -> 1234.56
  let normalized = token;
  if (hasDot && hasComma) {
    const lastDot = token.lastIndexOf(".");
    const lastComma = token.lastIndexOf(",");
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandsSep = decimalSep === "." ? "," : ".";
    normalized = token.split(thousandsSep).join("").replace(decimalSep, ".");
  } else if (hasComma) {
    const parts = token.split(",");
    const last = parts[parts.length - 1] || "";
    // If exactly 3 trailing digits, treat as thousands separator; else decimal separator
    normalized = last.length === 3 ? parts.join("") : parts.join(".");
  } else if (hasDot) {
    const parts = token.split(".");
    const last = parts[parts.length - 1] || "";
    normalized = last.length === 3 ? parts.join("") : token;
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
};

const toKbitPerSecond = (value: number, unitRaw: string): number => {
  const u = (unitRaw || "").toLowerCase();
  // Bit-based
  if (u.includes("gbit/s")) return value * 1_000_000;
  if (u.includes("mbit/s")) return value * 1_000;
  if (u.includes("kbit/s")) return value;
  if (u.includes("bit/s")) return value / 1_000;

  // Byte-based
  if (u.includes("gb/s")) return value * 8_000_000;
  if (u.includes("mb/s")) return value * 8_000;
  if (u.includes("kb/s")) return value * 8;
  if (u.includes("b/s")) return (value * 8) / 1_000;

  // Unknown: assume already kbit/s (matches many UniFi throughput sensors)
  return value;
};

const formatKbit = (kbitPerSecond: number): { display: string; unit: string } => {
  if (!Number.isFinite(kbitPerSecond)) return { display: "--", unit: "" };
  if (kbitPerSecond >= 1_000_000) return { display: (kbitPerSecond / 1_000_000).toFixed(2).replace(/\.00$/, ""), unit: "Gbit/s" };
  if (kbitPerSecond >= 1_000) return { display: (kbitPerSecond / 1_000).toFixed(1).replace(/\.0$/, ""), unit: "Mbit/s" };
  return { display: Math.round(kbitPerSecond).toString(), unit: "kbit/s" };
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const NetworkStatusCardComponent: React.FC<NetworkStatusCardProps> = ({
  title,
  entityId,
  downloadThroughputEntityId,
  uploadThroughputEntityId,
  maxDownloadThroughputEntityId,
  maxUploadThroughputEntityId,
  latencyEntityId,
  externalIpEntityId,
  onTitleChange,
  onJsonSave,
  onCardDelete,
  cardConfig,
}) => {
  const { entities } = useHomeAssistantStore();

  // Support both explicit props and values stored in cardConfig (more robust if a caller forgets to pass extraProps)
  const cfg = cardConfig || {};
  const downloadId = downloadThroughputEntityId || cfg.downloadThroughputEntityId;
  const uploadId = uploadThroughputEntityId || cfg.uploadThroughputEntityId;
  const maxDownloadId = maxDownloadThroughputEntityId || cfg.maxDownloadThroughputEntityId;
  const maxUploadId = maxUploadThroughputEntityId || cfg.maxUploadThroughputEntityId;
  const latencyId = latencyEntityId || cfg.latencyEntityId || "sensor.ucg_ultra_cloudflare_wan_latency";
  const externalIpId = externalIpEntityId || cfg.externalIpEntityId;

  const parseEntityNumber = (id?: string): ParsedNumber => {
    if (!id) return { value: null, unit: "", raw: "--", hasData: false };
    const entity = entities.get(id);
    if (!entity || entity.state === "unavailable" || entity.state === "unknown") return { value: null, unit: "", raw: "--", hasData: false };
    const parsed = numberFromState(entity.state);
    if (parsed === null) return { value: null, unit: entity.attributes.unit_of_measurement || "", raw: entity.state, hasData: false };
    return { value: parsed, unit: entity.attributes.unit_of_measurement || "", raw: entity.state, hasData: true };
  };

  const download = useMemo(() => parseEntityNumber(downloadId), [downloadId, entities]);
  const upload = useMemo(() => parseEntityNumber(uploadId), [uploadId, entities]);
  const maxDownload = useMemo(() => parseEntityNumber(maxDownloadId), [maxDownloadId, entities]);
  const maxUpload = useMemo(() => parseEntityNumber(maxUploadId), [maxUploadId, entities]);
  const latency = useMemo(() => parseEntityNumber(latencyId), [latencyId, entities]);

  const externalIp = useMemo(() => {
    if (!externalIpId) return null;
    const entity = entities.get(externalIpId);
    if (!entity || entity.state === "unavailable" || entity.state === "unknown") return null;
    return entity.state;
  }, [externalIpId, entities]);

  const computed = useMemo(() => {
    const dlKbit = download.hasData && download.value !== null ? toKbitPerSecond(download.value, download.unit || download.raw) : null;
    const ulKbit = upload.hasData && upload.value !== null ? toKbitPerSecond(upload.value, upload.unit || upload.raw) : null;
    const maxDlKbit = maxDownload.hasData && maxDownload.value !== null ? toKbitPerSecond(maxDownload.value, maxDownload.unit || maxDownload.raw) : null;
    const maxUlKbit = maxUpload.hasData && maxUpload.value !== null ? toKbitPerSecond(maxUpload.value, maxUpload.unit || maxUpload.raw) : null;

    const dlPct = dlKbit !== null && maxDlKbit !== null && maxDlKbit > 0 ? clamp01(dlKbit / maxDlKbit) * 100 : null;
    const ulPct = ulKbit !== null && maxUlKbit !== null && maxUlKbit > 0 ? clamp01(ulKbit / maxUlKbit) * 100 : null;

    const maxUtil = Math.max(dlPct ?? 0, ulPct ?? 0);
    const latencyMs = latency.hasData && latency.value !== null ? latency.value : null;

    const utilizationVariant: "green" | "yellow" | "orange" | "red" =
      maxUtil >= 90 ? "red" : maxUtil >= 80 ? "orange" : maxUtil >= 65 ? "yellow" : "green";

    const latencyVariant: "green" | "yellow" | "orange" | "red" =
      latencyMs === null ? "red" : latencyMs >= 150 ? "red" : latencyMs >= 100 ? "orange" : latencyMs >= 60 ? "yellow" : "green";

    const overallVariant: "green" | "yellow" | "orange" | "red" | "gray" =
      latencyMs === null || (!download.hasData && !upload.hasData) ? "gray" : latencyVariant === "red" || utilizationVariant === "red" ? "red" : latencyVariant === "orange" || utilizationVariant === "orange" ? "orange" : latencyVariant === "yellow" || utilizationVariant === "yellow" ? "yellow" : "green";

    const overallLabel =
      overallVariant === "green" ? "Excellent" : overallVariant === "yellow" ? "Good" : overallVariant === "orange" ? "Degraded" : overallVariant === "red" ? "Poor" : "No data";

    const dlFmt = dlKbit !== null ? formatKbit(dlKbit) : { display: "--", unit: "" };
    const ulFmt = ulKbit !== null ? formatKbit(ulKbit) : { display: "--", unit: "" };
    const maxDlFmt = maxDlKbit !== null ? formatKbit(maxDlKbit) : { display: "--", unit: "" };
    const maxUlFmt = maxUlKbit !== null ? formatKbit(maxUlKbit) : { display: "--", unit: "" };

    return {
      dlPct,
      ulPct,
      latencyMs,
      overallVariant,
      overallLabel,
      utilizationVariant,
      latencyVariant,
      dlFmt,
      ulFmt,
      maxDlFmt,
      maxUlFmt,
    };
  }, [download, upload, maxDownload, maxUpload, latency]);

  const barColor = (pct: number | null) => {
    if (pct === null) return "bg-gray-600/60";
    if (pct >= 90) return "bg-red-500";
    if (pct >= 80) return "bg-orange-500";
    if (pct >= 65) return "bg-yellow-500";
    return "bg-green-500";
  };

  const latencyDisplay = computed.latencyMs === null ? "--" : Math.round(computed.latencyMs).toString();
  const statusBadge = (
    <Badge variant={computed.overallVariant} className="px-2 py-0.5 text-[10px]">
      {computed.overallLabel}
    </Badge>
  );

  const subtitle = (
    <div className="flex items-center gap-1 text-gray-300">
      <Timer className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-[11px] font-semibold tabular-nums leading-none">{latencyDisplay}</span>
      <span className="text-[10px] text-gray-500 leading-none">ms</span>
    </div>
  );

  const ThroughputRow: React.FC<{
    icon: React.ReactNode;
    pct: number | null;
    current: { display: string; unit: string };
    max: { display: string; unit: string };
  }> = ({ icon, pct, current, max }) => {
    const percentage = pct === null ? 0 : Math.min(100, Math.max(0, pct));
    const barClass = barColor(pct);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 w-full">
          <div className="text-gray-300 w-3 flex justify-center scale-90">{icon}</div>
          {/* Keep bar thickness consistent with the rest of the UI */}
          <div className="flex-1 bg-gray-700/30 rounded-full overflow-hidden" style={{ height: "5px" }}>
            <div className={`h-full ${barClass} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
          </div>
          <div className="text-right min-w-[2.6rem] font-semibold text-white text-[10px] leading-none">
            {pct === null ? "--" : `${Math.round(pct)}%`}
          </div>
        </div>
        <div className="pl-4 text-[10px] text-gray-500 tabular-nums leading-none">
          {current.display} {current.unit} / {max.display} {max.unit}
        </div>
      </div>
    );
  };

  return (
    <Card
      title={title}
      subtitle={subtitle}
      entityId={entityId}
      onTitleChange={onTitleChange}
      onJsonSave={onJsonSave}
      onCardDelete={onCardDelete}
      cardConfig={cardConfig}
      height="h-full"
      padding="px-2.5 py-2"
      hideHeader={true}
    >
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <CardIconFrame>
            <Wifi className="w-5 h-5 text-blue-400" />
          </CardIconFrame>
          <div className="min-w-0">
            <div className="text-white font-semibold truncate text-sm leading-tight">{title}</div>
            <div className="text-[11px] text-gray-400 truncate leading-none">{subtitle}</div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1 min-w-0">
            {statusBadge}
            {externalIp ? <div className="text-[10px] text-gray-500 tabular-nums truncate max-w-[9rem]">{externalIp}</div> : null}
          </div>
        </div>

        {/* Distribute extra height as spacing, without changing row/bar sizes */}
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 min-h-0" />
          <ThroughputRow icon={<ArrowDown className="w-3.5 h-3.5" />} pct={computed.dlPct} current={computed.dlFmt} max={computed.maxDlFmt} />
          <div className="flex-1 min-h-0" />
          <ThroughputRow icon={<ArrowUp className="w-3.5 h-3.5" />} pct={computed.ulPct} current={computed.ulFmt} max={computed.maxUlFmt} />
          <div className="flex-1 min-h-0" />
        </div>
      </div>
    </Card>
  );
};

export const NetworkStatusCard = memo(NetworkStatusCardComponent);

