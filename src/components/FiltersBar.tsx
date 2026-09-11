import React from 'react';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface FiltersBarProps {
  totalCount: number;
  selectedCategory: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: string;
  onPriceRangeChange: (range: string) => void;
  inStockOnly: boolean;
  onToggleInStock: () => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  totalCount,
  selectedCategory,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onToggleInStock,
  onResetFilters,
  isFiltered,
}) => {
  const { formatPrice } = useCurrency();
  const priceOptions = [
    { label: 'All Prices', value: 'all' },
    { label: `Under ${formatPrice(50)}`, value: 'under-50' },
    { label: `${formatPrice(50)} - ${formatPrice(150)}`, value: '50-150' },
    { label: `${formatPrice(150)}+`, value: 'over-150' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-2.5 sm:p-3 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left side: Results Count & Category */}
      <div className="flex items-center space-x-2.5">
        <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-900">
              {selectedCategory === 'All' ? 'Full Catalog' : selectedCategory}
            </span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
              {totalCount}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Items Available
          </span>
        </div>
      </div>

      {/* Middle & Right: Filters, In Stock Toggle, Sort */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Price Range Segmented Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
          {priceOptions.map((opt) => (
            <button
              key={opt.value}
              id={`filter-price-${opt.value}`}
              onClick={() => onPriceRangeChange(opt.value)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                priceRange === opt.value
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* In Stock Only Checkbox Button */}
        <button
          id="filter-in-stock-toggle"
          onClick={onToggleInStock}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
            inStockOnly
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <span
            className={`w-3 h-3 rounded-xs flex items-center justify-center border ${
              inStockOnly
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 bg-white'
            }`}
          >
            {inStockOnly && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
          <span className="text-xs">In Stock</span>
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-1">
          <label htmlFor="sort-dropdown" className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            Sort:
          </label>
          <select
            id="sort-dropdown"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 text-xs"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            id="reset-filters-btn"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors border border-dashed border-slate-300"
            title="Reset filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-xs font-semibold">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
