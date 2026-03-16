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
  
  // Container specific
  forwarderId?: string;
  etd?: string;
  etaPort?: string;
  etaWarehouse?: string;
  portOfArrival?: string;
  billOfLading?: string;
  containerNumber?: string;

  // Ex-Works specific
  palletCount?: number;
  palletExchange?: boolean;
  loadingCountry?: string;
  loadingCity?: string;
  cargoType?: 'Dry' | 'Cool' | 'Frozen';
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

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
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

export interface AppState {
  deliveries: Delivery[];
  addressBook: {
    suppliers: AddressEntry[];
    transporters: AddressEntry[];
  };
  logs: LogEntry[];
  users: User[];
  settings: AppSettings;
}
