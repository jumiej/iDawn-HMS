import axios from 'axios';
import { FHIRBundle, FHIRObservation } from '../types/fhir';

const FHIR_BASE = process.env.REACT_APP_FHIR_BASE_URL ?? 'http://localhost:8080/fhir';

const fhirClient = axios.create({
  baseURL: FHIR_BASE,
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
  },
});

// GET all observations for a patient
export async function getObservationsByPatient(patientId: string): Promise<FHIRObservation[]> {
  const res = await fhirClient.get<FHIRBundle<FHIRObservation>>(
    `/Observation?subject=Patient/${patientId}&_sort=-date&_count=50&category=vital-signs`
  );
  return res.data.entry?.map(e => e.resource) ?? [];
}

// GET all observations (global view)
export async function getAllObservations(): Promise<FHIRObservation[]> {
  const res = await fhirClient.get<FHIRBundle<FHIRObservation>>(
    '/Observation?_sort=-date&_count=50&category=vital-signs'
  );
  return res.data.entry?.map(e => e.resource) ?? [];
}

// POST create an observation
export async function createObservation(
  obs: Omit<FHIRObservation, 'id'>
): Promise<FHIRObservation> {
  const res = await fhirClient.post<FHIRObservation>('/Observation', obs);
  return res.data;
}