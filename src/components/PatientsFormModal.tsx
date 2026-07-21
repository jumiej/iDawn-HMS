import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FHIRPatient } from "../types/fhir";
import { createPatient, updatePatient } from "../services/patientService";

interface Props {
  onClose: () => void;
  patient?: FHIRPatient;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  gender: "" as "male" | "female" | "other" | "unknown" | "",
  birthDate: "",
  phone: "",
  addressLine: "",
  city: "",
  country: "NG",
};

// Edit mode : Converting an existing patient into form state
function patientToForm(patient: FHIRPatient): typeof emptyForm {
  const name = patient.name?.[0];
  const phone = patient.telecom?.find((t) => t.system === "phone")?.value ?? "";
  const address = patient.address?.[0];
  return {
    firstName: name?.given?.[0] ?? "",
    lastName: name?.family ?? "",
    gender: patient.gender ?? "",
    birthDate: patient.birthDate ?? "",
    phone,
    addressLine: address?.line?.[0] ?? "",
    city: address?.city ?? "",
    country: address?.country ?? "NG",
  };
}
export default function NewPatientsModal({ onClose, patient }: Props) {
  const isEditMode = !!patient;

  const [form, setForm] = useState(
    patient ? patientToForm(patient) : emptyForm,
  );
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({});

  // queryClient lets us refetch the patients list after creating one
  const queryClient = useQueryClient();

  useEffect(() => {
    setForm(patient ? patientToForm(patient) : emptyForm);
  }, [patient]);

  const mutation = useMutation({
    mutationFn: (data: Omit<FHIRPatient, "id">) => {
      if (isEditMode && patient?.id) {
        // PUT requires the full resource including id and resourceType
        return updatePatient(patient.id, {
          ...data,
          id: patient.id,
          resourceType: "Patient",
        });
      }
      return createPatient(data);
    },

    onSuccess: () => {
      // This invalidates the 'patients' cache key — React Query refetches the list automatically
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onClose();
    },
  });

  function validate() {
    const e: Partial<typeof emptyForm> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Reqquired";
    // if (!form.gender.trim()) e.gender = "Required";
    if (!form.birthDate.trim()) e.birthDate = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const patient: Omit<FHIRPatient, "id"> = {
      resourceType: "Patient",
      active: true,
      name: [
        {
          use: "official",
          family: form.lastName,
          given: [form.firstName],
        },
      ],
      gender: form.gender as FHIRPatient["gender"],
      birthDate: form.birthDate,
      ...(form.phone && {
        telecom: [{ system: "phone", value: form.phone, use: "mobile" }],
      }),
      ...(form.addressLine && {
        address: [
          {
            line: [form.addressLine],
            city: form.city,
            country: form.country,
          },
        ],
      }),
    };

    mutation.mutate(patient);
  }

  function handleChange(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field])
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
  }

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {isEditMode ? "Edit Patient" : "New Patient"}
            </div>
            <div className="modal-sub">
              {isEditMode
                ? `Updates Patient/${patient.id} via FHIR PUT`
                : "Creates a FHIR Patient resource"}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {/* Name */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First name *</label>
              <input
                className={`form-input ${errors.firstName ? "input-error" : ""}`}
                placeholder="Amara"
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
              {errors.firstName && (
                <span className="error-msg">{errors.firstName}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Last name *</label>
              <input
                className={`form-input ${errors.lastName ? "input-error" : ""}`}
                placeholder="Obi"
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
              {errors.lastName && (
                <span className="error-msg">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Gender + DOB */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className={`form-input ${errors.gender ? "input-error" : ""}`}
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
              {errors.gender && (
                <span className="error-msg">{errors.gender}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Date of birth *</label>
              <input
                type="date"
                className={`form-input ${errors.birthDate ? "input-error" : ""}`}
                value={form.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
              />
              {errors.birthDate && (
                <span className="error-msg">{errors.birthDate}</span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">
              Phone <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label">
              Street address <span className="optional">optional</span>
            </label>
            <input
              className="form-input"
              placeholder="12 Awka Rd"
              value={form.addressLine}
              onChange={(e) => handleChange("addressLine", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                placeholder="Lagos"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                className="form-input"
                placeholder="NG"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
            </div>
          </div>

          {/* FHIR info box */}
          <div className="fhir-info-box">
            <div className="fhir-info-title">
              {isEditMode ? `PUT / Patient/${patient.id}` : "POST / patient"}
            </div>
            <pre className="fhir-info-code">
              {JSON.stringify(
                {
                  resourceType: "Patient",
                  active: true,
                  name: [
                    {
                      use: "official",
                      family: form.lastName || "Obi",
                      given: [form.firstName || "Amara"],
                    },
                  ],
                  gender: form.gender || "female",
                  birthDate: form.birthDate || "1988-03-14",
                  ...(form.phone && {
                    telecom: [
                      {
                        system: "phone",
                        value: form.phone || "+234 800 000 0000",
                        use: "mobile",
                      },
                    ],
                  }),
                  ...(form.addressLine && {
                    address: [
                      {
                        line: [form.addressLine],
                        city: form.city,
                        country: form.country,
                      },
                    ],
                  }),
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
            {mutation.isPending
              ? "Saving to FHIR..."
              : isEditMode
                ? "Save Changes"
                : "Create Patient"}
          </button>
        </div>

        {mutation.isError && (
          <div className="mutation-error">
            {isEditMode
              ? "Failed to update patient."
              : "Failed to create patient."}
          </div>
        )}
      </div>
    </>
  );
}
