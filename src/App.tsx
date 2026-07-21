import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import PatientsPage from "./pages/patientsPage";
import "./index.css";
import WaterSun from "../src/Images/WaterSun.svg";
import EncountersPage from "./pages/encounterPage";
import Users from "../src/Images/UsersRounded.svg";
import CalendarAdd from "../src/Images/CalendarAdd.svg";
import stethoscope from "../src/Images/Stethoscope.svg";
import Chart from "../src/Images/Chart.svg";
import Pill from "../src/Images/Pill.svg";

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
              <img src={Chart} alt="Chart" />
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
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/" element={<PatientsPage />} />
            <Route path="/encounters" element={<EncountersPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
