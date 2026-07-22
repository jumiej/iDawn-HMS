import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FHIREncounter } from "../types/fhir";
import { getAllEncounters } from "../services/encounterService";
import NewEncounterModal from "../services/newEncounterModal";
import EncounterDetail from "../components/encounterDetails";

export default function EncountersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  function statusBadgeClass(status: FHIREncounter["status"]): string {
    switch (status) {
      case "finished":
        return "badge-finished";
      case "in-progress":
        return "badge-inprogress";
      case "planned":
        return "badge-planned";
      case "cancelled":
        return "badge-cancelled";
      default:
        return "badge-inactive";
    }
  }

  function formatDate(iso?: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const {
    data: encounters = [],
    isLoading,
    isError,
  } = useQuery<FHIREncounter[]>({
    queryKey: ["encounters"],
    queryFn: getAllEncounters,
  });

  const filtered = encounters.filter((e) =>
    statusFilter === "all" ? true : e.status === statusFilter,
  );

  const counts = {
    finished: filtered.filter((e) => e.status === "finished").length,
    inProgress: filtered.filter((e) => e.status === "in-progress").length,
    planned: filtered.filter((e) => e.status === "planned").length,
  };

  return (
    <div className="page-with-detail">
      <div className="page-body">
        <div className="page-header">
          <div>
            <div className="page-title">Encounters</div>
            <div className="page-sub">
              All clinical visits across all patients
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setShowModal(true);
            }}
          >
            + New Encounter
          </button>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{encounters.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: "#d97706" }}>
              {counts.inProgress}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Finished</div>
            <div className="stat-value" style={{ color: "#16a34a" }}>
              {counts.finished}
            </div>
          </div>
        </div>
        <div className="table-card">
          <div className="table-toolbar">
            <span style={{ fontSize: "12px", color: "#6b7280" }}>Filter:</span>
            {["all", "planned", "in-progress", "finished", "cancelled"].map(
              (s) => (
                <button
                  key={s}
                  className={`filter-chip ${statusFilter === s ? "filter-chip-active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All" : s}
                </button>
              ),
            )}
            <span
              style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}
            >
              {filtered.length} encounter{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading && (
            <div className="state-box">
              Loading encounters from FHIR server...
            </div>
          )}
          {isError && (
            <div className="state-box" style={{ color: "#dc2626" }}>
              Could not load encounters. Is your FHIR server running?
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="state-box">
              No encounters found. Create one to get started.
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Practitioner</th>
                  <th>Start</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((enc) => (
                  <tr
                    key={enc.id}
                    className={selectedId === enc.id ? "selected" : ""}
                    onClick={() => setSelectedId(enc.id ?? null)}
                  >
                    <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                      {enc.subject.display ??
                        enc.subject.reference.split("/")[1]}
                    </td>
                    <td>{enc.class.display}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(enc.status)}`}>
                        {enc.status}
                      </span>
                    </td>
                    <td>{enc.participant?.[0]?.individual?.display ?? "—"}</td>
                    <td style={{ fontSize: "12px" }}>
                      {formatDate(enc.period?.start)}
                    </td>
                    <td style={{ fontSize: "12px", color: "#6b7280" }}>
                      {enc.reasonCode?.[0]?.text ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selectedId && (
        <EncounterDetail
          encounter={encounters.find((e) => e.id === selectedId)!}
          onClose={() => setSelectedId(null)}
        />
      )}
      {showModal && <NewEncounterModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
