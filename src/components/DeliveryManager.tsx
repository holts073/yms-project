import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  X,
  Check,
  AlertCircle,
  FileText,
  Package,
  Truck as TruckIcon,
  ChevronRight,
  MessageSquare,
  History,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Delivery, DeliveryType, Document } from '../types';
import { Combobox } from './ui/Combobox';
import { useDeliveries } from '../hooks/useDeliveries';

const DeliveryManager = ({ initialFilter = '', initialSelectedId }: { initialFilter?: string; initialSelectedId?: string }) => {
  const { state, dispatch, currentUser } = useSocket();
  const shipmentSettings = state?.settings?.shipment_settings || { container: [], exworks: [] };
  const { addressBook } = state || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'history'>('details');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);

  // URL state sync
  const searchParams = new URLSearchParams(window.location.search);
  const [filter, setFilter] = useState(searchParams.get('search') || initialFilter);
  const [typeFilter, setTypeFilter] = useState<'all' | 'container' | 'exworks'>((searchParams.get('type') as any) || 'all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    searchParams.get('sortKey') ? { key: searchParams.get('sortKey')!, direction: (searchParams.get('sortDir') as any) || 'asc' } : { key: 'eta', direction: 'asc' }
  );
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set('search', filter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (sortConfig) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filter, typeFilter, sortConfig, currentPage]);

  const { deliveries: paginatedDeliveries, totalPages, loading } = useDeliveries(
    currentPage, ITEMS_PER_PAGE, filter, typeFilter, sortConfig?.key || 'eta', true
  );

  // Handle initialSelectedId
  useEffect(() => {
    if (!initialSelectedId) {
      setLastOpenedId(null);
    } else if (lastOpenedId !== initialSelectedId) {
      // Find the delivery in the current list or wait for it to load
      const found = paginatedDeliveries.find(d => d.id === initialSelectedId);
      if (found) {
        setEditingDelivery(found);
        setIsModalOpen(true);
        setLastOpenedId(initialSelectedId);
      }
    }
  }, [initialSelectedId, lastOpenedId, paginatedDeliveries]);

  const currentModalDelivery = useMemo(() => {
    if (!editingDelivery) return null;
    return paginatedDeliveries.find(d => d.id === editingDelivery.id) || editingDelivery;
  }, [editingDelivery, paginatedDeliveries]);

  const getStatusLabel = (delivery: Delivery) => {
    if (delivery.status === 100) return 'Afgeleverd';
    
    if (delivery.type === 'container') {
      if (delivery.status >= 75) return 'Onderweg naar Magazijn';
      if (delivery.status >= 50) return 'Douane';
      if (delivery.status >= 25) return 'In Transit';
      return 'Besteld';
    } else {
      if (delivery.status >= 50) return 'Onderweg naar Magazijn';
      if (delivery.status >= 25) return 'Transport aangevraagd';
      return 'Besteld';
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = paginatedDeliveries.map(d => d.id);
    if (selectedIds.length === visibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

  const handleBulkStatusUpdate = (newStatus: number) => {
    dispatch('BULK_UPDATE_DELIVERIES', {
      ids: selectedIds,
      updates: { status: newStatus }
    });
    setSelectedIds([]);
  };

  // Form State
  const [formData, setFormData] = useState<any>({
    type: 'container' as DeliveryType,
    reference: '',
    supplierId: '',
    transporterId: '',
    forwarderId: '',
    status: 0,
    eta: '',
    notes: '',
    etd: '',
    etaPort: '',
    etaWarehouse: '',
    portOfArrival: '',
    billOfLading: '',
    containerNumber: '',
    palletCount: 0,
    palletExchange: false,
    loadingCountry: '',
    loadingCity: '',
    cargoType: 'Dry',
    transportCost: undefined,
    weight: undefined,
    palletType: 'EUR'
  });

  const handleOpenModal = (delivery?: Delivery) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setFormData({
        ...delivery,
        eta: delivery.eta || ''
      });
    } else {
      setEditingDelivery(null);
      setFormData({
        type: 'container',
        reference: '',
        supplierId: '',
        transporterId: '',
        forwarderId: '',
        status: 0,
        eta: '',
        notes: '',
        etd: '',
        etaPort: '',
        etaWarehouse: '',
        portOfArrival: '',
        billOfLading: '',
        containerNumber: '',
        palletCount: 0,
        palletExchange: false,
        loadingCountry: '',
        loadingCity: '',
        cargoType: 'Dry',
        transportCost: undefined,
        weight: undefined,
        palletType: 'EUR'
      });
    }
    setIsModalOpen(true);
    setActiveModalTab('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentModalDelivery) {
      const formUpdates = { ...formData };
      delete formUpdates.status;
      delete formUpdates.statusHistory;
      delete formUpdates.documents;
      delete formUpdates.delayRisk;
      delete formUpdates.predictionReason;

      dispatch('UPDATE_DELIVERY', {
        ...currentModalDelivery,
        ...formUpdates,
        updatedAt: new Date().toISOString()
      });
    } else {
      const docs = shipmentSettings[formData.type] || [];
      const newDelivery: Delivery = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        originalEtaWarehouse: formData.etaWarehouse,
        documents: docs.map((d: any) => ({ ...d, id: Math.random().toString(36).substr(2, 9), status: 'missing' })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dispatch('ADD_DELIVERY', newDelivery);
    }
    setIsModalOpen(false);
  };

  const getStatusSteps = (type: DeliveryType) => {
    if (type === 'container') {
      return ['Besteld', 'In Transit', 'Douane', 'Onderweg naar Magazijn', 'Afgeleverd'];
    }
    return ['Besteld', 'Transport aangevraagd', 'Onderweg naar Magazijn', 'Afgeleverd'];
  };

  const getStatusIndex = (delivery: Delivery) => {
    if (delivery.status === 100) return delivery.type === 'container' ? 4 : 3;
    if (delivery.type === 'container') {
      if (delivery.status >= 75) return 3;
      if (delivery.status >= 50) return 2;
      if (delivery.status >= 25) return 1;
      return 0;
    } else {
      if (delivery.status >= 50) return 2;
      if (delivery.status >= 25) return 1;
      return 0;
    }
  };

  const toggleDocStatus = (delivery: Delivery, docId: string) => {
    const doc = delivery.documents.find(d => d.id === docId);
    if (!doc) return;

    const newStatus = doc.status === 'missing' ? 'received' : 'missing';
    const updatedDocs = delivery.documents.map(d => d.id === docId ? { ...d, status: newStatus } : d);
    
    let newStatusPct = delivery.status;
    const history = [...(delivery.statusHistory || [])];

    if (delivery.type === 'container') {
      const swb = updatedDocs.find(d => d.name === 'Seaway Bill / B/L')?.status === 'received';
      const noa = updatedDocs.find(d => d.name === 'Notification of Arrival')?.status === 'received';

      if (newStatus === 'received') {
        if (doc.name === 'Seaway Bill / B/L' && delivery.status < 25) {
          if (history.length === 0 || history[history.length - 1] !== delivery.status) history.push(delivery.status);
          newStatusPct = 25;
        } else if (doc.name === 'Notification of Arrival' && delivery.status < 50) {
          if (history.length === 0 || history[history.length - 1] !== delivery.status) history.push(delivery.status);
          newStatusPct = 50;
        }
      } else if (newStatus === 'missing') {
          if (doc.name === 'Notification of Arrival' && delivery.status === 50) {
              if (history.length === 0 || history[history.length - 1] !== delivery.status) history.push(delivery.status);
              newStatusPct = 25;
          } else if (doc.name === 'Seaway Bill / B/L' && delivery.status === 25) {
              if (history.length === 0 || history[history.length - 1] !== delivery.status) history.push(delivery.status);
              newStatusPct = 0;
          }
      }
    } else if (delivery.type === 'exworks') {
      const cmr = updatedDocs.find(d => d.name === 'CMR / Vrachtbrief')?.status === 'received';
      if (newStatus === 'received' && doc.name === 'CMR / Vrachtbrief' && delivery.status < 50) {
        if (history.length === 0 || history[history.length - 1] !== delivery.status) history.push(delivery.status);
        newStatusPct = 50;
      } else if (newStatus === 'missing' && doc.name === 'CMR / Vrachtbrief' && delivery.status === 50) {
        if (history.length === 0 || history[history.length - 1] !== delivery.status) history.push(delivery.status);
        newStatusPct = 0;
      }
    }

    const updatedDelivery = {
      ...delivery, 
      documents: updatedDocs, 
      status: newStatusPct,
      statusHistory: history,
      updatedAt: new Date().toISOString()
    };
    
    // Optimistic UI update for the modal
    if (editingDelivery && editingDelivery.id === delivery.id) {
       setEditingDelivery(updatedDelivery);
    }

    dispatch('UPDATE_DELIVERY', updatedDelivery);
  };

  const handleSendTransportEmail = (delivery: Delivery) => {
    const supplier = addressBook?.suppliers.find(s => s.id === delivery.supplierId);
    const transporter = addressBook?.transporters.find(t => t.id === delivery.transporterId);
    
    if (!supplier || !transporter) {
      alert('Leverancier of transporteur niet gevonden.');
      return;
    }

    const subject = `Transport Order - Ref: ${delivery.reference}`;
    
    // Fill the template from settings
    let emailBody = state?.companySettings?.transportTemplate || 
      'Beste vervoerder,\n\nHierbij de transport order voor {reference}.\n\nLeverancier: {supplier}\nOpmerkingen: {notes}\nTransportkosten: {cost}\n\nMet vriendelijke groet,\nILG Foodgroup';
    
    // Format the cost
    const costString = delivery.transportCost !== undefined 
      ? new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(delivery.transportCost)
      : 'N.v.t.';

    emailBody = emailBody
      .replace(/{reference}/g, delivery.reference)
      .replace(/{supplierName}/g, supplier.name)
      .replace(/{supplierAddress}/g, supplier.address || '')
      .replace(/{loadingCity}/g, delivery.loadingCity || '')
      .replace(/{loadingCountry}/g, delivery.loadingCountry || '')
      .replace(/{palletCount}/g, (delivery.palletCount || 0).toString())
      .replace(/{palletType}/g, delivery.palletType || '-')
      .replace(/{weight}/g, delivery.weight ? `${delivery.weight} kg` : '-')
      .replace(/{cargoType}/g, delivery.cargoType || 'Dry')
      .replace(/{etaWarehouse}/g, delivery.etaWarehouse || '-')
      .replace(/{companyName}/g, state?.companySettings?.name || 'ILG Foodgroup')
      .replace(/{companyAddress}/g, state?.companySettings?.address || '')
      .replace(/{supplierRemarks}/g, supplier.remarks || '-')
      .replace(/{transporterRemarks}/g, transporter.remarks || '-')
      .replace(/{notes}/g, delivery.notes || '')
      .replace(/{cost}/g, costString);

    // Construct the "briefpapier" (letterhead) structure for the email
    const company = state?.companySettings || { name: 'ILG Foodgroup', address: '', phone: '', email: '' };
    const letterHead = `${company.name}
${company.address}
Tel: ${company.phone} | Email: ${company.email}
--------------------------------------------------

Aan: ${transporter.name}
${transporter.address || ''}

Onderwerp: ${subject}

`;

    const body = letterHead + emailBody;

    const mailtoUrl = `mailto:${transporter.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    // Log the action
    dispatch('UPDATE_DELIVERY', {
      ...delivery,
      updatedAt: new Date().toISOString(),
      notes: (delivery.notes ? delivery.notes + '\n' : '') + `[SYSTEM] Transport Order gemaild naar ${transporter.name} op ${new Date().toLocaleString()}`
    });
  };

  const setManualStatus = (delivery: Delivery, newStatus: number) => {
    const history = [...(delivery.statusHistory || [])];
    history.push(delivery.status);
    dispatch('UPDATE_DELIVERY', { 
      ...delivery, 
      status: newStatus, 
      statusHistory: history,
      updatedAt: new Date().toISOString() 
    });
  };

  const undoStatus = (delivery: Delivery) => {
    const history = [...(delivery.statusHistory || [])];
    if (history.length === 0) return;
    const prevStatus = history.pop();
    dispatch('UPDATE_DELIVERY', { 
      ...delivery, 
      status: prevStatus!, 
      statusHistory: history,
      updatedAt: new Date().toISOString() 
    });
  };

  const canEdit = currentUser.role === 'admin' || currentUser.permissions?.manageDeliveries;
  const canMailTransport = currentUser.role === 'admin' || currentUser.permissions?.sendTransportOrder;

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/deliveries/all');
      const allDels = await res.json();
      const headers = ['Referentie', 'Type', 'Status', 'ETA Magazijn', 'Aantal Pallets'].join(',');
      const rows = allDels.filter((d: any) => d.status < 100).map((d: any) => [
        `"${d.reference}"`, `"${d.type}"`, `"${getStatusLabel(d)}"`, `"${d.etaWarehouse}"`, `"${d.palletCount}"`
      ].join(','));
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `actieve_leveringen_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Leveringen</h2>
          <p className="text-slate-500 mt-1">Beheer en volg al je actieve container en ex-works zendingen.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            CSV Export
          </button>
          {canEdit && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus size={20} />
              Nieuwe Levering
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter op referentie..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-6 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none appearance-none pr-10 relative cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
        >
          <option value="all">Alle Types</option>
          <option value="container">Container</option>
          <option value="exworks">Ex-Works</option>
        </select>
        <button className="flex items-center gap-2 px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-full border border-slate-200 transition-all">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Deliveries List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === paginatedDeliveries.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th 
                  className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('reference')}
                >
                  Referentie
                </th>
                <th 
                  className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('billOfLading')}
                >
                  B/L Nummer
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Leverancier</th>
                <th 
                  className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th 
                  className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('eta')}
                >
                  ETA
                </th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDeliveries.map((delivery) => {
                  const supplier = addressBook?.suppliers.find(s => s.id === delivery.supplierId);
                  
                  // Dynamic Risk Calculation for Ex-Works
                  let displayRisk = delivery.delayRisk;
                  let displayReason = delivery.predictionReason;
                  
                  if (delivery.type === 'exworks' && delivery.status === 0 && delivery.etaWarehouse) {
                    const etaDate = new Date(delivery.etaWarehouse);
                    const today = new Date();
                    etaDate.setHours(0,0,0,0);
                    today.setHours(0,0,0,0);
                    const diffDays = Math.ceil((etaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 7) {
                      displayRisk = 'high';
                      displayReason = "Vraag direct transport aan (Minder dan 7 dagen tot ETA).";
                    }
                  } else if (delivery.type === 'container' && delivery.status < 50 && delivery.etaPort) {
                    // Check if NOA is still missing and ETA Port is soon
                    const noaMissing = delivery.documents.find(d => d.name === 'Notification of Arrival')?.status === 'missing';
                    if (noaMissing) {
                      const etaPortDate = new Date(delivery.etaPort);
                      const today = new Date();
                      etaPortDate.setHours(0,0,0,0);
                      today.setHours(0,0,0,0);
                      const diffDays = Math.ceil((etaPortDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays <= 7) {
                        displayRisk = 'high';
                        displayReason = "Documentatie (NOA) ontbreekt en schip arriveert binnen 7 dagen.";
                      }
                    }
                  }

                  return (
                <tr 
                  key={delivery.id} 
                  className={cn(
                    "hover:bg-slate-50 transition-colors cursor-pointer group",
                    selectedIds.includes(delivery.id) ? "bg-indigo-50/50" : ""
                  )}
                  onClick={() => handleOpenModal(delivery)}
                >
                  <td className="px-8 py-6" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(delivery.id)}
                      onChange={() => toggleSelect(delivery.id)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      delivery.type === 'container' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                    )}>
                      {delivery.type === 'container' ? <Package size={20} /> : <TruckIcon size={20} />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{delivery.reference}</span>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">#{delivery.id.substring(0, 6).toUpperCase()}</span>
                      {displayRisk === 'high' && (
                        <div className="relative group/risk">
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full cursor-help">
                            ACTIE
                          </span>
                          {displayReason && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover/risk:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                              {displayReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {delivery.containerNumber && (
                        <p className="text-[11px] text-slate-500 font-medium">Cont: <span className="text-slate-700">{delivery.containerNumber}</span></p>
                      )}
                      {delivery.type === 'exworks' && delivery.cargoType && (
                        <p className="text-[11px] text-slate-500 font-medium">{delivery.cargoType}</p>
                      )}
                      {(!delivery.containerNumber && !delivery.billOfLading && delivery.type === 'container') && (
                        <p className="text-[11px] text-slate-400">-</p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-700">
                      {delivery.type === 'container' ? (delivery.billOfLading || '-') : '-'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">
                        {supplier?.name || 'Onbekend'}
                      </span>
                      {supplier?.otif && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          OTIF: {supplier.otif}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {getStatusLabel(delivery)}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {getStatusSteps(delivery.type).map((step, idx) => (
                          <div 
                            key={step}
                            className={cn(
                              "h-1.5 flex-1 rounded-full",
                              idx <= getStatusIndex(delivery) ? (delivery.status === 100 ? "bg-emerald-500" : "bg-indigo-600") : "bg-slate-100"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-medium text-slate-600">
                      {formatDate(delivery.etaWarehouse || delivery.eta)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {delivery.type === 'exworks' && delivery.status < 25 && canEdit && (
                        <button 
                          onClick={() => setManualStatus(delivery, 25)}
                          className="px-3 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full hover:bg-amber-100 transition-all uppercase tracking-wider"
                        >
                          Transport aanvragen
                        </button>
                      )}
                      {delivery.type === 'exworks' && delivery.status >= 25 && delivery.status < 50 && canEdit && canMailTransport && (
                        <button 
                          onClick={() => handleSendTransportEmail(delivery)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full hover:bg-indigo-100 transition-all uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <FileText size={12} />
                          Mail Transport Order
                        </button>
                      )}
                      {delivery.type === 'container' && delivery.status >= 50 && delivery.status < 75 && canEdit && (
                        <button 
                          onClick={() => setManualStatus(delivery, 75)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full hover:bg-blue-100 transition-all uppercase tracking-wider"
                        >
                          Markeer 'Onderweg naar Magazijn'
                        </button>
                      )}
                      {delivery.type === 'container' && delivery.status >= 75 && delivery.status < 100 && canEdit && (
                        <button 
                          onClick={() => setManualStatus(delivery, 100)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full hover:bg-emerald-100 transition-all uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Check size={12} />
                          Zet op 'Afgeleverd'
                        </button>
                      )}
                      {delivery.type === 'exworks' && delivery.status >= 50 && delivery.status < 100 && canEdit && (
                        <button 
                          onClick={() => setManualStatus(delivery, 100)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full hover:bg-emerald-100 transition-all uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Check size={12} />
                          Zet op 'Afgeleverd'
                        </button>
                      )}
                      {delivery.notes && (
                        <div className="relative" title={delivery.notes}>
                          <MessageSquare size={18} className="text-slate-400 hover:text-indigo-600 cursor-help" />
                        </div>
                      )}
                      {canEdit && (
                        <>
                          <button 
                            onClick={() => handleOpenModal(delivery)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => dispatch('DELETE_DELIVERY', delivery.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Pagina {currentPage} van {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Vorige
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Volgende
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-slate-700 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 border-r border-slate-700 pr-8">
              <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                {selectedIds.length}
              </span>
              <span className="text-sm font-medium text-slate-300">geselecteerd</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleBulkStatusUpdate(100)}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-full text-sm font-bold transition-all"
              >
                <Check size={16} />
                Markeer als Afgeleverd
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-sm font-bold text-slate-400 hover:text-white transition-all"
              >
                Annuleren
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {editingDelivery ? 'Levering Aanpassen' : 'Nieuwe Levering'}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {editingDelivery && (
                  <div className="flex gap-4 p-1.5 bg-slate-100 rounded-full w-fit mb-6 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('details')}
                      className={cn(
                        "px-6 py-2 rounded-full font-bold text-sm transition-all",
                        activeModalTab === 'details' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Gegevens
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('history')}
                      className={cn(
                        "px-6 py-2 rounded-full font-bold text-sm transition-all",
                        activeModalTab === 'history' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Historie
                    </button>
                  </div>
                )}

                {activeModalTab === 'details' || !editingDelivery ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Type Levering</label>
                    <div className="flex gap-4 p-2 bg-slate-100 rounded-full">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'container' })}
                        className={cn(
                          "flex-1 py-3 rounded-full font-bold transition-all",
                          formData.type === 'container' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        Container
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'exworks' })}
                        className={cn(
                          "flex-1 py-3 rounded-full font-bold transition-all",
                          formData.type === 'exworks' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        Ex-Works
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Referentie</label>
                    <input 
                      required
                      type="text" 
                      value={formData.reference}
                      onChange={e => setFormData({ ...formData, reference: e.target.value })}
                      placeholder="Bijv. CONT-2024-001"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Leverancier</label>
                    <Combobox 
                      value={formData.supplierId}
                      onChange={(val) => setFormData({ ...formData, supplierId: val })}
                      options={(addressBook?.suppliers || []).map(s => ({ value: s.id, label: s.name }))}
                      placeholder="Kies leverancier..."
                    />
                  </div>

                  {formData.type === 'container' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Expediteur</label>
                        <Combobox 
                          value={formData.forwarderId}
                          onChange={(val) => setFormData({ ...formData, forwarderId: val })}
                          options={(addressBook?.transporters || []).map(t => ({ value: t.id, label: t.name }))}
                          placeholder="Kies expediteur..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">ETD</label>
                        <input type="date" value={formData.etd} onChange={e => setFormData({ ...formData, etd: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">ETA Port</label>
                        <input type="date" value={formData.etaPort} onChange={e => setFormData({ ...formData, etaPort: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">ETA Magazijn *</label>
                        <input required type="date" value={formData.etaWarehouse} onChange={e => setFormData({ ...formData, etaWarehouse: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Port of Arrival</label>
                        <input type="text" value={formData.portOfArrival} onChange={e => setFormData({ ...formData, portOfArrival: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Bill of Lading</label>
                        <input type="text" value={formData.billOfLading} onChange={e => setFormData({ ...formData, billOfLading: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Containernummer</label>
                        <input type="text" value={formData.containerNumber} onChange={e => setFormData({ ...formData, containerNumber: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Transporteur (Last Mile)</label>
                        <select 
                          value={formData.transporterId}
                          onChange={e => setFormData({ ...formData, transporterId: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Kies transporteur...</option>
                          {addressBook?.transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">ETA Magazijn *</label>
                        <input required type="date" value={formData.etaWarehouse} onChange={e => setFormData({ ...formData, etaWarehouse: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Transporteur</label>
                        <select 
                          value={formData.transporterId}
                          onChange={e => setFormData({ ...formData, transporterId: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Kies transporteur...</option>
                          {addressBook?.transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Aantal Pallets</label>
                        <input type="number" value={formData.palletCount} onChange={e => setFormData({ ...formData, palletCount: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Type Pallets</label>
                        <select 
                          value={formData.palletType || 'EUR'}
                          onChange={e => setFormData({ ...formData, palletType: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="EUR">EUR</option>
                          <option value="BLOK">BLOK</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Gewicht (kg)</label>
                        <input type="number" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2 flex items-center gap-4 pt-8">
                        <label className="text-sm font-bold text-slate-700 ml-4">Pallet Ruil</label>
                        <input type="checkbox" checked={formData.palletExchange} onChange={e => setFormData({ ...formData, palletExchange: e.target.checked })} className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Land van laden</label>
                        <input type="text" value={formData.loadingCountry} onChange={e => setFormData({ ...formData, loadingCountry: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Stad van laden</label>
                        <input type="text" value={formData.loadingCity} onChange={e => setFormData({ ...formData, loadingCity: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-4">Soort lading</label>
                        <select 
                          value={formData.cargoType}
                          onChange={e => setFormData({ ...formData, cargoType: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="Dry">Droog</option>
                          <option value="Cool">Koel</option>
                          <option value="Frozen">Vries</option>
                        </select>
                      </div>
                    </>
                  )}

                  {currentUser?.role !== 'staff' && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-bold text-slate-700 ml-4">Transportkosten (€)</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={formData.transportCost || ''} 
                        onChange={e => setFormData({ ...formData, transportCost: e.target.value ? parseFloat(e.target.value) : undefined })} 
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500" 
                        placeholder="Bijv. 450.00"
                      />
                    </div>
                  )}

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Opmerkingen</label>
                    <textarea 
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    />
                  </div>

                  {currentModalDelivery && (
                    <div className="space-y-4 col-span-2 bg-slate-50 p-8 rounded-[2rem]">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-slate-900">Documenten Beheer</h4>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Klik om status te wijzigen</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentModalDelivery.documents.map(doc => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => toggleDocStatus(currentModalDelivery, doc.id)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                              doc.status === 'received' 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <FileText size={18} className={doc.status === 'received' ? "text-emerald-500" : "text-slate-400"} />
                              <div>
                                <p className="text-sm font-bold">{doc.name}</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-60">
                                  {doc.required ? 'Verplicht' : 'Optioneel'}
                                </p>
                              </div>
                            </div>
                            {doc.status === 'received' ? <Check size={18} /> : <AlertCircle size={18} className="text-amber-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                ) : (
                  <div className="space-y-3">
                    {currentModalDelivery?.auditTrail?.length ? (
                      currentModalDelivery.auditTrail.map((entry, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-200">
                            <History size={16} className="text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900">{entry.action}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString('nl-NL')}</span>
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{entry.details}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Door: {entry.user}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-50">
                        <History size={32} className="mx-auto mb-3" />
                        <p className="text-sm italic text-slate-500">Geen historie beschikbaar.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Annuleren
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    {editingDelivery ? 'Opslaan' : 'Aanmaken'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default DeliveryManager;
