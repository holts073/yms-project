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
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  email: string;
}

export interface AppState {
  deliveries: Delivery[];
  addressBook: {
    suppliers: AddressEntry[];
    transporters: AddressEntry[];
  };
  logs: LogEntry[];
  users: User[];
}
