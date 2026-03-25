import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ options, value, onChange, placeholder = 'Selecteer...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || '';

  const filteredOptions = options.filter(
    (o) => o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        className="w-full px-6 py-4 bg-card border border-border rounded-full focus:ring-2 focus:ring-indigo-500 flex justify-between items-center text-left"
        onClick={() => {
          setSearch('');
          setIsOpen(!isOpen);
        }}
      >
        <span className={value ? 'text-foreground' : 'text-[var(--muted-foreground)]'}>
          {value ? selectedLabel : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--muted-foreground)] shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-border rounded-[2rem] shadow-xl overflow-hidden dark:shadow-indigo-500/10"
          >
            <div className="p-2 border-b border-border flex items-center bg-[var(--muted)]/50">
              <Search size={16} className="text-[var(--muted-foreground)] ml-3" />
              <input
                autoFocus
                type="text"
                placeholder="Zoeken..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border-none focus:ring-0 text-sm"
              />
            </div>
            <ul className="max-h-60 overflow-y-auto p-2 space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2 text-sm rounded-xl cursor-pointer transition-colors ${
                      option.value === value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-foreground hover:bg-[var(--muted)]'
                    }`}
                  >
                    {option.label}
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-[var(--muted-foreground)] text-center">Niks gevonden</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
