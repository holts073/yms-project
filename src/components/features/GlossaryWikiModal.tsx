import React, { useState, useMemo, useEffect } from 'react';
import { GLOSSARY, GlossaryCategory } from '../../lib/glossary';
import { X, Search, BookOpen } from 'lucide-react';
import { Input } from '../shared/Input';
import { cn } from '../../lib/utils';

interface GlossaryWikiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryWikiModal: React.FC<GlossaryWikiModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredGlossary = useMemo(() => {
    const s = searchTerm.toLowerCase();
    const grouped: Record<string, typeof GLOSSARY> = {};
    
    GLOSSARY.forEach(item => {
      if (!s || item.term.toLowerCase().includes(s) || item.definition.toLowerCase().includes(s)) {
        if (!grouped[item.category]) {
          grouped[item.category] = [];
        }
        grouped[item.category].push(item);
      }
    });
    
    return grouped;
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-card border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-[var(--muted)]/30">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2 tracking-tight">
            <BookOpen className="text-indigo-500" />
            Logistieke Wiki
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
            <input
              type="text"
              placeholder="Zoeken naar begrippen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--muted)] border border-border text-foreground text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar bg-background">
          {Object.keys(filteredGlossary).length === 0 ? (
            <div className="text-center text-[var(--muted-foreground)] py-8 font-medium">
              Geen begrippen gevonden voor "{searchTerm}"
            </div>
          ) : (
            Object.entries(filteredGlossary).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  {category}
                </h3>
                <div className="space-y-3">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-card border border-border rounded-xl p-4 hover:border-indigo-500/30 hover:bg-[var(--muted)]/20 transition-all shadow-sm"
                    >
                      <h4 className="font-bold text-foreground text-sm mb-1">{item.term}</h4>
                      <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed">
                        {item.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
