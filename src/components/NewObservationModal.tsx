import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createObservation } from "../services/observationService";
import { getPatients } from "../services/patientService";
import { getEncountersByPatient } from "../services/encounterService";
import { FHIRObservation, VITAL_SIGNS } from "../types/fhir";
import { getPatientName } from "../pages/PatientsPage";

interface Props {
  onClose: () => void;
  patientId?: string; // optional — pre-select patient if opened from PatientDetail
  encounterId?: string; // optional — pre-select encounter if opened from EncounterDetail
}

const emptyForm = {
  patientId: "",
  patientDisplay: "",
  encounterId: "",
  vitalCode: "",
  vitalDisplay: "",
  vitalUnit: "",
  value: "",
  effectiveDateTime: new Date().toISOString().slice(0, 16), // default to now
  status: "final" as FHIRObservation["status"],
};

export default function NewObservationModal({
  onClose,
  patientId,
  encounterId,
}: Props) {
  const [form, setForm] = useState({
    ...emptyForm,
    patientId: patientId ?? "",
    encounterId: encounterId ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof emptyForm, string>>
  >({});

  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  // Only fetch encounters when a patient is selected
  const { data: encounters = [] } = useQuery({
    queryKey: ["encounters", "patient", form.patientId],
    queryFn: () => getEncountersByPatient(form.patientId),
    enabled: !!form.patientId,
  });

  const mutation = useMutation({
    mutationFn: (obs: Omit<FHIRObservation, "id">) => createObservation(obs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      onClose();
    },
  });

  function validate() {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.patientId) e.patientId = "Required";
    if (!form.vitalCode) e.vitalCode = "Required";
    if (!form.value) e.value = "Required";
    if (isNaN(Number(form.value))) e.value = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePatientChange(id: string) {
    const patient = patients.find((p) => p.id === id);
    setForm((prev) => ({
      ...prev,
      patientId: id,
      patientDisplay: patient ? getPatientName(patient) : "",
      encounterId: "", // reset encounter when patient changes
    }));
  }

  function handleVitalChange(code: string) {
    const vital = VITAL_SIGNS.find((v) => v.code === code);
    setForm((prev) => ({
      ...prev,
      vitalCode: code,
      vitalDisplay: vital?.display ?? "",
      vitalUnit: vital?.unit ?? "",
    }));
  }

  function handleSubmit() {
    if (!validate()) return;

    const vital = VITAL_SIGNS.find((v) => v.code === form.vitalCode);

    const obs: Omit<FHIRObservation, "id"> = {
      resourceType: "Observation",
      status: form.status,
      category: [
        {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: form.vitalCode,
            display: form.vitalDisplay,
          },
        ],
      },
      subject: {
        reference: `Patient/${form.patientId}`,
        display: form.patientDisplay,
      },
      ...(form.encounterId && {
        encounter: { reference: `Encounter/${form.encounterId}` },
      }),
      effectiveDateTime: new Date(form.effectiveDateTime).toISOString(),
      valueQuantity: {
        value: Number(form.value),
        unit: form.vitalUnit,
        system: "http://unitsofmeasure.org",
        code: vital?.unit ?? "",
      },
    };

    mutation.mutate(obs);
  }

  const selectedVital = VITAL_SIGNS.find((v) => v.code === form.vitalCode);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Record Vital Sign</div>
            <div className="modal-sub">
              Creates a FHIR Observation resource with a LOINC code
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Patient */}
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              className={`form-input ${errors.patientId ? "input-error" : ""}`}
              value={form.patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              disabled={!!patientId}
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPatientName(p)} — ID: {p.id}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <span className="error-msg">{errors.patientId}</span>
            )}
          </div>

          {/* Encounter — optional */}
          <div className="form-group">
            <label className="form-label">
              Encounter{" "}
              <span className="optional">
                optional — links vitals to a visit
              </span>
            </label>
            <select
              className="form-input"
              value={form.encounterId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, encounterId: e.target.value }))
              }
              disabled={!form.patientId || !!encounterId}
            >
              <option value="">No encounter selected</option>
              {encounters.map((enc) => (
                <option key={enc.id} value={enc.id}>
                  {enc.class?.display} —{" "}
                  {enc.reasonCode?.[0]?.text ?? enc.status} ({enc.id})
                </option>
              ))}
            </select>
          </div>

          {/* Vital sign selector */}
          <div className="form-group">
            <label className="form-label">Vital Sign (LOINC) *</label>
            <select
              className={`form-input ${errors.vitalCode ? "input-error" : ""}`}
              value={form.vitalCode}
              onChange={(e) => handleVitalChange(e.target.value)}
            >
              <option value="">Select a vital sign...</option>
              {VITAL_SIGNS.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.display} ({v.unit})
                </option>
              ))}
            </select>
            {form.vitalCode && (
              <div
                style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}
              >
                LOINC code:{" "}
                <code
                  style={{
                    background: "#f3f4f6",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {form.vitalCode}
                </code>
              </div>
            )}
            {errors.vitalCode && (
              <span className="error-msg">{errors.vitalCode}</span>
            )}
          </div>

          {/* Value + datetime */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Value *{" "}
                {form.vitalUnit && (
                  <span className="optional">in {form.vitalUnit}</span>
                )}
              </label>
              <input
                className={`form-input ${errors.value ? "input-error" : ""}`}
                placeholder={selectedVital?.placeholder ?? "0"}
                value={form.value}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, value: e.target.value }))
                }
                type="number"
                step="0.1"
              />
              {errors.value && (
                <span className="error-msg">{errors.value}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Date & time *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.effectiveDateTime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    effectiveDateTime: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as FHIRObservation["status"],
                }))
              }
            >
              <option value="final">Final</option>
              <option value="preliminary">Preliminary</option>
              <option value="amended">Amended</option>
            </select>
          </div>

          {/* Live FHIR preview */}
          <div className="fhir-info-box">
            <div className="fhir-info-title"> POST /Observation</div>
            <pre className="fhir-info-code">
              {JSON.stringify(
                {
                  resourceType: "Observation",
                  status: form.status,
                  category: [{ coding: [{ code: "vital-signs" }] }],
                  code: {
                    coding: [
                      {
                        system: "http://loinc.org",
                        code: form.vitalCode || "8310-5",
                        display: form.vitalDisplay || "Body Temperature",
                      },
                    ],
                  },
                  subject: { reference: `Patient/${form.patientId || "1000"}` },
                  ...(form.encounterId && {
                    encounter: { reference: `Encounter/${form.encounterId}` },
                  }),
                  effectiveDateTime: form.effectiveDateTime
                    ? new Date(form.effectiveDateTime).toISOString()
                    : new Date().toISOString(),
                  valueQuantity: {
                    value: Number(form.value) || 36.6,
                    unit: form.vitalUnit || "°C",
                  },
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving to FHIR..." : "Record Vital"}
          </button>
        </div>

        {mutation.isError && (
          <div className="mutation-error">
            Failed to save observation. Is your FHIR server running?
          </div>
        )}
      </div>
    </>
  );
}
