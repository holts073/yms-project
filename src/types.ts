export type DeliveryType = 'container' | 'exworks';

export interface Document {
  id: string;
  name: string;
  status: 'pending' | 'received' | 'missing';
  required: boolean;
}

export interface AddressEntry {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  type: 'supplier' | 'transporter';
  pickupAddress?: string;
  otif?: number; // On-Time In-Full percentage
  remarks?: string;
}

export interface AuditEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Delivery {
  id: string;
  type: DeliveryType;
  reference: string;
  supplierId: string;
  transporterId: string;
  status: number; // 0-100
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  eta?: string;
  delayRisk?: 'low' | 'medium' | 'high';
  predictionReason?: string;
  statusHistory?: number[];
  notes?: string;
  auditTrail?: AuditEntry[];
  transportCost?: number;
  weight?: number;
  palletType?: 'EUR' | 'BLOK';
  
  // Container specific
  forwarderId?: string;
  etd?: string;
  etaPort?: string;
  etaWarehouse?: string;
  originalEtaWarehouse?: string;
  portOfArrival?: string;
  billOfLading?: string;
  containerNumber?: string;

  // Ex-Works specific
  palletCount?: number;
  palletExchange?: boolean;
  loadingCountry?: string;
  loadingCity?: string;
  cargoType?: 'Dry' | 'Cool' | 'Frozen';
  loadingTime?: string;
  dockId?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  reference?: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export interface UserPermissions {
  manageDeliveries?: boolean;
  manageAddressBook?: boolean;
  sendTransportOrder?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  passwordHash?: string;
  permissions?: UserPermissions;
}

export interface AppSettings {
  terms: {
    ordered: string;
    transportRequested: string;
    enRouteToWarehouse: string;
    delivered: string;
    [key: string]: string;
  };
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  transportTemplate?: string;
  mailServer?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
}

export interface AppState {
  addressBook: {
    suppliers: AddressEntry[];
    transporters: AddressEntry[];
  };
  logs: LogEntry[];
  users: User[];
  settings: AppSettings;
  companySettings?: CompanySettings;
  yms: {
    docks: YmsDock[];
    waitingAreas: YmsWaitingArea[];
    deliveries: YmsDelivery[];
  };
}

export type YmsTemperature = 'Droog' | 'Vries' | 'Koel';
export type YmsDeliveryStatus = 'Scheduled' | 'Arrived' | 'At Dock' | 'Completed';

export interface YmsDock {
  id: number;
  name: string;
  allowedTemperatures: YmsTemperature[];
  status: 'Available' | 'Occupied' | 'Blocked';
  currentDeliveryId?: string;
}

export interface YmsWaitingArea {
  id: number;
  name: string;
  status: 'Available' | 'Occupied';
  currentDeliveryId?: string;
}

export interface YmsDelivery {
  id: string;
  reference: string;
  licensePlate: string;
  supplier: string;
  supplierId?: string;
  temperature: YmsTemperature;
  scheduledTime: string;
  arrivalTime?: string;
  registrationTime?: string;
  isLate?: boolean;
  dockId?: number;
  waitingAreaId?: number;
  transporterId?: string;
  status: YmsDeliveryStatus;
}
