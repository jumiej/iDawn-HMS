import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FHIREncounter } from "../types/fhir";
import { getPatients } from "../services/patientService";

import { getPatientName } from "../pages/patientsPage";
import { createEncounter } from "./encounterService";

interface Props {
  onClose: () => void;
}

const emptyForm = {
  patientId: "",
  patientDisplay: "",
  status: "planned" as FHIREncounter["status"],
  classCode: "AMB",
  classDisplay: "Ambulatory (Outpatient)",
  practitioner: "",
  reasonText: "",
  start: "",
  end: "",
};

export default function NewEncounterModal({ onClose }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof emptyForm, string>>
  >({});

  const queryClient = useQueryClient();

  // Fetch patients for the dropdown
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients, // This function fetches patients from the FHIR server
  });

  function handlePatientChange(patientId: string) {
    const patient = patients.find((p) => p.id === patientId);
    setForm((prev) => ({
      ...prev,
      patientId,
      patientDisplay: patient ? getPatientName(patient) : "",
    }));
    if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: "" }));
  }

  const handleChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const ENCOUNTER_CLASSES = [
    { code: "AMB", display: "Ambulatory (Outpatient)" },
    { code: "EMER", display: "Emergency" },
    { code: "IMP", display: "Inpatient" },
    { code: "VR", display: "Virtual / Telemedicine" },
  ];

  function handleClassChange(code: string) {
    const cls = ENCOUNTER_CLASSES.find((c) => c.code === code);
    setForm((prev) => ({
      ...prev,
      classCode: code,
      classDisplay: cls?.display ?? code,
    }));
  }

  const mutation = useMutation({
    mutationFn: (encounter: Omit<FHIREncounter, "id">) =>
      createEncounter(encounter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      onClose();
    },
  });

  const validate = () => {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.patientId) e.patientId = "Patient is required";
    if (!form.status) e.status = "Status is required";
    if (!form.classCode) e.classCode = "Class is required";
    if (!form.start) e.start = "Start date & time is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  function handleSubmit() {
    if (!validate()) return;

    const encounter: Omit<FHIREncounter, "id"> = {
      resourceType: "Encounter",
      status: form.status,
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: form.classCode,
        display: form.classDisplay,
      },
      subject: {
        reference: `Patient/${form.patientId}`,
        display: form.patientDisplay,
      },
      ...(form.practitioner && {
        participant: [
          {
            individual: { display: form.practitioner },
          },
        ],
      }),
      period: {
        start: new Date(form.start).toISOString(),
        ...(form.end && { end: new Date(form.end).toISOString() }),
      },
      ...(form.reasonText && {
        reasonCode: [{ text: form.reasonText }],
      }),
    };
    mutation.mutate(encounter);
  }

  // Build the live FHIR preview
  const fhirPreview = {
    resourceType: "Encounter",
    status: form.status,
    class: {
      code: form.classCode || "AMB",
      display: form.classDisplay || "Ambulatory (Outpatient)",
    },
    subject: {
      reference: `Patient/${form.patientId} || "1000"`,
      display: form.patientDisplay || form.patientId,
    },
    ...(form.practitioner && {
      participant: [
        {
          individual: { display: form.practitioner },
        },
      ],
    }),
    period: {
      start: form.start || new Date().toISOString(),
      ...(form.end && { end: form.end }),
    },
    ...(form.reasonText && { reasonCode: [{ text: form.reasonText }] }),
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">New Encounter</div>
            <div className="modal-sub">
              Creates a FHIR Encounter resource linked to a patient
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Patient selector */}
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              className={`form-input ${errors.patientId ? "input-error" : ""}`}
              value={form.patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              disabled={loadingPatients}
            >
              <option value="">
                {loadingPatients
                  ? "Loading patients..."
                  : "Select a patient..."}
              </option>
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

          {/* Status + Class */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className={`form-input ${errors.status ? "input-error" : ""}`}
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="finished">Finished</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && (
                <span className="error-msg">{errors.status}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Class *</label>
              <select
                className={`form-input ${errors.classCode ? "input-error" : ""}`}
                value={form.classCode}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                {ENCOUNTER_CLASSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.display}
                  </option>
                ))}
              </select>
              {errors.classCode && (
                <span className="error-msg">{errors.classCode}</span>
              )}
            </div>
          </div>

          {/* Practitioner */}
          <div className="form-group">
            <label className="form-label">
              Practitioner <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="Dr. Ngozi Umeh"
              value={form.practitioner}
              onChange={(e) => handleChange("practitioner", e.target.value)}
            />
          </div>

          {/* Period */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start date & time *</label>
              <input
                type="datetime-local"
                className={`form-input ${errors.start ? "input-error" : ""}`}
                value={form.start}
                onChange={(e) => handleChange("start", e.target.value)}
              />
              {errors.start && (
                <span className="error-msg">{errors.start}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">
                End date & time <span className="optional">optional</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.end}
                onChange={(e) => handleChange("end", e.target.value)}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">
              Reason for visit <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="Routine checkup, chest pain, follow-up..."
              value={form.reasonText}
              onChange={(e) => handleChange("reasonText", e.target.value)}
            />
          </div>

          {/* Live FHIR preview */}
          <div className="fhir-info-box">
            <div className="fhir-info-title"> POST /Encounter</div>
            <pre className="fhir-info-code">
              {JSON.stringify(fhirPreview, null, 2)}
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
            {mutation.isPending ? "Saving to FHIR..." : "Create Encounter"}
          </button>
        </div>

        {mutation.isError && (
          <div className="mutation-error">
            Failed to create encounter. Is your FHIR server running?
          </div>
        )}
      </div>
    </>
  );
}
