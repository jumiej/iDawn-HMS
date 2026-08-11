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

export interface FHIREncounter extends FHIRResource {
  resourceType: "Encounter";
  status: "planned" | "in-progress" | "finished" | "cancelled";
  class: {
    system?: string;
    code: string;
    display: string;
  };
  subject: {
    reference: string;
    display: string;
  };
  participant?: Array<{
    individual?: {
      display: string;
    };
  }>;
  period?: {
    start: string;
    end?: string;
  };
  reasonCode?: Array<{
    text: string;
  }>;
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    display?: string;
  };  
  encounter?: {
    reference: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
}

// The LOINC vital signs catalogue
export const VITAL_SIGNS = [
  { code: '8480-6',  display: 'Systolic Blood Pressure',  unit: 'mmHg', placeholder: '120' },
  { code: '8462-4',  display: 'Diastolic Blood Pressure', unit: 'mmHg', placeholder: '80'  },
  { code: '8310-5',  display: 'Body Temperature',         unit: '°C',   placeholder: '36.6'},
  { code: '29463-7', display: 'Body Weight',              unit: 'kg',   placeholder: '70'  },
  { code: '8867-4',  display: 'Heart Rate',               unit: '/min', placeholder: '72'  },
  { code: '2708-6',  display: 'Oxygen Saturation',        unit: '%',    placeholder: '98'  },
] as const;


export interface FHIRMedicationRequest extends FHIRResource {
  resourceType: 'MedicationRequest';
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  intent: 'order' | 'proposal' | 'plan';
  medicationCodeableConcept: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
    display?: string;
  };
  encounter?: {
    reference: string;
  };
  requester?: {
    display: string;
  };
  authoredOn?: string;
  dosageInstruction?: Array<{
    text: string;
  }>;
  note?: Array<{
    text: string;
  }>;
}

// Common medications with RxNorm codes
export const COMMON_MEDICATIONS = [
  { code: '723',     display: 'Amoxicillin 250mg',    form: 'Capsule'  },
  { code: '1049502', display: 'Amoxicillin 500mg',    form: 'Capsule'  },
  { code: '41493',   display: 'Paracetamol 500mg',    form: 'Tablet'   },
  { code: '5640',    display: 'Ibuprofen 400mg',      form: 'Tablet'   },
  { code: '29046',   display: 'Lisinopril 10mg',      form: 'Tablet'   },
  { code: '310798',  display: 'Metformin 500mg',      form: 'Tablet'   },
  { code: '197517',  display: 'Atorvastatin 20mg',    form: 'Tablet'   },
  { code: '309362',  display: 'Ciprofloxacin 500mg',  form: 'Tablet'   },
  { code: '197604',  display: 'Azithromycin 250mg',   form: 'Tablet'   },
  { code: '312961',  display: 'Metronidazole 400mg',  form: 'Tablet'   },
] as const; 


export interface FHIRAppointment extends FHIRResource {
  resourceType: 'Appointment';
  status:
    | 'proposed'
    | 'pending'
    | 'booked'
    | 'arrived'
    | 'fulfilled'
    | 'cancelled'
    | 'noshow';
  serviceType?: Array<{
    coding?: Array<{
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  description?: string;
  start: string;
  end: string;
  comment?: string;
  participant: Array<{
    actor?: {
      reference?: string;
      display?: string;
    };
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
}

export const SERVICE_TYPES = [
  { code: '124', display: 'General Practice'    },
  { code: '165', display: 'Cardiology'          },
  { code: '310', display: 'Gynaecology'         },
  { code: '177', display: 'Neurology'           },
  { code: '189', display: 'Orthopaedics'        },
  { code: '211', display: 'Paediatrics'         },
  { code: '221', display: 'Psychiatry'          },
  { code: '234', display: 'Radiology'           },
  { code: '288', display: 'Accident & Emergency'},
  { code: '394', display: 'Ophthalmology'       },
] as const;