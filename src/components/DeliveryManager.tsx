import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Delivery, DeliveryType, Document } from '../types';

const CONTAINER_DOCS: Omit<Document, 'id'>[] = [
  { name: 'Bill of Lading', status: 'missing', required: true },
  { name: 'Packing List', status: 'missing', required: true },
  { name: 'Commercial Invoice', status: 'missing', required: true },
  { name: 'Container Release', status: 'missing', required: false }
];

const EXWORKS_DOCS: Omit<Document, 'id'>[] = [
  { name: 'Collection Note', status: 'missing', required: true },
  { name: 'Export Declaration', status: 'missing', required: true },
  { name: 'Commercial Invoice', status: 'missing', required: true }
];

const DeliveryManager = () => {
  const { state, dispatch, currentUser } = useSocket();
  const { deliveries = [], addressBook } = state || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'container' as DeliveryType,
    reference: '',
    supplierId: '',
    transporterId: '',
    status: 0,
    eta: ''
  });

  const handleOpenModal = (delivery?: Delivery) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setFormData({
        type: delivery.type,
        reference: delivery.reference,
        supplierId: delivery.supplierId,
        transporterId: delivery.transporterId,
        status: delivery.status,
        eta: delivery.eta || ''
      });
    } else {
      setEditingDelivery(null);
      setFormData({
        type: 'container',
        reference: '',
        supplierId: '',
        transporterId: '',
        status: 0,
        eta: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDelivery) {
      dispatch('UPDATE_DELIVERY', {
        ...editingDelivery,
        ...formData,
        updatedAt: new Date().toISOString()
      });
    } else {
      const docs = formData.type === 'container' ? CONTAINER_DOCS : EXWORKS_DOCS;
      const newDelivery: Delivery = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        documents: docs.map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dispatch('ADD_DELIVERY', newDelivery);
    }
    setIsModalOpen(false);
  };

  const toggleDocStatus = (delivery: Delivery, docId: string) => {
    const updatedDocs = delivery.documents.map(doc => {
      if (doc.id === docId) {
        const nextStatus: any = doc.status === 'missing' ? 'received' : 'missing';
        return { ...doc, status: nextStatus };
      }
      return doc;
    });
    dispatch('UPDATE_DELIVERY', { ...delivery, documents: updatedDocs });
  };

  const canEdit = currentUser.role !== 'viewer';

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Leveringen</h2>
          <p className="text-slate-500 mt-1">Beheer en volg al je container en ex-works zendingen.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            Nieuwe Levering
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter op referentie..." 
            className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-full border border-slate-200 transition-all">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {deliveries.map((delivery) => (
          <motion.div 
            layout
            key={delivery.id}
            className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    delivery.type === 'container' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {delivery.type === 'container' ? <Package size={24} /> : <TruckIcon size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{delivery.reference}</h3>
                    <p className="text-sm text-slate-500 capitalize">{delivery.type} levering</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
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
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-600">
                  <span>Voortgang</span>
                  <span>{delivery.status}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${delivery.status}%` }}
                    className="bg-indigo-600 h-full rounded-full"
                  />
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Documenten</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {delivery.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => toggleDocStatus(delivery, doc.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                        doc.status === 'received' 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                          : "bg-slate-50 border-slate-100 text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {doc.status === 'received' ? <Check size={16} /> : <AlertCircle size={16} className={doc.required ? "text-amber-500" : "text-slate-400"} />}
                        <span className="text-sm font-semibold truncate">{doc.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>ETA: {delivery.eta || 'N/A'}</span>
              <span>Updated: {new Date(delivery.updatedAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
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
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
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
                    <select 
                      required
                      value={formData.supplierId}
                      onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="">Kies leverancier...</option>
                      {addressBook?.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Transporteur</label>
                    <select 
                      required
                      value={formData.transporterId}
                      onChange={e => setFormData({ ...formData, transporterId: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="">Kies transporteur...</option>
                      {addressBook?.transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Status (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">ETA</label>
                    <input 
                      type="date" 
                      value={formData.eta}
                      onChange={e => setFormData({ ...formData, eta: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

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
