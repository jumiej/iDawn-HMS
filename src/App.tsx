import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import PatientsPage from "./pages/patientsPage";
import "./index.css";
function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="logo">
            <span className="logo-icon">🌅</span>
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
              👥 Patients
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              📅 Appointments
            </NavLink>
            <NavLink
              to="/encounters"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              🩺 Encounters
            </NavLink>
            <NavLink
              to="/observations"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              📊 Observations
            </NavLink>
            <NavLink
              to="/medications"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              💊 Medications
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/" element={<PatientsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
