import { describe, it, expect } from 'vitest';
import { gatekeeperCheck } from './logistics';
import { Delivery } from '../types';

describe('Logistics Gatekeeper', () => {
  const mockDelivery: Delivery = {
    id: '1',
    type: 'exworks',
    reference: 'REF123',
    supplierId: 'S1',
    transporterId: 'T1',
    status: 0,
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('Container Scan Logic', () => {
    const scanRequiredDelivery: Delivery = {
      ...mockDelivery,
      type: 'container',
      documents: [
        { id: 'd1', name: 'SWB', status: 'received' as const, required: true },
        { id: 'd2', name: 'NOA', status: 'received' as const, required: true },
        { id: 'scan-1', name: 'Scan Release', status: 'pending' as const, required: true }
      ]
    };

    it('blocks transition to On Route (75) if Scan Release is pending', () => {
      const error = gatekeeperCheck(scanRequiredDelivery, 75);
      expect(error).toContain('gemarkeerd voor een scan');
    });

    it('allows transition to On Route if Scan Release is received', () => {
      const deliveryWithRelease = {
        ...scanRequiredDelivery,
        documents: scanRequiredDelivery.documents.map(d => d.name === 'Scan Release' ? { ...d, status: 'received' as const } : d)
      };
      const error = gatekeeperCheck(deliveryWithRelease, 75);
      expect(error).toBeNull();
    });
  });

  describe('Ex-Works Rules', () => {
    it('blocks transition to In Transit if Transport Order is missing', () => {
      const error = gatekeeperCheck(mockDelivery, 50);
      expect(error).toContain('Transport Order" is verplicht');
    });
  });

  describe('Container Rules', () => {
    const containerDelivery: Delivery = {
      ...mockDelivery,
      type: 'container',
    };

    it('blocks transition to DOUANE (50) if SWB/BOL is missing', () => {
      const error = gatekeeperCheck(containerDelivery, 50);
      expect(error).toContain('SWB of Bill of Lading');
    });

    it('blocks transition to On Route (75) if NOA is missing', () => {
      const deliveryWithSWB = {
        ...containerDelivery,
        documents: [{ id: 'd1', name: 'SWB', status: 'received' as const, required: true }]
      };
      const error = gatekeeperCheck(deliveryWithSWB, 75);
      expect(error).toContain('NOA');
    });
  });
});
