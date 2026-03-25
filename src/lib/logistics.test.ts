import { describe, it, expect } from 'vitest';
import { YmsDeliveryStatus } from '../types';

describe('Logistieke Status Transitie', () => {
  const validTransitions: Record<YmsDeliveryStatus, YmsDeliveryStatus[]> = {
    'EXPECTED': ['PLANNED', 'GATE_IN'],
    'PLANNED': ['GATE_IN'],
    'GATE_IN': ['IN_YARD', 'DOCKED'],
    'IN_YARD': ['DOCKED', 'GATE_OUT'],
    'DOCKED': ['UNLOADING', 'LOADING'],
    'UNLOADING': ['PLANNED', 'GATE_OUT'],
    'LOADING': ['GATE_OUT'],
    'GATE_OUT': ['COMPLETED'],
    'COMPLETED': []
  };

  it('zou een valide transitie van EXPECTED naar PLANNED moeten toestaan', () => {
    const current: YmsDeliveryStatus = 'EXPECTED';
    const next: YmsDeliveryStatus = 'PLANNED';
    expect(validTransitions[current]).toContain(next);
  });

  it('zou een illegale transitie van GATE_OUT naar DOCKED moeten weigeren', () => {
    const current: YmsDeliveryStatus = 'GATE_OUT';
    const next: YmsDeliveryStatus = 'DOCKED';
    expect(validTransitions[current]).not.toContain(next);
  });
});
