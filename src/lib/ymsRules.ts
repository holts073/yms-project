import { YmsDeliveryStatus, YmsDelivery } from '../types';

export const FAST_LANE_THRESHOLD = 10; // Default threshold

export const YMS_STATUS_FLOW: YmsDeliveryStatus[] = [
  'EXPECTED',
  'PLANNED',
  'GATE_IN',
  'IN_YARD',
  'DOCKED',
  'UNLOADING',
  'LOADING',
  'COMPLETED',
  'GATE_OUT'
];

export const ALLOWED_TRANSITIONS: Record<YmsDeliveryStatus, YmsDeliveryStatus[]> = {
  'EXPECTED': ['PLANNED', 'GATE_IN'],
  'PLANNED': ['GATE_IN'],
  'GATE_IN': ['IN_YARD', 'DOCKED'],
  'IN_YARD': ['DOCKED'],
  'DOCKED': ['UNLOADING', 'LOADING', 'COMPLETED'],
  'UNLOADING': ['COMPLETED'],
  'LOADING': ['COMPLETED'],
  'COMPLETED': ['GATE_OUT'],
  'GATE_OUT': []
};

export function isValidTransition(current: YmsDeliveryStatus, next: YmsDeliveryStatus): boolean {
  if (current === next) return true;
  return ALLOWED_TRANSITIONS[current]?.includes(next) || false;
}

export function getStatusLabel(status: YmsDeliveryStatus, direction?: 'INBOUND' | 'OUTBOUND'): string {
  const labels: Record<YmsDeliveryStatus, string> = {
    'EXPECTED': 'Verwacht (SCM)',
    'PLANNED': 'Gepland',
    'GATE_IN': 'Aangekomen (Gate In)',
    'IN_YARD': 'In Yard (Wachtend)',
    'DOCKED': 'Aangedockt',
    'UNLOADING': direction === 'OUTBOUND' ? 'Laden (Outbound)' : 'Uitladen',
    'LOADING': 'Laden',
    'COMPLETED': 'Gereed (Afgeleverd)',
    'GATE_OUT': 'Vertrokken (Gate Out)'
  };
  return labels[status] || status;
}

export function isFastLaneEligible(delivery: Partial<YmsDelivery>): boolean {
  if (!delivery.palletCount) return false;
  return delivery.palletCount <= FAST_LANE_THRESHOLD;
}

export function calculateKPIs(statusTimestamps: Record<string, string>) {
  const ts = statusTimestamps;
  const results: any = {};

  if (ts.GATE_IN && ts.GATE_OUT) {
    results.turnaroundTime = (new Date(ts.GATE_OUT).getTime() - new Date(ts.GATE_IN).getTime()) / 60000; // minutes
  }

  if (ts.IN_YARD && ts.DOCKED) {
    results.dwellTime = (new Date(ts.DOCKED).getTime() - new Date(ts.IN_YARD).getTime()) / 60000; // minutes
  }

  return results;
}

export function isWithinOpeningHours(timeStr: string, opening: string = '07:00', closing: string = '15:00'): boolean {
  if (!timeStr) return true;
  // Handle full ISO strings or just time strings
  const time = timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr.substring(0, 5);
  return time >= opening && time <= closing;
}
