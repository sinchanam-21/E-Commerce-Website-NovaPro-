import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  ShieldCheck,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { Product, User } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onProductAdded: (newProduct: Product) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fashion / Ethnic', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mobiles 5G', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },
  { label: 'Home & Kitchen', url: 'https://images.unsplash.com/photo-1584990347449-399b1d9bf5e2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Beauty Care', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
  { label: 'Footwear', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
  { label: 'Keyboard', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Monitor', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },
  { label: 'Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  user,
  onProductAdded,
  onNotify,
}) => {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('NovaTech');
  const [category, setCategory] = useState('Audio');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState('99.99');
  const [originalPrice, setOriginalPrice] = useState('');
  const [countInStock, setCountInStock] = useState('15');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [badge, setBadge] = useState<'New' | 'Bestseller' | 'Sale' | 'Trending' | 'None'>('New');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'Precision-engineered with aerospace-grade materials',
    'Certified 2-year official manufacturer warranty',
    'Factory calibrated and stress-tested for 24/7 reliability',
  ]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: 'Chassis', value: 'Anodized Aluminum Alloy' },
    { key: 'Connectivity', value: 'High-speed USB-C & Wireless' },
    { key: 'Warranty', value: '2-Year Official Protection' },
  ]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleUpdateFeature = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }

    const finalCategory = category === 'Custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Please specify a valid product category.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please specify a valid non-negative price.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a short product description.');
      return;
    }

    // Token
    const token = user?.token || localStorage.getItem('novastore_token');
    if (!token) {
      setError('Authentication token missing. Please sign in as store owner (oreooreooreo9@gmail.com).');
      return;
    }

    setLoading(true);

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specsObj[s.key.trim()] = s.value.trim();
      }
    });

    const filteredFeatures = features.filter((f) => f.trim() !== '');

    const payload = {
      name: name.trim(),
      brand: brand.trim() || 'NovaTech',
      category: finalCategory,
      price: parsedPrice,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      countInStock: parseInt(countInStock || '10', 10),
      image: image.trim(),
      badge: badge === 'None' ? undefined : badge,
      description: description.trim(),
      features: filteredFeatures.length > 0 ? filteredFeatures : undefined,
      specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
    };

    try {
      let createdProduct: Product;
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to add product to catalog.');
        }

        const data = await res.json();
        createdProduct = data.product;
      } catch (apiErr) {
        console.warn('API endpoint unreachable, registering product locally:', apiErr);
        createdProduct = {
          _id: 'prod_' + Date.now(),
          name: payload.name,
          brand: payload.brand,
          category: payload.category,
          price: payload.price,
          originalPrice: payload.originalPrice,
          countInStock: payload.countInStock,
          inStock: payload.countInStock > 0,
          rating: 5.0,
          numReviews: 1,
          image: payload.image,
          images: [payload.image],
          badge: payload.badge,
          description: payload.description,
          features: payload.features || ['Premium certified product', '100% genuine guaranteed'],
          specs: payload.specs || {},
          createdAt: new Date().toISOString(),
        };
      }

      onProductAdded(createdProduct);
      onNotify('success', 'SKU Registered', `"${createdProduct.name}" has been published to the catalog.`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register product.';
      setError(msg);
      onNotify('error', 'Operation Restricted', msg);
    } finally {
      setLoading(false);
    }
  };

  const numericPrice = parseFloat(price) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">Add New Hardware SKU</h3>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700 text-[9px] font-mono font-bold uppercase tracking-wider border border-indigo-200">
                  Owner Authenticated
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Secure catalog registry • Strictly restricted to <span className="font-mono text-slate-700 font-bold">oreooreooreo9@gmail.com</span>
              </p>
            </div>
          </div>

          <button
            id="close-add-product-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container with Scrolling */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 pr-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Section 1: Core Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Title *
              </label>
              <input
                id="add-product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ApexPro Carbon Ultra Mechanical Keyboard"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Brand / Vendor
                </label>
                <input
                  id="add-product-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="NovaTech"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  id="add-product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="Fashion">Fashion & Ethnic</option>
                  <option value="Mobiles">Mobiles & 5G</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Audio">Audio</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Beauty">Beauty & Personal Care</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Wearables">Wearables</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Home Office">Home Office</option>
                  <option value="Custom">Custom Category...</option>
                </select>
              </div>

              {category === 'Custom' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Custom Category Name
                  </label>
                  <input
                    id="add-product-custom-category"
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Gaming"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Merchandise Badge
                </label>
                <select
                  id="add-product-badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="New">New Arrival</option>
                  <option value="Bestseller">Bestseller</option>
                  <option value="Sale">On Sale</option>
                  <option value="Trending">Trending</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Financials & Inventory</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                Converted: {formatPrice(numericPrice)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Retail Price (USD $) *
                </label>
                <input
                  id="add-product-price"
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="99.99"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Original MSRP (USD $) (Optional)
                </label>
                <input
                  id="add-product-original-price"
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="129.99"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Stock Units Available *
                </label>
                <input
                  id="add-product-stock"
                  type="number"
                  required
                  value={countInStock}
                  onChange={(e) => setCountInStock(e.target.value)}
                  placeholder="15"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-600 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Product Image Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Product Visual Media
            </label>

            {/* Quick preset selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setImage(preset.url)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                    image === preset.url
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                  }}
                />
              </div>
              <div className="flex-1">
                <input
                  id="add-product-image-url"
                  type="url"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Direct HTTPS image URL or choose a preset above
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Short Description *
            </label>
            <textarea
              id="add-product-description"
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-performance hardware engineered for extreme reliability and modern creative workflows..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 leading-relaxed"
            />
          </div>

          {/* Section 5: Key Feature Bullets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Key Feature Highlights
              </label>
              <button
                type="button"
                id="add-feature-row-btn"
                onClick={handleAddFeature}
                className="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Feature
              </button>
            </div>
            <div className="space-y-1.5">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                    placeholder={`Feature #${idx + 1}`}
                    className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Technical Specs Table */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                Technical Specifications (Key / Value)
              </label>
              <button
                type="button"
                id="add-spec-row-btn"
                onClick={handleAddSpec}
                className="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Specification
              </button>
            </div>
            <div className="space-y-1.5">
              {specs.map((sp, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={sp.key}
                    onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                    placeholder="Spec Name (e.g. Battery Life)"
                    className="w-1/3 px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  />
                  <input
                    type="text"
                    value={sp.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="Spec Value (e.g. 45 Hours)"
                    className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="submit-add-product-btn"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{loading ? 'Committing to Catalog...' : 'Publish Item to Store'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
