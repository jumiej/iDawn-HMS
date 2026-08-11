import axios from 'axios';
import { FHIRBundle, FHIRMedicationRequest } from '../types/fhir';

const FHIR_BASE = process.env.REACT_APP_FHIR_BASE_URL ?? 'http://localhost:8080/fhir';

const fhirClient = axios.create({
  baseURL: FHIR_BASE,
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
  },
});

// GET all medications for a patient
export async function getMedicationsByPatient(
  patientId: string
): Promise<FHIRMedicationRequest[]> {
  const res = await fhirClient.get<FHIRBundle<FHIRMedicationRequest>>(
    `/MedicationRequest?subject=Patient/${patientId}&_sort=-authoredon&_count=50`
  );
  return res.data.entry?.map(e => e.resource) ?? [];
}

// GET all medications (global view)
export async function getAllMedications(): Promise<FHIRMedicationRequest[]> {
  const res = await fhirClient.get<FHIRBundle<FHIRMedicationRequest>>(
    '/MedicationRequest?_sort=-authoredon&_count=50'
  );
  return res.data.entry?.map(e => e.resource) ?? [];
}

// POST create a medication request
export async function createMedicationRequest(
  med: Omit<FHIRMedicationRequest, 'id'>
): Promise<FHIRMedicationRequest> {
  const res = await fhirClient.post<FHIRMedicationRequest>('/MedicationRequest', med);
  return res.data;
}

// PUT update status (e.g. active → completed or cancelled)
export async function updateMedicationRequest(
  id: string,
  med: FHIRMedicationRequest
): Promise<FHIRMedicationRequest> {
  const res = await fhirClient.put<FHIRMedicationRequest>(`/MedicationRequest/${id}`, med);
  return res.data;
}