import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEncounter } from "../services/encounterService";
import { FHIREncounter } from "../types/fhir";

interface Props {
  encounter: FHIREncounter;
  onClose: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: FHIREncounter["status"] }) {
  const map: Record<FHIREncounter["status"], string> = {
    finished: "badge-finished",
    "in-progress": "badge-inprogress",
    planned: "badge-planned",
    cancelled: "badge-cancelled",
  };
  return <span className={`badge ${map[status]}`}>{status}</span>;
}

export default function EncounterDetail({ encounter, onClose }: Props) {
  const queryClient = useQueryClient();

  // Finish encounter — moves status from in-progress → finished
  const finishMutation = useMutation({
    mutationFn: () =>
      updateEncounter(encounter.id!, {
        ...encounter,
        status: "finished",
        period: {
          ...encounter.period,
          start: encounter.period?.start ?? new Date().toISOString(),
          end: new Date().toISOString(),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      updateEncounter(encounter.id!, {
        ...encounter,
        status: "cancelled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
    },
  });

  const isFinished = encounter.status === "finished";
  const isCancelled = encounter.status === "cancelled";
  const isLocked = isFinished || isCancelled;

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-panel-header">
        <span style={{ fontSize: "13px", fontWeight: 500 }}>
          Encounter Detail
        </span>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div
          className="avatar avatar-lg"
          style={{ background: "#dbeafe", color: "#2563eb" }}
        >
          {encounter.class.code}
        </div>
        <div className="detail-hero-name">{encounter.class.display}</div>
        <div className="detail-hero-id">FHIR ID · {encounter.id}</div>
        <StatusBadge status={encounter.status} />
      </div>

      {/* Action buttons */}
      {!isLocked && (
        <div className="detail-actions">
          {encounter.status === "in-progress" && (
            <button
              className="btn-sm btn-success"
              onClick={() => finishMutation.mutate()}
              disabled={finishMutation.isPending}
            >
              {finishMutation.isPending ? "Updating..." : "✓ Finish"}
            </button>
          )}
          {encounter.status === "planned" && (
            <button
              className="btn-sm btn-success"
              onClick={() =>
                updateEncounter(encounter.id!, {
                  ...encounter,
                  status: "in-progress",
                }).then(() =>
                  queryClient.invalidateQueries({ queryKey: ["encounters"] }),
                )
              }
            >
              ▶ Start
            </button>
          )}
          <button
            className="btn-sm btn-danger"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? "Cancelling..." : "✕ Cancel"}
          </button>
        </div>
      )}

      {isLocked && (
        <div
          style={{
            padding: "10px 16px",
            fontSize: "12px",
            color: "#6b7280",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          {isFinished
            ? "✓ This encounter is complete."
            : "✕ This encounter was cancelled."}
        </div>
      )}

      {/* Patient */}
      <div className="detail-section">
        <div className="detail-section-title">Patient</div>
        <div className="detail-row">
          <span className="detail-key">Reference</span>
          <span
            className="detail-val"
            style={{ fontFamily: "monospace", fontSize: "11px" }}
          >
            {encounter.subject.reference}
          </span>
        </div>
        {encounter.subject.display && (
          <div className="detail-row">
            <span className="detail-key">Name</span>
            <span className="detail-val">{encounter.subject.display}</span>
          </div>
        )}
      </div>

      {/* Encounter info */}
      <div className="detail-section">
        <div className="detail-section-title">Visit Details</div>
        <div className="detail-row">
          <span className="detail-key">Class</span>
          <span className="detail-val">{encounter.class.display}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Status</span>
          <span className="detail-val">
            <StatusBadge status={encounter.status} />
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Practitioner</span>
          <span className="detail-val">
            {encounter.participant?.[0]?.individual?.display ?? "—"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Reason</span>
          <span className="detail-val">
            {encounter.reasonCode?.[0]?.text ?? "—"}
          </span>
        </div>
      </div>

      {/* Period */}
      <div className="detail-section">
        <div className="detail-section-title">Period</div>
        <div className="detail-row">
          <span className="detail-key">Start</span>
          <span className="detail-val">
            {formatDate(encounter.period?.start)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">End</span>
          <span className="detail-val">
            {formatDate(encounter.period?.end)}
          </span>
        </div>
      </div>

      {/* FHIR Meta */}
      <div className="detail-section">
        <div className="detail-section-title">FHIR Meta</div>
        <div className="detail-row">
          <span className="detail-key">Resource type</span>
          <span className="detail-val" style={{ fontFamily: "monospace" }}>
            Encounter
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Version</span>
          <span className="detail-val" style={{ fontFamily: "monospace" }}>
            {encounter.meta?.versionId ?? "—"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Last updated</span>
          <span className="detail-val">
            {encounter.meta?.lastUpdated
              ? new Date(encounter.meta.lastUpdated).toLocaleString()
              : "—"}
          </span>
        </div>
      </div>

      {/* Raw FHIR JSON */}
      <div className="detail-section">
        <div className="detail-section-title">Raw FHIR JSON</div>
        <pre className="fhir-json-box">
          {JSON.stringify(encounter, null, 2)}
        </pre>
      </div>
    </div>
  );
}
