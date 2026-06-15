import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPatients } from "../services/patientService";
import { FHIRPatient } from "../types/fhir";
import PatientDetail from "../components/patientDetail";
import NewPatientsModal from "../components/NewPatientsModal";

// Helper: pull full name out of FHIR name array
export function getPatientName(patient: FHIRPatient): string {
  const name = patient.name?.[0];
  if (!name) return "Unknown";
  const given = name.given?.join(" ") ?? " ";
  const family = name.family ?? " ";
  return `${given} ${family}`.trim();
}

// Helper: initials for avatar
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join(" ")
    .toLocaleUpperCase()
    .slice(0, 3);
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // This calls getPatients() and manages loading/error/data automatically
  const {
    data: patients = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  // Client-side filter by name
  const filtered = patients.filter((p) =>
    getPatientName(p).toLocaleLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = patients.filter((p) => p.active !== false).length;
  return (
    <div className="page-with-detail">
      <div className="page-body">
        <div className="page-header">
          <div>
            <div className="page-title">Patient Registry</div>
            <div className="page-sub">All patients from FHIR server</div>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              console.log("You clicked me");
              setShowModal(true);
            }}
          >
            + New Patient
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Patients</div>
            <div className="stat-value">{patients.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">FHIR Server</div>
            <div
              className="stat-value"
              style={{ fontSize: "13px", marginTop: "8px", color: "#16a34a" }}
            >
              ● Live · localhost:8080
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-toolbar">
            <input
              className="search-input"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span
              style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}
            >
              {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isLoading && (
            <div className="state-box">
              Loading patients from FHIR server...
            </div>
          )}
          {isError && (
            <div className="state-box" style={{ color: "#dc2626" }}>
              Could not connect to FHIR server. Is HAPI running on
              localhost:8080?
            </div>
          )}

          {!isLoading && !isError && (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>FHIR ID</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => {
                  const name = getPatientName(patient);
                  return (
                    <tr
                      key={patient.id}
                      className={selectedId === patient.id ? "selected" : ""}
                      onClick={() => setSelectedId(patient.id ?? null)}
                    >
                      <td>
                        <div className="cell-flex">
                          <div className="avatar">{getInitials(name)}</div>
                          {name}
                        </div>
                      </td>
                      <td
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {patient.id}
                      </td>
                      <td>{patient.birthDate ?? "—"}</td>
                      <td style={{ textTransform: "capitalize" }}>
                        {patient.gender ?? "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${patient.active === false ? "badge-inactive" : "badge-active"}`}
                        >
                          {patient.active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail panel slides in when a patient is selected */}
      {selectedId && (
        <PatientDetail
          patient={patients.find((p) => p.id === selectedId)!}
          onClose={() => setSelectedId(null)}
        />
      )}
      {showModal && <NewPatientsModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
