import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAppointment } from "../services/appointmentService";
import { getPatients } from "../services/patientService";
import { FHIRAppointment, SERVICE_TYPES } from "../types/fhir";
import { getPatientName } from "../pages/PatientsPage";

interface Props {
  onClose: () => void;
  patientId?: string;
}

const emptyForm = {
  patientId: "",
  patientDisplay: "",
  practitioner: "",
  serviceCode: "124",
  serviceDisplay: "General Practice",
  description: "",
  start: "",
  end: "",
  status: "booked" as FHIRAppointment["status"],
  comment: "",
};

export default function NewAppointmentModal({ onClose, patientId }: Props) {
  const [form, setForm] = useState({
    ...emptyForm,
    patientId: patientId ?? "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof emptyForm, string>>
  >({});

  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const mutation = useMutation({
    mutationFn: (apt: Omit<FHIRAppointment, "id">) => createAppointment(apt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
  });

  function validate() {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.patientId) e.patientId = "Required";
    if (!form.start) e.start = "Required";
    if (!form.end) e.end = "Required";
    if (form.start && form.end && form.start >= form.end) {
      e.end = "End must be after start";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePatientChange(id: string) {
    const patient = patients.find((p) => p.id === id);
    setForm((prev) => ({
      ...prev,
      patientId: id,
      patientDisplay: patient ? getPatientName(patient) : "",
    }));
    if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: "" }));
  }

  function handleServiceChange(code: string) {
    const svc = SERVICE_TYPES.find((s) => s.code === code);
    setForm((prev) => ({
      ...prev,
      serviceCode: code,
      serviceDisplay: svc?.display ?? "",
    }));
  }

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleSubmit() {
    if (!validate()) return;

    const apt: Omit<FHIRAppointment, "id"> = {
      resourceType: "Appointment",
      status: form.status,
      serviceType: [
        {
          coding: [
            {
              code: form.serviceCode,
              display: form.serviceDisplay,
            },
          ],
          text: form.serviceDisplay,
        },
      ],
      description: form.description || form.serviceDisplay,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      ...(form.comment && { comment: form.comment }),
      participant: [
        {
          actor: {
            reference: `Patient/${form.patientId}`,
            display: form.patientDisplay,
          },
          status: "accepted",
        },
        ...(form.practitioner
          ? [
              {
                actor: { display: form.practitioner },
                status: "accepted" as const,
              },
            ]
          : []),
      ],
    };
    mutation.mutate(apt);
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Book Appointment</div>
            <div className="modal-sub">
              Creates a FHIR Appointment resource with participants
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

          {/* Service type + Status */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Service type</label>
              <select
                className="form-input"
                value={form.serviceCode}
                onChange={(e) => handleServiceChange(e.target.value)}
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.display}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="proposed">Proposed</option>
                <option value="pending">Pending</option>
                <option value="booked">Booked</option>
              </select>
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

          {/* Start + End */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start *</label>
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
              <label className="form-label">End *</label>
              <input
                type="datetime-local"
                className={`form-input ${errors.end ? "input-error" : ""}`}
                value={form.end}
                onChange={(e) => handleChange("end", e.target.value)}
              />
              {errors.end && <span className="error-msg">{errors.end}</span>}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Description <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="Routine checkup, follow-up visit..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label">
              Comment <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="Patient requested morning slot"
              value={form.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
            />
          </div>

          {/* Live FHIR preview */}
          <div className="fhir-info-box">
            <div className="fhir-info-title"> POST /Appointment</div>
            <pre className="fhir-info-code">
              {JSON.stringify(
                {
                  resourceType: "Appointment",
                  status: form.status,
                  serviceType: [
                    {
                      coding: [
                        {
                          code: form.serviceCode,
                          display: form.serviceDisplay,
                        },
                      ],
                    },
                  ],
                  start: form.start
                    ? new Date(form.start).toISOString()
                    : "2026-07-01T09:00:00Z",
                  end: form.end
                    ? new Date(form.end).toISOString()
                    : "2026-07-01T09:30:00Z",
                  participant: [
                    {
                      actor: {
                        reference: `Patient/${form.patientId || "1000"}`,
                        display: form.patientDisplay || "Selected Patient",
                      },
                      status: "accepted",
                    },
                    ...(form.practitioner
                      ? [
                          {
                            actor: { display: form.practitioner },
                            status: "accepted",
                          },
                        ]
                      : []),
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
            {mutation.isPending ? "Booking..." : "Book Appointment"}
          </button>
        </div>

        {mutation.isError && (
          <div className="mutation-error">
            Failed to book appointment. Is your FHIR server running?
          </div>
        )}
      </div>
    </>
  );
}
