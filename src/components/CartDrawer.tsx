import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CartItem } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  appliedPromo: string;
  onApplyPromo: (code: string) => boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedPromo,
  onApplyPromo,
}) => {
  const { formatPrice } = useCurrency();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  if (!isOpen) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Discount calculation
  let discountRate = 0;
  if (appliedPromo.toUpperCase() === 'SAVE10') discountRate = 0.1;
  if (appliedPromo.toUpperCase() === 'WELCOME20') discountRate = 0.2;

  const discountAmount = itemsSubtotal * discountRate;
  const discountedSubtotal = itemsSubtotal - discountAmount;
  const freeShippingThreshold = 50.0;
  const shippingCost = itemsSubtotal >= freeShippingThreshold || itemsSubtotal === 0 ? 0 : 5.99;
  const estimatedTax = discountedSubtotal * 0.07;
  const grandTotal = discountedSubtotal + shippingCost + estimatedTax;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoInput.trim()) return;
    const success = onApplyPromo(promoInput.trim());
    if (!success) {
      setPromoError('Invalid code. Try "SAVE10" or "WELCOME20"');
    } else {
      setPromoInput('');
    }
  };

  const progressPercent = Math.min(100, (itemsSubtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header - High Density */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Current Order Ledger</h2>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold font-mono">
                {totalItemsCount}
              </span>
            </div>
            <button
              id="close-cart-btn"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {cart.length > 0 && (
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                <span className="text-slate-700">
                  {itemsSubtotal >= freeShippingThreshold
                    ? '🎉 Free standard delivery threshold met!'
                    : `Add ${formatPrice(freeShippingThreshold - itemsSubtotal)} for free delivery`}
                </span>
                <span className="text-indigo-600 font-bold font-mono">
                  {formatPrice(itemsSubtotal)} / {formatPrice(freeShippingThreshold)}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List / Empty State */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-wider">
                  Cart is Empty
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Looks like you haven&apos;t added any items yet. Explore the high-performance hardware catalog!
                </p>
                <button
                  id="cart-continue-shopping-btn"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 shadow-2xs transition-all"
                >
                  Browse Hardware
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="py-2.5 flex gap-3 group">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-md object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                          {item.product.name}
                        </h4>
                        <button
                          id={`cart-remove-${item.productId}`}
                          onClick={() => onRemoveItem(item.productId)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 -mr-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                        {item.product.brand} • {formatPrice(item.product.price)}/ea
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded bg-slate-50 p-0.5">
                        <button
                          id={`cart-minus-${item.productId}`}
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 text-xs"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          id={`cart-plus-${item.productId}`}
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.countInStock}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 text-xs"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Calculations and Checkout CTA - High Density */}
          {cart.length > 0 && (
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/90">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="mb-3">
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Tag className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="cart-promo-input"
                      type="text"
                      placeholder="Coupon: SAVE10 / WELCOME20"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 uppercase font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-[10px] text-rose-500 mt-1">{promoError}</p>
                )}
                {appliedPromo && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                    <Check className="w-3 h-3" />
                    <span>Coupon active: &ldquo;{appliedPromo}&rdquo;</span>
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1 text-xs text-slate-600 pb-2.5 border-b border-slate-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {formatPrice(itemsSubtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({appliedPromo})</span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Standard Freight</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7%)</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {formatPrice(estimatedTax)}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Settlement Total</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-Bit Encrypted</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="proceed-to-checkout-btn"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition-all group"
              >
                <span>Proceed to Order Manifest</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
