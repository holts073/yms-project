import React from 'react';
import { Delivery } from '../../types';
import { Mail, Calendar, MapPin, Package, Truck, Info } from 'lucide-react';

interface TransportOrderTemplateProps {
  delivery: Delivery;
  companyName?: string;
}

export const TransportOrderTemplate: React.FC<TransportOrderTemplateProps> = ({ 
  delivery, 
  companyName = "ILG Foodgroup" 
}) => {
  return (
    <div className="bg-white text-slate-900 mx-auto max-w-3xl rounded-3xl shadow-2xl overflow-hidden font-sans border border-slate-200">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">TRANSPORT ORDER</h1>
            <p className="text-indigo-200 font-medium">Ref: <span className="text-white font-bold">{delivery.reference}</span></p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
            <Mail size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="p-8 border-b border-slate-100">
        <p className="text-lg text-slate-700 leading-relaxed font-medium">
          Geachte transporteur,
          <br /><br />
          Hierbij verstrekken wij u de transportopdracht voor onderstaande Ex-Works zending. 
          Gelieve de afhaling in te plannen conform de opgegeven datum en laadlocatie.
        </p>
      </div>

      {/* Details Grid */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50">
        
        {/* Locatie & Tijd */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={16} /> Pickup Details
          </h2>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-sm">
            <div>
              <p className="text-slate-500 font-semibold mb-1">Laadlocatie (Land/Stad)</p>
              <p className="font-bold text-slate-900 text-lg">{delivery.loadingCity || 'Onbekend'}, {delivery.loadingCountry || 'Onbekend'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-1">Gereed voor Afhaling</p>
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                {delivery.readyForPickupDate ? new Date(delivery.readyForPickupDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'N.N.B.'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold mb-1">Incoterms</p>
              <p className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-list w-fit">{delivery.incoterm || 'EXW'}</p>
            </div>
          </div>
        </div>

        {/* Lading Details */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <Package size={16} /> Lading Specificaties
          </h2>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-sm">
            <div>
              <p className="text-slate-500 font-semibold mb-1">Aantal & Type Pallets</p>
              <p className="font-bold text-slate-900 text-lg">{delivery.palletCount || 0}x {delivery.palletType || 'EUR'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 font-semibold mb-1">Totaalgewicht</p>
                <p className="font-bold text-slate-900">{delivery.weight ? `${delivery.weight} kg` : 'Onbekend'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-1">Lading Type</p>
                <p className="font-bold text-slate-900">{delivery.cargoType || 'Dry'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructies */}
      <div className="p-8 border-t border-slate-100">
        <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Info size={16} /> Belangrijke Instructies
        </h2>
        <div className="bg-indigo-50/50 p-6 rounded-2xl text-slate-700 text-sm leading-relaxed space-y-2 border border-indigo-100">
          <p className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
            Meld uw voertuig minimaal 24 uur vooraf aan via ons Yard Management Systeem.
          </p>
          <p className="flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
            Vermeld altijd referentie <strong>{delivery.reference}</strong> in alle communicatie.
          </p>
          {delivery.palletExchange && (
            <p className="flex items-center gap-2 font-bold text-indigo-700 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-700 shrink-0"></span>
              Let op! Palletruil is vereist voor deze opdracht.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-slate-400 p-8 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Truck size={24} className="text-slate-500" />
          <span className="font-bold text-slate-300 uppercase tracking-widest">{companyName} Logistics</span>
        </div>
        <p>Genereerd door YMS System v3.2.2</p>
      </div>
    </div>
  );
};

export default TransportOrderTemplate;
