import { useQuery } from "@tanstack/react-query";
import { getPatients } from "../services/patientService";
import { getAllAppointments } from "../services/appointmentService";
import { getAllEncounters } from "../services/encounterService";
import { getAllObservations } from "../services/observationService";
import { getAllMedications } from "../services/medicationService";
import linearCalendar from "../../src/Images/linearCalendar.svg";
import linearStethoscope from "../../src/Images/linearStethoscope.svg";
import linearPill from "../../src/Images/linearPill.svg";
import linearObservation from "../../src/Images/linearObservation.svg";
import linearUsers from "../../src/Images/linearUsers.svg";
// import linearCalendar from "../../src/Images/linearCalendar.svg";

// import { getPatientName } from "./PatientsPage";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  // All 5 queries fire in parallel
  const { data: patients = [], isLoading: l1 } = useQuery({
    queryKey: ["patients"],
    queryFn: getPatients,
  });
  const { data: appointments = [], isLoading: l2 } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAllAppointments,
  });
  const { data: encounters = [], isLoading: l3 } = useQuery({
    queryKey: ["encounters"],
    queryFn: getAllEncounters,
  });
  const { data: observations = [], isLoading: l4 } = useQuery({
    queryKey: ["observations"],
    queryFn: getAllObservations,
  });
  const { data: medications = [], isLoading: l5 } = useQuery({
    queryKey: ["medications"],
    queryFn: getAllMedications,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  // Derived stats
  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter((p) => p.active !== false).length,
    bookedToday: appointments.filter(
      (a) => a.status === "booked" && isToday(a.start),
    ).length,
    arrivedToday: appointments.filter((a) => a.status === "arrived").length,
    inProgressEncounters: encounters.filter((e) => e.status === "in-progress")
      .length,
    finishedToday: encounters.filter(
      (e) => e.status === "finished" && isToday(e.period?.end),
    ).length,
    totalObservations: observations.length,
    activeMedications: medications.filter((m) => m.status === "active").length,
  };

  // Recent activity — latest 5 across encounters + appointments
  const recentEncounters = [...encounters].slice(0, 5);
  const activeAppointments = appointments
    .filter((a) => a.status === "booked" || a.status === "arrived")
    .slice(0, 5);
  const activeMeds = medications
    .filter((m) => m.status === "active")
    .slice(0, 5);
  const recentObs = [...observations].slice(0, 5);

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-sub">Loading hospital overview...</div>
          </div>
        </div>
        <div className="state-box">Fetching data from FHIR server...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">
            iDawn HMS · Live overview ·{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#16a34a",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#16a34a",
              display: "inline-block",
            }}
          />
          FHIR Server Live
        </div>
      </div>

      {/* Top stats grid */}
      <div className="dashboard-stats">
        <div className="dash-stat-card">
          <div
            className="dash-stat-icon"
            style={{ background: "#dcfce7", color: "#16a34a" }}
          >
            <img src={linearUsers} alt="Users" />
          </div>
          <div className="dash-stat-body">
            <div className="dash-stat-val">{stats.totalPatients}</div>
            <div className="dash-stat-label">Total Patients</div>
            <div className="dash-stat-sub">{stats.activePatients} active</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div
            className="dash-stat-icon"
            style={{ background: "#dbeafe", color: "#2563eb" }}
          >
            <img src={linearCalendar} alt="Calendar" />{" "}
          </div>
          <div className="dash-stat-body">
            <div className="dash-stat-val">{stats.bookedToday}</div>
            <div className="dash-stat-label">Booked Today</div>
            <div className="dash-stat-sub">{stats.arrivedToday} arrived</div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div
            className="dash-stat-icon"
            style={{ background: "#fef3c7", color: "#d97706" }}
          >
            <img src={linearStethoscope} alt="Stethoscope" />
          </div>
          <div className="dash-stat-body">
            <div className="dash-stat-val">{stats.inProgressEncounters}</div>
            <div className="dash-stat-label">In Progress</div>
            <div className="dash-stat-sub">
              {stats.finishedToday} finished today
            </div>
          </div>
        </div>
        <div className="dash-stat-card">
          <div
            className="dash-stat-icon"
            style={{ background: "#fce7f3", color: "#be185d" }}
          >
            <img src={linearPill} alt="Pill" />
          </div>
          <div className="dash-stat-body">
            <div className="dash-stat-val">{stats.activeMedications}</div>
            <div className="dash-stat-label">Active Prescriptions</div>
            <div className="dash-stat-sub">
              {stats.totalObservations} vitals recorded
            </div>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="dashboard-grid">
        {/* Active appointments */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">
              <img src={linearCalendar} alt="Calendar" /> Active Appointments
            </span>
            <span className="dash-card-count">{activeAppointments.length}</span>
          </div>
          {activeAppointments.length === 0 ? (
            <div className="dash-empty">No active appointments today</div>
          ) : (
            activeAppointments.map((apt) => {
              const patient = apt.participant.find((p) =>
                p.actor?.reference?.startsWith("Patient/"),
              );
              const doctor = apt.participant.find(
                (p) => !p.actor?.reference?.startsWith("Patient/"),
              );
              return (
                <div key={apt.id} className="dash-list-item">
                  <div className="dash-item-left">
                    <div className="dash-item-name">
                      {patient?.actor?.display ??
                        patient?.actor?.reference?.split("/")[1] ??
                        "—"}
                    </div>
                    <div className="dash-item-sub">
                      {apt.serviceType?.[0]?.text ?? "Appointment"}
                      {doctor?.actor?.display
                        ? ` · ${doctor.actor.display}`
                        : ""}
                    </div>
                  </div>
                  <div className="dash-item-right">
                    <span
                      className={`badge ${apt.status === "arrived" ? "badge-inprogress" : "badge-planned"}`}
                    >
                      {apt.status}
                    </span>
                    <div className="dash-item-time">
                      {formatDate(apt.start)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* In-progress encounters */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">
              <img src={linearStethoscope} alt="Stethoscope" /> Active
              Encounters
            </span>
            <span className="dash-card-count">{recentEncounters.length}</span>
          </div>
          {recentEncounters.length === 0 ? (
            <div className="dash-empty">No active encounters</div>
          ) : (
            recentEncounters.map((enc) => (
              <div key={enc.id} className="dash-list-item">
                <div className="dash-item-left">
                  <div className="dash-item-name">
                    {enc.subject.display ?? enc.subject.reference.split("/")[1]}
                  </div>
                  <div className="dash-item-sub">
                    {enc.class?.display}
                    {enc.reasonCode?.[0]?.text
                      ? ` · ${enc.reasonCode[0].text}`
                      : ""}
                  </div>
                </div>
                <div className="dash-item-right">
                  <span
                    className={`badge ${
                      enc.status === "in-progress"
                        ? "badge-inprogress"
                        : enc.status === "finished"
                          ? "badge-finished"
                          : "badge-planned"
                    }`}
                  >
                    {enc.status}
                  </span>
                  <div className="dash-item-time">
                    {formatDate(enc.period?.start)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Active medications */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">
              <img src={linearPill} alt="Pill" /> Active Prescriptions
            </span>
            <span className="dash-card-count">{activeMeds.length}</span>
          </div>
          {activeMeds.length === 0 ? (
            <div className="dash-empty">No active prescriptions</div>
          ) : (
            activeMeds.map((med) => (
              <div key={med.id} className="dash-list-item">
                <div className="dash-item-left">
                  <div className="dash-item-name">
                    {med.medicationCodeableConcept?.coding?.[0]?.display}
                  </div>
                  <div className="dash-item-sub">
                    {med.subject?.display ??
                      med.subject?.reference?.split("/")[1]}
                    {med.requester?.display
                      ? ` · ${med.requester?.display}`
                      : ""}
                  </div>
                </div>
                <div className="dash-item-right">
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
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent vitals */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">
              <img src={linearObservation} alt="Observation" /> Recent Vitals
            </span>
            <span className="dash-card-count">{recentObs.length}</span>
          </div>
          {recentObs.length === 0 ? (
            <div className="dash-empty">No vitals recorded yet</div>
          ) : (
            recentObs.map((obs) => (
              <div key={obs.id} className="dash-list-item">
                <div className="dash-item-left">
                  <div className="dash-item-name">
                    {obs.code?.coding[0]?.display}
                  </div>
                  <div className="dash-item-sub">
                    {obs.subject.display ?? obs.subject.reference.split("/")[1]}
                  </div>
                </div>
                <div className="dash-item-right">
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>
                    {obs.valueQuantity?.value}
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        marginLeft: "3px",
                      }}
                    >
                      {obs.valueQuantity?.unit}
                    </span>
                  </div>
                  <div className="dash-item-time">
                    {formatDate(obs.effectiveDateTime)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
