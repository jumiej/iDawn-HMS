import { FHIRPatient } from "../types/fhir";
import { getPatientName } from "../pages/patientsPage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deactivatePatient,
  reactivatePatient,
} from "../services/patientService";

interface Props {
  patient: FHIRPatient;
  onClose: () => void;
  onEdit: (patient: FHIRPatient) => void;
}

export default function PatientDetail({ patient, onClose, onEdit }: Props) {
  const name = getPatientName(patient);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toLocaleUpperCase()
    .slice(0, 2);
  const phone = patient.telecom?.find((t) => t.system === "phone")?.value;
  const address = patient.address?.[0];
  const addressText = address
    ? `${address.line?.[0] ?? ""} ${address.city ?? ""} ${address.country ?? ""}`.trim()
    : "No address";

  const queryClient = useQueryClient();

  const isActive = patient.active !== false;

  const toggleMutation = useMutation({
    mutationFn: () =>
      isActive ? deactivatePatient(patient) : reactivatePatient(patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-panel-header">
        <span style={{ fontSize: "13px", fontWeight: 500 }}>
          Patient Detail
        </span>
        <button onClick={onClose} className="close-btn">
          ✕
        </button>
      </div>
      {/* Avatar + name */}
      <div className="detail-hero">
        <div className="avatar avatar-lg">{initials}</div>
        <div className="detail-hero-name">{name}</div>
        <div className="detail-hero-id">FHIR ID · {patient.id}</div>
        <span
          className={`badge ${patient.active === false ? "badge-inactive" : "badge-active"}`}
        >
          {patient.active === false ? "Inactive" : "Active"}
        </span>
      </div>
      {/* Action buttons — NEW */}
      <div className="detail-actions">
        <button
          className="btn-secondary btn-sm"
          onClick={() => onEdit(patient)}
        >
          Edit
        </button>
        <button
          className={`btn-sm ${isActive ? "btn-danger" : "btn-success"}`}
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
        >
          {toggleMutation.isPending
            ? "Updating..."
            : isActive
              ? "Deactivate"
              : "Reactivate"}
        </button>
      </div>
      {/* Demographics */}
      <div className="detail-section">
        <div className="detail-section-title">Demographics</div>
        <div className="detail-row">
          <span className="detail-key">Date of birth</span>
          <span className="detail-val">{patient.birthDate ?? "—"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Gender</span>
          <span className="detail-val" style={{ textTransform: "capitalize" }}>
            {patient.gender ?? "—"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Phone</span>
          <span className="detail-val">{phone}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Address</span>
          <span className="detail-val">{addressText}</span>
        </div>
      </div>
      {/* FHIR Resource fields */}
      <div className="detail-section">
        <div className="detail-section-title">FHIR Meta</div>
        <div className="detail-row">
          <span className="detail-key">Resource type</span>
          <span className="detail-val" style={{ fontFamily: "monospace" }}>
            Patient
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Version</span>
          <span className="detail-val" style={{ fontFamily: "monospace" }}>
            {patient.meta?.versionId ?? "—"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Last updated</span>
          <span className="detail-val">
            {patient.meta?.lastUpdated
              ? new Date(patient.meta.lastUpdated).toLocaleString()
              : "—"}
          </span>
        </div>
      </div>

      {/* Raw FHIR JSON */}
      <div className="detail-section">
        <div className="detail-section-title">Raw FHIR JSON</div>
        <pre className="fhir-json-box">{JSON.stringify(patient, null, 2)}</pre>
      </div>
    </div>
  );
}
