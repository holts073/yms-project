export type DeliveryType = 'container' | 'exworks';

export interface Document {
  id: string;
  name: string;
  status: 'pending' | 'received' | 'missing';
  required: boolean;
  blocksMilestone?: number;
}

export interface AddressEntry {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  type: 'supplier' | 'transporter' | 'customer';
  pickupAddress?: string;
  otif?: number; // On-Time In-Full percentage
  remarks?: string;
  supplier_number?: string;
  customer_number?: string;
  pallet_rate?: number; // v3.8.0 Pallet Rate (€)
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
  palletType?: YmsPalletType;
  palletRate?: number;
  requiresQA?: boolean;
  
  // Container specific
  forwarderId?: string;
  etd?: string;
  etaPort?: string;
  etaWarehouse?: string;
  originalEtaWarehouse?: string;
  portOfArrival?: string;
  billOfLading?: string;
  containerNumber?: string;
  customsStatus?: 'Pending' | 'Cleared' | 'Inspection';
  dischargeTerminal?: string;

  // Ex-Works specific
  palletCount?: number;
  palletExchange?: boolean;
  loadingCountry?: string;
  loadingCity?: string;
  cargoType?: 'Dry' | 'Cool' | 'Frozen';
  loadingTime?: string;
  dockId?: number;
  delayRisk?: 'low' | 'medium' | 'high';
  predictionReason?: string;
  incoterm?: 'EXW' | 'FCA' | 'FOB' | 'DAP';
  readyForPickupDate?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  reference?: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer' | 'tablet';

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
  requiresReset?: boolean;
}

export interface AppSettings {
  terms: {
    ordered: string;
    transportRequested: string;
    enRouteToWarehouse: string;
    delivered: string;
    [key: string]: string;
  };
  shipment_settings?: {
    default_carrier?: string;
    notification_email?: string;
    auto_archive_days?: number;
  };
  pallet_rates?: Record<string, number>;
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
    customers: AddressEntry[];
  };
  deliveries: Delivery[];
  palletBalances: Record<string, number>;
  palletTransactions: PalletTransaction[]; // v3.8.0 Ledger
  logs: LogEntry[];
  users: User[];
  settings: AppSettings;
  companySettings?: CompanySettings;
  yms: {
    warehouses: YmsWarehouse[];
    docks: YmsDock[];
    waitingAreas: YmsWaitingArea[];
    deliveries: YmsDelivery[];
    priorityQueue: YmsDelivery[];
    dockOverrides: YmsDockOverride[];
    alerts: YmsAlert[];
    ymsSlots: YmsSlot[]; // v3.9.0 Slots
    selectedWarehouseId: string | null;
  };
  activeUsers: number;
}

export type YmsTemperature = 'Droog' | 'Vries' | 'Koel' | 'Fast Lane';
export type YmsPalletType = 'EUR' | 'CHEP' | 'DPD' | 'BLOK';
export type YmsDirection = 'INBOUND' | 'OUTBOUND';
export type YmsDeliveryStatus = 'EXPECTED' | 'PLANNED' | 'GATE_IN' | 'IN_YARD' | 'DOCKED' | 'UNLOADING' | 'LOADING' | 'COMPLETED' | 'GATE_OUT';

export interface YmsWarehouse {
  id: string;
  name: string;
  description?: string;
  address?: string;
  hasGate: boolean;
  openingTime?: string;
  closingTime?: string;
  fastLaneThreshold?: number;
  minutesPerPallet?: number;
  baseUnloadingTime?: number;
}

export interface YmsDock {
  id: number;
  warehouseId: string;
  name: string;
  allowedTemperatures: YmsTemperature[];
  status: 'Available' | 'Occupied' | 'Blocked';
  currentDeliveryId?: string;
  isFastLane?: boolean;
  isOutboundOnly?: boolean; // Keep for compatibility, but prefer direction_capability
  direction_capability: 'INBOUND' | 'OUTBOUND' | 'BOTH';
  adminStatus?: 'Active' | 'Inactive';
}

export type YmsWaitingAreaStatus = 'Active' | 'Deactivated' | 'Blocked';

export interface YmsWaitingArea {
  id: number;
  warehouseId: string;
  name: string;
  status: 'Available' | 'Occupied' | YmsWaitingAreaStatus;
  currentDeliveryId?: string;
  adminStatus?: 'Active' | 'Inactive';
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
  updatedAt?: string;
  isLate?: boolean;
  dockId?: number;
  waitingAreaId?: number;
  transporterId?: string;
  status: YmsDeliveryStatus;
  statusTimestamps?: Record<string, string>; // Maps status to ISO timestamp
  direction?: YmsDirection;
  palletCount?: number;
  palletType?: YmsPalletType;
  palletRate?: number;
  palletsExchanged?: number;
  isPalletExchangeConfirmed?: boolean;
  
  // Reefer Features
  estimatedDuration?: number;
  isReefer?: boolean;
  tempAlertThreshold?: number;
  lastEtaUpdate?: string;
  notes?: string;
  requiresQA?: boolean;
}

export interface YmsAlert {
  id: string;
  deliveryId?: string;
  warehouseId: string;
  type: 'WAIT_TIME' | 'TEMP_RISK' | 'DELAY' | 'DIRECTION_MISMATCH' | 'DWELL_TIME';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  message: string;
  resolved: boolean;
}

export interface YmsDockOverride {
  id: string;
  dockId: number;
  warehouseId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: 'Available' | 'Blocked';
  allowedTemperatures: YmsTemperature[];
}

export interface PalletTransaction {
  id: string;
  entityId: string;
  entityType: 'supplier' | 'transporter' | 'customer';
  deliveryId: string;
  balanceChange: number;
  palletType?: YmsPalletType;
  palletRate?: number;
  createdAt: string;
}

export interface YmsSlot {
  id: string;
  warehouseId: string;
  dockId: number;
  deliveryId: string;
  startTime: string; // ISO
  endTime: string;   // ISO
}
