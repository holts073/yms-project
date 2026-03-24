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
    warehouses: YmsWarehouse[];
    docks: YmsDock[];
    waitingAreas: YmsWaitingArea[];
    deliveries: YmsDelivery[];
    dockOverrides: YmsDockOverride[];
    alerts: YmsAlert[];
  };
}

export type YmsTemperature = 'Droog' | 'Vries' | 'Koel' | 'Fast Lane';
export type YmsDirection = 'INBOUND' | 'OUTBOUND';
export type YmsDeliveryStatus = 'EXPECTED' | 'PLANNED' | 'GATE_IN' | 'IN_YARD' | 'DOCKED' | 'UNLOADING' | 'LOADING' | 'COMPLETED' | 'GATE_OUT';

export interface YmsWarehouse {
  id: string;
  name: string;
  description?: string;
  address?: string;
}

export interface YmsDock {
  id: number;
  warehouseId: string;
  name: string;
  allowedTemperatures: YmsTemperature[];
  status: 'Available' | 'Occupied' | 'Blocked';
  currentDeliveryId?: string;
  isFastLane?: boolean;
  isOutboundOnly?: boolean;
}

export type YmsWaitingAreaStatus = 'Active' | 'Deactivated' | 'Blocked';

export interface YmsWaitingArea {
  id: number;
  warehouseId: string;
  name: string;
  status: 'Available' | 'Occupied' | YmsWaitingAreaStatus;
  currentDeliveryId?: string;
}

export interface YmsDelivery {
  id: string;
  warehouseId: string;
  reference: string;
  licensePlate: string;
  supplier: string;
  supplierId?: string;
  mainDeliveryId?: string;
  temperature: YmsTemperature;
  scheduledTime: string;
  arrivalTime?: string;
  registrationTime?: string;
  isLate?: boolean;
  dockId?: number;
  waitingAreaId?: number;
  transporterId?: string;
  status: YmsDeliveryStatus;
  statusTimestamps?: Record<string, string>; // Maps status to ISO timestamp
  direction?: YmsDirection;
  palletCount?: number;
  
  // Reefer Features
  estimatedDuration?: number;
  isReefer?: boolean;
  tempAlertThreshold?: number;
  lastEtaUpdate?: string;
}

export interface YmsAlert {
  id: string;
  deliveryId?: string;
  warehouseId: string;
  type: 'WAIT_TIME' | 'TEMP_RISK' | 'DELAY';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  message: string;
  resolved: boolean;
}

export interface YmsDockOverride {
  id: string;
  dockId: number;
  warehouseId: string;
  date: string; // YYYY-MM-DD
  status: 'Available' | 'Blocked';
  allowedTemperatures: YmsTemperature[];
}
