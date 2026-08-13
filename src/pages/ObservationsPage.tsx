import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllObservations } from "../services/observationService";
import { FHIRObservation, VITAL_SIGNS } from "../types/fhir";
import NewObservationModal from "../components/NewObservationModal";
import systolic from "../../src/Images/systolic.png";
import thermometer from "../../src/Images/thermometer.png";
import heart from "../../src/Images/heart.png";
import diaphram from "../../src/Images/diaphram.png";
import balance from "../../src/Images/balance.png";

function getVitalDisplay(obs: FHIRObservation): string {
  return obs.code.coding[0]?.display ?? "Unknown";
}

function getVitalIcon(code: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    "8480-6": <img src={systolic} alt="Systolic" className="vitalIcons" />,
    "8462-4": <img src={systolic} alt="Systolic" className="vitalIcons" />,
    "8310-5": (
      <img src={thermometer} alt="Temperature" className="vitalIcons" />
    ),
    "29463-7": <img src={balance} alt="Balance" className="vitalIcons" />,
    "8867-4": <img src={heart} alt="heart" className="vitalIcons" />,
    "2708-6": <img src={diaphram} alt="Diaphragm" className="vitalIcons" />,
  };
  return icons[code] ?? "📊";
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ObservationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filterCode, setFilterCode] = useState("all");

  const {
    data: observations = [],
    isLoading,
    isError,
  } = useQuery<FHIRObservation[]>({
    queryKey: ["observations"],
    queryFn: getAllObservations,
  });

  const filtered = observations.filter((o) =>
    filterCode === "all" ? true : o.code?.coding?.[0]?.code === filterCode,
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Observations</div>
          <div className="page-sub">Vital signs across all patients</div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Record Vital
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Recorded</div>
          <div className="stat-value">{observations.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vital Types</div>
          <div className="stat-value">
            {new Set(observations.map((o) => o.code?.coding?.[0]?.code)).size}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Latest</div>
          <div
            className="stat-value"
            style={{ fontSize: "13px", marginTop: "8px" }}
          >
            {observations[0]
              ? formatDate(observations[0].effectiveDateTime)
              : "—"}
          </div>
        </div>
      </div>

      {/* Filter by vital type */}
      <div className="table-card">
        <div className="table-toolbar">
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Filter:</span>
          <button
            className={`filter-chip ${filterCode === "all" ? "filter-chip-active" : ""}`}
            onClick={() => setFilterCode("all")}
          >
            All
          </button>
          {VITAL_SIGNS.map((v) => (
            <button
              key={v.code}
              className={`filter-chip ${filterCode === v.code ? "filter-chip-active" : ""}`}
              onClick={() => setFilterCode(v.code)}
            >
              {getVitalIcon(v.code)} {v.display.split(" ")[0]}
            </button>
          ))}
          <span
            style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}
          >
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading && <div className="state-box">Loading observations...</div>}
        {isError && (
          <div className="state-box" style={{ color: "#dc2626" }}>
            Could not load observations. Is your FHIR server running?
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="state-box">
            No vitals recorded yet. Click "+ Record Vital" to start.
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Vital Sign</th>
                <th>LOINC Code</th>
                <th>Value</th>
                <th>Patient</th>
                <th>Encounter</th>
                <th>Recorded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((obs) => (
                <tr key={obs.id}>
                  <td>
                    <div className="cell-flex">
                      <span style={{ fontSize: "18px" }}>
                        {getVitalIcon(obs.code?.coding?.[0]?.code ?? "")}
                      </span>
                      {getVitalDisplay(obs)}
                    </div>
                  </td>
                  <td>
                    <code
                      style={{
                        fontSize: "11px",
                        background: "#f3f4f6",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {obs.code?.coding?.[0]?.code}
                    </code>
                  </td>
                  <td>
                    <strong>{obs.valueQuantity?.value}</strong>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginLeft: "4px",
                      }}
                    >
                      {obs.valueQuantity?.unit}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {obs.subject.display ?? obs.subject.reference.split("/")[1]}
                  </td>
                  <td style={{ fontSize: "12px", color: "#6b7280" }}>
                    {obs.encounter?.reference.split("/")[1] ?? "—"}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {formatDate(obs.effectiveDateTime)}
                  </td>
                  <td>
                    <span
                      className={`badge ${obs.status === "final" ? "badge-finished" : "badge-planned"}`}
                    >
                      {obs.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <NewObservationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
