import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMedicationRequest } from "../services/medicationService";
import { getPatients } from "../services/patientService";
import { getEncountersByPatient } from "../services/encounterService";
import { FHIRMedicationRequest, COMMON_MEDICATIONS } from "../types/fhir";
import { getPatientName } from "../pages/PatientsPage";

interface Props {
  onClose: () => void;
  patientId?: string;
  encounterId?: string;
}

const emptyForm = {
  patientId: "",
  patientDisplay: "",
  encounterId: "",
  medCode: "",
  medDisplay: "",
  dosage: "",
  requester: "",
  notes: "",
  intent: "order" as FHIRMedicationRequest["intent"],
  status: "active" as FHIRMedicationRequest["status"],
};

export default function NewMedicationModal({
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

  const { data: encounters = [] } = useQuery({
    queryKey: ["encounters", "patient", form.patientId],
    queryFn: () => getEncountersByPatient(form.patientId),
    enabled: !!form.patientId,
  });

  const mutation = useMutation({
    mutationFn: (med: Omit<FHIRMedicationRequest, "id">) =>
      createMedicationRequest(med),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      onClose();
    },
  });

  function validate() {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.patientId) e.patientId = "Required";
    if (!form.medCode) e.medCode = "Required";
    if (!form.dosage) e.dosage = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePatientChange(id: string) {
    const patient = patients.find((p) => p.id === id);
    setForm((prev) => ({
      ...prev,
      patientId: id,
      patientDisplay: patient ? getPatientName(patient) : "",
      encounterId: "",
    }));
  }

  function handleMedChange(code: string) {
    const med = COMMON_MEDICATIONS.find((m) => m.code === code);
    setForm((prev) => ({
      ...prev,
      medCode: code,
      medDisplay: med?.display ?? "",
    }));
  }

  function handleSubmit() {
    if (!validate()) return;

    const med: Omit<FHIRMedicationRequest, "id"> = {
      resourceType: "MedicationRequest",
      status: form.status,
      intent: form.intent,
      medicationCodeableConcept: {
        coding: [
          {
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            code: form.medCode,
            display: form.medDisplay,
          },
        ],
        text: form.medDisplay,
      },
      subject: {
        reference: `Patient/${form.patientId}`,
        display: form.patientDisplay,
      },
      ...(form.encounterId && {
        encounter: { reference: `Encounter/${form.encounterId}` },
      }),
      authoredOn: new Date().toISOString(),
      ...(form.requester && {
        requester: { display: form.requester },
      }),
      dosageInstruction: [{ text: form.dosage }],
      ...(form.notes && {
        note: [{ text: form.notes }],
      }),
    };

    mutation.mutate(med);
  }

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">New Prescription</div>
            <div className="modal-sub">
              Creates a FHIR MedicationRequest with RxNorm code
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

          {/* Encounter */}
          <div className="form-group">
            <label className="form-label">
              Encounter <span className="optional">optional</span>
            </label>
            <select
              className="form-input"
              value={form.encounterId}
              onChange={(e) => handleChange("encounterId", e.target.value)}
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

          {/* Medication */}
          <div className="form-group">
            <label className="form-label">Medication (RxNorm) *</label>
            <select
              className={`form-input ${errors.medCode ? "input-error" : ""}`}
              value={form.medCode}
              onChange={(e) => handleMedChange(e.target.value)}
            >
              <option value="">Select a medication...</option>
              {COMMON_MEDICATIONS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.display} — {m.form}
                </option>
              ))}
            </select>
            {form.medCode && (
              <div
                style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}
              >
                RxNorm code:{" "}
                <code
                  style={{
                    background: "#f3f4f6",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {form.medCode}
                </code>
              </div>
            )}
            {errors.medCode && (
              <span className="error-msg">{errors.medCode}</span>
            )}
          </div>

          {/* Intent + Status */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Intent</label>
              <select
                className="form-input"
                value={form.intent}
                onChange={(e) => handleChange("intent", e.target.value)}
              >
                <option value="order">Order (prescription)</option>
                <option value="proposal">Proposal (suggested)</option>
                <option value="plan">Plan (care plan)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dosage */}
          <div className="form-group">
            <label className="form-label">Dosage instructions *</label>
            <input
              className={`form-input ${errors.dosage ? "input-error" : ""}`}
              placeholder="Take one capsule three times daily after meals"
              value={form.dosage}
              onChange={(e) => handleChange("dosage", e.target.value)}
            />
            {errors.dosage && (
              <span className="error-msg">{errors.dosage}</span>
            )}
          </div>

          {/* Prescriber */}
          <div className="form-group">
            <label className="form-label">
              Prescriber <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="Dr. Ngozi Umeh"
              value={form.requester}
              onChange={(e) => handleChange("requester", e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">
              Notes <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="Patient is allergic to penicillin — use with caution"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          {/* Live FHIR preview */}
          <div className="fhir-info-box">
            <div className="fhir-info-title"> POST /MedicationRequest</div>
            <pre className="fhir-info-code">
              {JSON.stringify(
                {
                  resourceType: "MedicationRequest",
                  status: form.status,
                  intent: form.intent,
                  medicationCodeableConcept: {
                    coding: [
                      {
                        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                        code: form.medCode || "1049502",
                        display: form.medDisplay || "Amoxicillin 500mg",
                      },
                    ],
                  },
                  subject: {
                    reference: `Patient/${form.patientId || "1000"}`,
                  },
                  ...(form.encounterId && {
                    encounter: { reference: `Encounter/${form.encounterId}` },
                  }),
                  dosageInstruction: [
                    {
                      text: form.dosage || "Take one capsule three times daily",
                    },
                  ],
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
            {mutation.isPending ? "Saving to FHIR..." : "Create Prescription"}
          </button>
        </div>

        {mutation.isError && (
          <div className="mutation-error">
            Failed to save prescription. Is your FHIR server running?
          </div>
        )}
      </div>
    </>
  );
}
