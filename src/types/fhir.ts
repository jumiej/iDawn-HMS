export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface FHIRBundle<T> {
  resourceType: "Bundle";
  total: number;
  entry?: Array<{
    resource: T;
  }>;
}

export interface FHIRPatient extends FHIRResource {
  resourceType: "Patient";
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  telecom?: Array<{
    system: "phone" | "email";
    value: string;
    use?: "home" | "work" | "mobile";
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    country?: string;
  }>;
  active?: boolean;
}
