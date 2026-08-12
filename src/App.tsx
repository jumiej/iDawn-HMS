import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import PatientsPage from "./pages/PatientsPage";
import EncounterPage from "./pages/EncounterPage";
import ObservationsPage from "./pages/ObservationsPage";
import "./index.css";
import WaterSun from "../src/Images/WaterSun.svg";
import Users from "../src/Images/UsersRounded.svg";
import CalendarAdd from "../src/Images/CalendarAdd.svg";
import stethoscope from "../src/Images/Stethoscope.svg";
import Hospital from "../src/Images/Hospital.svg";
import Pill from "../src/Images/Pill.svg";
import observation from "../src/Images/observation.svg";
import MedicationsPage from "./pages/MedicationsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo">
            {/* <span className="logo-icon">🌅</span> */}
            <img src={WaterSun} alt="WaterSun" />
            <div>
              <div className="logo-name">iDawn</div>
              <div className="logo-sub">HMS · FHIR R4</div>
            </div>
          </div>
          <nav>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <img src={Hospital} alt="Hospital" />
              Dashboard
            </NavLink>
            <NavLink
              to="/patients"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <img src={Users} alt="Users" />
              Patients
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <img src={CalendarAdd} alt="CalendarAdd" />
              Appointments
            </NavLink>
            <NavLink
              to="/encounters"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <img src={stethoscope} alt="stethoscope" />
              Encounters
            </NavLink>
            <NavLink
              to="/observations"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <img src={observation} alt="observation" />
              Observations
            </NavLink>
            <NavLink
              to="/medications"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <img src={Pill} alt="Pill.svg" />
              Medications
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/encounters" element={<EncounterPage />} />
            <Route path="/observations" element={<ObservationsPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
