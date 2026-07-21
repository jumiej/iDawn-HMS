import axios from "axios";
import { FHIRBundle, FHIREncounter } from "../types/fhir";

const FHIR_BASE = "http://localhost:8080/fhir";

const fhirClient = axios.create({
  baseURL: FHIR_BASE,
  headers: {
    "Content-Type": "application/fhir+json",
    Accept: "application/fhir+json",
  },
});

// GET all encounters for a specific patient
export async function getEncountersByPatient(
  patientId: string,
): Promise<FHIREncounter[]> {
  const res = await fhirClient.get<FHIRBundle<FHIREncounter>>(
    `/Encounter?subject=Patient/${patientId}&_sort=-date&_count=50`,
  );
  return res.data.entry?.map((e) => e.resource) ?? [];
}

// GET all encounters (for a global Encounters page, not patient-specific)
export async function getAllEncounters(): Promise<FHIREncounter[]> {
  const res = await fhirClient.get<FHIRBundle<FHIREncounter>>(
    "/Encounter?_sort=-date&_count=50",
  );
  return res.data.entry?.map((e) => e.resource) ?? [];
}

// POST create a new encounter
export async function createEncounter(
  encounter: Omit<FHIREncounter, "id">,
): Promise<FHIREncounter> {
  const res = await fhirClient.post<FHIREncounter>("/Encounter", encounter);
  return res.data;
}

// PUT update an encounter (e.g. change status from in-progress to finished)
export async function updateEncounter(
  id: string,
  encounter: FHIREncounter,
): Promise<FHIREncounter> {
  const res = await fhirClient.put<FHIREncounter>(
    `/Encounter/${id}`,
    encounter,
  );
  return res.data;
}
