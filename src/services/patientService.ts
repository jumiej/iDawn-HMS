import axios from "axios";
import { FHIRPatient, FHIRBundle } from "../types/fhir";

const FHIR_BASE = "http://localhost:8080/fhir";

const fhirClient = axios.create({
  baseURL: FHIR_BASE,
  headers: {
    "Content-Type": "application/fhir+json",
    Accept: "application/fhir+json",
  },
});

// Get all patients
export async function getPatients(): Promise<FHIRPatient[]> {
  const response = await fhirClient.get<FHIRBundle<FHIRPatient>>(
    "/Patient?_count=50&_sort=-_lastUpdated",
  );
  // console.log("====response====", response);
  return response.data.entry?.map((entry) => entry.resource) ?? [];
}

// Get one patient by ID
export async function getPatientById(id: string): Promise<FHIRPatient> {
  const response = await fhirClient.get<FHIRPatient>(`/Patient/${id}`);
  return response.data;
}

// Post Create a new patient
export async function createPatient(
  patient: FHIRPatient,
): Promise<FHIRPatient> {
  const response = await fhirClient.post<FHIRPatient>("/Patient", patient);
  return response.data;
}

// Put Update an existing patient
export async function updatePatient(
  id: string,
  patient: FHIRPatient,
): Promise<FHIRPatient> {
  const response = await fhirClient.put<FHIRPatient>(`/Patient/${id}`, patient);
  return response.data;
}
