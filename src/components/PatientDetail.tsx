import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deactivatePatient,
  reactivatePatient,
} from "../services/patientService";
import { getEncountersByPatient } from "../services/encounterService";
import {
  FHIREncounter,
  FHIRPatient,
  FHIRObservation,
  FHIRMedicationRequest,
  FHIRAppointment,
} from "../types/fhir";
import { getPatientName } from "../pages/PatientsPage";
import { getObservationsByPatient } from "../services/observationService";
import { getMedicationsByPatient } from "../services/medicationService";
import { getAppointmentsByPatient } from "../services/appointmentService";
import UsersRounded from "../Images/User.svg";
import clock from "../Images/Alarm.svg";
import linearCalendar from "../../src/Images/linearCalendar.svg";
import linearPill from "../../src/Images/linearPill.svg";

interface Props {
  patient: FHIRPatient;
  onClose: () => void;
  onEdit: (patient: FHIRPatient) => void;
}

type Tab =
  | "details"
  | "encounters"
  | "observations"
  | "medications"
  | "appointments";
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

function StatusBadge({ status }: { status: FHIREncounter["status"] }) {
  const map: Record<FHIREncounter["status"], string> = {
    finished: "badge-finished",
    "in-progress": "badge-inprogress",
    planned: "badge-planned",
    cancelled: "badge-cancelled",
  };
  return <span className={`badge ${map[status]}`}>{status}</span>;
}

export default function PatientDetail({ patient, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("details");

  const name = getPatientName(patient);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const phone =
    patient.telecom?.find((t) => t.system === "phone")?.value ?? "—";
  const address = patient.address?.[0];
  const addressText = address
    ? `${address.line?.join(", ")}, ${address.city}, ${address.country}`
    : "—";

  const queryClient = useQueryClient();
  const isActive = patient.active !== false;

  const toggleMutation = useMutation({
    mutationFn: () =>
      isActive ? deactivatePatient(patient) : reactivatePatient(patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  // Fetch encounters only when the encounters tab is active
  const { data: encounters = [], isLoading: loadingEncounters } = useQuery<
    FHIREncounter[]
  >({
    queryKey: ["encounters", "patient", patient.id],
    queryFn: () => getEncountersByPatient(patient.id!),
    enabled: activeTab === "encounters" && !!patient.id,
  });

  const { data: observations = [], isLoading: loadingObs } = useQuery<
    FHIRObservation[]
  >({
    queryKey: ["observations", "patient", patient.id],
    queryFn: () => getObservationsByPatient(patient.id!),
    enabled: activeTab === "observations" && !!patient.id,
  });

  const { data: medications = [], isLoading: loadingMeds } = useQuery<
    FHIRMedicationRequest[]
  >({
    queryKey: ["medications", "patient", patient.id],
    queryFn: () => getMedicationsByPatient(patient.id!),
    enabled: activeTab === "medications" && !!patient.id,
  });

  const { data: appointments = [], isLoading: loadingApts } = useQuery<
    FHIRAppointment[]
  >({
    queryKey: ["appointments", "patient", patient.id],
    queryFn: () => getAppointmentsByPatient(patient.id!),
    enabled: activeTab === "appointments" && !!patient.id,
  });

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-panel-header">
        <span style={{ fontSize: "13px", fontWeight: 500 }}>
          Patient Detail
        </span>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <div className="avatar avatar-lg">{initials}</div>
        <div className="detail-hero-name">{name}</div>
        <div className="detail-hero-id">FHIR ID · {patient.id}</div>
        <span
          className={`badge ${isActive ? "badge-active" : "badge-inactive"}`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Action buttons */}
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

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === "details" ? "detail-tab-active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          className={`detail-tab ${activeTab === "encounters" ? "detail-tab-active" : ""}`}
          onClick={() => setActiveTab("encounters")}
        >
          Encounters
          {encounters.length > 0 && (
            <span className="tab-count">{encounters.length}</span>
          )}
        </button>
        <button
          className={`detail-tab ${activeTab === "observations" ? "detail-tab-active" : ""}`}
          onClick={() => setActiveTab("observations")}
        >
          Vitals
          {observations.length > 0 && (
            <span className="tab-count">{observations.length}</span>
          )}
        </button>
        <button
          className={`detail-tab ${activeTab === "medications" ? "detail-tab-active" : ""}`}
          onClick={() => setActiveTab("medications")}
        >
          Meds
          {medications.length > 0 && (
            <span className="tab-count">{medications.length}</span>
          )}
        </button>
        <button
          className={`detail-tab ${activeTab === "appointments" ? "detail-tab-active" : ""}`}
          onClick={() => setActiveTab("appointments")}
        >
          Apts
          {appointments.length > 0 && (
            <span className="tab-count">{appointments.length}</span>
          )}
        </button>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <>
          <div className="detail-section">
            <div className="detail-section-title">Demographics</div>
            <div className="detail-row">
              <span className="detail-key">Date of birth</span>
              <span className="detail-val">{patient.birthDate ?? "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Gender</span>
              <span
                className="detail-val"
                style={{ textTransform: "capitalize" }}
              >
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

          <div className="detail-section">
            <div className="detail-section-title">Raw FHIR JSON</div>
            <pre className="fhir-json-box">
              {JSON.stringify(patient, null, 2)}
            </pre>
          </div>
        </>
      )}

      {/* Tab: Encounters */}
      {activeTab === "encounters" && (
        <div className="detail-section">
          <div className="detail-section-title">Clinical visits for {name}</div>

          {loadingEncounters && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Loading encounters...
            </div>
          )}

          {!loadingEncounters && encounters.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              No encounters found for this patient.
            </div>
          )}

          {!loadingEncounters &&
            encounters.map((enc) => (
              <div key={enc.id} className="enc-list-item">
                <div className="enc-list-top">
                  <span className="enc-list-type">{enc.class?.display}</span>
                  <StatusBadge status={enc.status} />
                </div>
                {enc.reasonCode?.[0]?.text && (
                  <div className="enc-list-reason">
                    {enc.reasonCode[0].text}
                  </div>
                )}
                <div className="enc-list-meta">
                  {enc.participant?.[0]?.individual?.display && (
                    <span>
                      <img
                        src={UsersRounded}
                        alt="UsersRounded"
                        className="linearIcons"
                      />{" "}
                      {enc.participant[0].individual.display}
                    </span>
                  )}
                  <span>
                    <img src={clock} alt="Clock" className="linearIcons" />{" "}
                    {formatDate(enc.period?.start)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tab: observation */}
      {activeTab === "observations" && (
        <div className="detail-section">
          <div className="detail-section-title">Vital signs for {name}</div>

          {loadingObs && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Loading vitals...
            </div>
          )}

          {!loadingObs && observations.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              No vitals recorded for this patient.
            </div>
          )}

          {!loadingObs &&
            observations.map((obs) => (
              <div key={obs.id} className="enc-list-item">
                <div className="enc-list-top">
                  <span className="enc-list-type">
                    {obs.code?.coding?.[0]?.display ?? "Unknown"}
                  </span>
                  <span>
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
                  </span>
                </div>
                <div className="enc-list-meta">
                  <code
                    style={{
                      fontSize: "11px",
                      background: "#f3f4f6",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    {obs.code?.coding?.[0]?.code}
                  </code>
                  <span>
                    <img src={clock} alt="Clock" className="linearIcons" />{" "}
                    {formatDate(obs.effectiveDateTime)}
                  </span>
                  <span
                    className={`badge ${obs.status === "final" ? "badge-finished" : "badge-planned"}`}
                  >
                    {obs.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tab: medications */}
      {activeTab === "medications" && (
        <div className="detail-section">
          <div className="detail-section-title">Prescriptions for {name}</div>

          {loadingMeds && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Loading medications...
            </div>
          )}

          {!loadingMeds && medications.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              No prescriptions for this patient.
            </div>
          )}

          {!loadingMeds &&
            medications.map((med) => (
              <div key={med.id} className="enc-list-item">
                <div className="enc-list-top">
                  <span className="enc-list-type">
                    <img src={linearPill} alt="Pill" className="linearIcons" />
                    {med.medicationCodeableConcept?.coding?.[0]?.display}
                  </span>
                  <span
                    className={`badge ${
                      med.status === "active"
                        ? "badge-inprogress"
                        : med.status === "completed"
                          ? "badge-finished"
                          : "badge-cancelled"
                    }`}
                  >
                    {med.status}
                  </span>
                </div>
                <div className="enc-list-reason">
                  {med.dosageInstruction?.[0]?.text ?? "—"}
                </div>
                <div className="enc-list-meta">
                  {med.requester?.display && (
                    <span>
                      {" "}
                      <img
                        src={UsersRounded}
                        alt="UsersRounded"
                        className="linearIcons"
                      />
                      {med.requester.display}
                    </span>
                  )}
                  <code
                    style={{
                      fontSize: "11px",
                      background: "#f3f4f6",
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    {med.medicationCodeableConcept?.coding?.[0]?.code}
                  </code>
                </div>
                {med.note?.[0]?.text && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#d97706",
                      marginTop: "4px",
                      background: "#fffbeb",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ⚠️ {med.note[0].text}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Tab: appointments */}
      {activeTab === "appointments" && (
        <div className="detail-section">
          <div className="detail-section-title">Appointments for {name}</div>

          {loadingApts && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Loading appointments...
            </div>
          )}

          {!loadingApts && appointments.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              No appointments for this patient.
            </div>
          )}

          {!loadingApts &&
            appointments.map((apt) => (
              <div key={apt.id} className="enc-list-item">
                <div className="enc-list-top">
                  <span className="enc-list-type">
                    <img
                      src={linearCalendar}
                      alt="Calendar"
                      className="linearIcons"
                    />
                    {apt.serviceType?.[0]?.text ?? "Appointment"}
                  </span>
                  <span
                    className={`badge ${
                      apt.status === "booked"
                        ? "badge-planned"
                        : apt.status === "fulfilled"
                          ? "badge-finished"
                          : apt.status === "arrived"
                            ? "badge-inprogress"
                            : apt.status === "cancelled"
                              ? "badge-cancelled"
                              : "badge-inactive"
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
                {apt.description && (
                  <div className="enc-list-reason">{apt.description}</div>
                )}
                <div className="enc-list-meta">
                  <span>
                    <img src={clock} alt="Clock" className="linearIcons" />{" "}
                    {formatDate(apt.start)}
                  </span>
                  {apt.participant.find(
                    (p) => !p.actor?.reference?.startsWith("Patient/"),
                  )?.actor?.display && (
                    <span>
                      <img
                        src={UsersRounded}
                        alt="UsersRounded"
                        className="linearIcons"
                      />{" "}
                      {
                        apt.participant.find(
                          (p) => !p.actor?.reference?.startsWith("Patient/"),
                        )?.actor?.display
                      }
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
