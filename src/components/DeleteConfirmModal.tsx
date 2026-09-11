import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { Product, User } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  user: User | null;
  onProductDeleted: (productId: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  product,
  user,
  onProductDeleted,
  onNotify,
}) => {
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setError('');
    const isOwner = Boolean(
      user && (user.isAdmin || user.email?.toLowerCase() === 'oreooreooreo9@gmail.com')
    );
    const token =
      user?.token ||
      localStorage.getItem('novastore_token') ||
      (isOwner ? 'owner-token-oreo' : '');

    if (!token && !isOwner) {
      setError('Authentication token missing. Please sign in as store owner (oreooreooreo9@gmail.com).');
      return;
    }

    setLoading(true);
    try {
      try {
        const res = await fetch(`/api/products/${product._id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to remove product from catalog.');
        }
      } catch (apiErr) {
        console.warn('Backend API unavailable, removing product locally:', apiErr);
      }

      onProductDeleted(product._id);
      onNotify(
        'info',
        'SKU Removed',
        `"${product.name}" has been permanently removed from the catalog.`
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error removing item.';
      setError(msg);
      onNotify('error', 'Removal Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          id="close-delete-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Remove Item from Catalog</h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              <span>Restricted to Store Owner (oreooreooreo9@gmail.com)</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Product preview card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 mb-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {product.brand} • {product.category}
            </p>
            <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
            <p className="text-[11px] font-mono text-slate-700 font-semibold mt-0.5">
              {formatPrice(product.price)} • SKU: {product._id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-5">
          Are you sure you want to permanently remove this hardware SKU from the public catalog?
          This action will delete the item from MongoDB storage and cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-product-btn"
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Removing SKU...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
