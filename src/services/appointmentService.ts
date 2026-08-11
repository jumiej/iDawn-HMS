import axios from 'axios';
import { FHIRAppointment, FHIRBundle } from '../types/fhir';

const FHIR_BASE = process.env.REACT_APP_FHIR_BASE_URL ?? 'http://localhost:8080/fhir';

const fhirClient = axios.create({
  baseURL: FHIR_BASE,
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
  },
});

// GET all appointments
export async function getAllAppointments(): Promise<FHIRAppointment[]> {
  const res = await fhirClient.get<FHIRBundle<FHIRAppointment>>(
    '/Appointment?_sort=date&_count=50'
  );
  return res.data.entry?.map(e => e.resource) ?? [];
}

// GET appointments for a specific patient
export async function getAppointmentsByPatient(
  patientId: string
): Promise<FHIRAppointment[]> {
  const res = await fhirClient.get<FHIRBundle<FHIRAppointment>>(
    `/Appointment?actor=Patient/${patientId}&_sort=date&_count=50`
  );
  return res.data.entry?.map(e => e.resource) ?? [];
}

// POST create an appointment
export async function createAppointment(
  apt: Omit<FHIRAppointment, 'id'>
): Promise<FHIRAppointment> {
  const res = await fhirClient.post<FHIRAppointment>('/Appointment', apt);
  return res.data;
}

// PUT update appointment (status change)
export async function updateAppointment(
  id: string,
  apt: FHIRAppointment
): Promise<FHIRAppointment> {
  const res = await fhirClient.put<FHIRAppointment>(`/Appointment/${id}`, apt);
  return res.data;
}