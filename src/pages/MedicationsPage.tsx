import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllMedications,
  updateMedicationRequest,
} from "../services/medicationService";
import { FHIRMedicationRequest } from "../types/fhir";
import NewMedicationModal from "../components/NewMedicationModal";
import linearPill from "../../src/Images/linearPill.svg";

function statusBadgeClass(status: FHIRMedicationRequest["status"]): string {
  switch (status) {
    case "active":
      return "badge-inprogress";
    case "completed":
      return "badge-finished";
    case "cancelled":
      return "badge-cancelled";
    case "draft":
      return "badge-planned";
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
  });
}

export default function MedicationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const {
    data: medications = [],
    isLoading,
    isError,
  } = useQuery<FHIRMedicationRequest[]>({
    queryKey: ["medications"],
    queryFn: getAllMedications,
  });

  const completeMutation = useMutation({
    mutationFn: (med: FHIRMedicationRequest) =>
      updateMedicationRequest(med.id!, { ...med, status: "completed" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["medications"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (med: FHIRMedicationRequest) =>
      updateMedicationRequest(med.id!, { ...med, status: "cancelled" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["medications"] }),
  });

  const filtered = medications.filter((m) =>
    statusFilter === "all" ? true : m.status === statusFilter,
  );

  const counts = {
    active: medications.filter((m) => m.status === "active").length,
    completed: medications.filter((m) => m.status === "completed").length,
    cancelled: medications.filter((m) => m.status === "cancelled").length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Medications</div>
          <div className="page-sub">Prescriptions across all patients</div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Prescription
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: "#d97706" }}>
            {counts.active}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>
            {counts.completed}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{medications.length}</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Filter:</span>
          {["all", "active", "completed", "cancelled", "draft"].map((s) => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? "filter-chip-active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
          <span
            style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}
          >
            {filtered.length} prescription{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading && <div className="state-box">Loading medications...</div>}
        {isError && (
          <div className="state-box" style={{ color: "#dc2626" }}>
            Could not load medications. Is your FHIR server running?
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="state-box">
            No prescriptions found. Click "+ New Prescription" to start.
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>RxNorm</th>
                <th>Patient</th>
                <th>Dosage</th>
                <th>Prescriber</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((med) => (
                <tr key={med.id}>
                  <td>
                    <div className="cell-flex">
                      <img
                        src={linearPill}
                        alt="Pill"
                        className="linearIcons"
                      />
                      {med.medicationCodeableConcept?.coding?.[0]?.display}
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
                      {med.medicationCodeableConcept?.coding?.[0]?.code}
                    </code>
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {med.subject?.display ?? med.subject?.reference?.split("/")[1]}
                  </td>
                  <td style={{ fontSize: "12px", maxWidth: "180px" }}>
                    {med.dosageInstruction?.[0]?.text ?? "—"}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {med.requester?.display ?? "—"}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {formatDate(med.authoredOn)}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(med.status)}`}>
                      {med.status}
                    </span>
                  </td>
                  <td>
                    {med.status === "active" && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="btn-sm btn-success"
                          style={{
                            flex: "none",
                            padding: "3px 8px",
                            fontSize: "11px",
                          }}
                          onClick={() => completeMutation.mutate(med)}
                          disabled={completeMutation.isPending}
                        >
                          ✓ Complete
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          style={{
                            flex: "none",
                            padding: "3px 8px",
                            fontSize: "11px",
                          }}
                          onClick={() => cancelMutation.mutate(med)}
                          disabled={cancelMutation.isPending}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <NewMedicationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
