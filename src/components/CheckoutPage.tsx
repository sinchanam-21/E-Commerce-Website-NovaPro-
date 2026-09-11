import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Sparkles,
  Lock,
  Check,
} from 'lucide-react';
import { CartItem, ShippingAddress, User, Order } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface CheckoutPageProps {
  cart: CartItem[];
  user: User | null;
  appliedPromo: string;
  onBack: () => void;
  onOrderSuccess: (order: Order) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  user,
  appliedPromo,
  onBack,
  onOrderSuccess,
  onNotify,
}) => {
  const { formatPrice } = useCurrency();
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 349-2819',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Delivery (Demo)');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Financial calculations
  const itemsSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  let discountRate = 0;
  if (appliedPromo.toUpperCase() === 'SAVE10') discountRate = 0.1;
  if (appliedPromo.toUpperCase() === 'WELCOME20') discountRate = 0.2;

  const discountAmount = itemsSubtotal * discountRate;
  const discountedSubtotal = itemsSubtotal - discountAmount;
  const shippingPrice = shippingMethod === 'express' ? 9.99 : itemsSubtotal >= 50 ? 0 : 5.99;
  const taxPrice = discountedSubtotal * 0.07;
  const totalPrice = discountedSubtotal + shippingPrice + taxPrice;

  const handlePrefillDemo = () => {
    setShippingAddress({
      fullName: user?.name || 'Jane Doe',
      email: user?.email || 'jane.doe@example.com',
      phone: '+1 (555) 782-9341',
      address: '742 Evergreen Terrace, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'United States',
    });
    onNotify('info', 'Demo Address Applied', 'Sample shipping credentials filled for instant test.');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
      onNotify('error', 'Incomplete Address', 'Please complete all required shipping fields.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderPayload = {
        userId: user?._id,
        customerName: shippingAddress.fullName,
        customerEmail: shippingAddress.email,
        orderItems: cart.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          image: item.product.image,
          price: item.product.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        shippingMethod,
        paymentMethod,
        itemsPrice: itemsSubtotal,
        shippingPrice,
        taxPrice,
        discountPrice: discountAmount,
        totalPrice,
      };

      let createdOrder: Order;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });

        if (!res.ok) {
          throw new Error('API server returned error');
        }

        createdOrder = await res.json();
      } catch (networkErr) {
        console.warn('Backend API unavailable, storing order locally:', networkErr);
        // Fallback for static Vercel deployment: generate realistic order record
        const now = new Date().toISOString();
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        createdOrder = {
          _id: 'ord_' + Date.now(),
          orderNumber: `ORD-${randomNum}`,
          customerName: orderPayload.customerName,
          customerEmail: orderPayload.customerEmail,
          orderItems: orderPayload.orderItems,
          shippingAddress: orderPayload.shippingAddress,
          shippingMethod: orderPayload.shippingMethod,
          paymentMethod: orderPayload.paymentMethod,
          itemsPrice: orderPayload.itemsPrice,
          shippingPrice: orderPayload.shippingPrice,
          taxPrice: orderPayload.taxPrice,
          discountPrice: orderPayload.discountPrice,
          totalPrice: orderPayload.totalPrice,
          status: 'Processing',
          isPaid: paymentMethod !== 'Cash on Delivery (Demo)',
          createdAt: now,
          estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
        };

        // Persist to local storage
        try {
          const saved = localStorage.getItem('novastore_orders');
          const existingOrders = saved ? JSON.parse(saved) : [];
          localStorage.setItem('novastore_orders', JSON.stringify([createdOrder, ...existingOrders]));
        } catch (storageErr) {
          console.warn('Failed saving order to localStorage:', storageErr);
        }
      }

      onOrderSuccess(createdOrder);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing checkout';
      onNotify('error', 'Checkout Error', msg);
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-2">
          Add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={onBack}
          className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between mb-5">
        <button
          id="checkout-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hardware Catalog</span>
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          <Lock className="w-3 h-3" />
          <span>Encrypted Demo Order Pipeline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Section 1: Shipping Address */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    01
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Consignee Shipping Information
                  </h3>
                </div>

                <button
                  type="button"
                  id="prefill-demo-address-btn"
                  onClick={handlePrefillDemo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Fill Demo Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="shipping-fullname"
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                    }
                    placeholder="e.g. John Doe"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="shipping-email"
                    type="email"
                    required
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, email: e.target.value })
                    }
                    placeholder="e.g. john@example.com"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Street Address *
                  </label>
                  <input
                    id="shipping-street"
                    type="text"
                    required
                    value={shippingAddress.address}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, address: e.target.value })
                    }
                    placeholder="123 Market Street, Suite 400"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    City *
                  </label>
                  <input
                    id="shipping-city"
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    placeholder="San Francisco"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      State / Region *
                    </label>
                    <input
                      id="shipping-state"
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      placeholder="CA"
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      ZIP / Postal *
                    </label>
                    <input
                      id="shipping-postal"
                      type="text"
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="94105"
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Contact
                  </label>
                  <input
                    id="shipping-phone"
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Delivery Method */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  02
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Freight &amp; Delivery Option
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  onClick={() => setShippingMethod('standard')}
                  className={`p-3 rounded-lg border flex items-start justify-between cursor-pointer transition-all ${
                    shippingMethod === 'standard'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Standard Freight</h4>
                      <p className="text-[10px] text-slate-500">5-7 business days transit</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    {itemsSubtotal >= 50 ? 'FREE' : formatPrice(5.99)}
                  </span>
                </label>

                <label
                  onClick={() => setShippingMethod('express')}
                  className={`p-3 rounded-lg border flex items-start justify-between cursor-pointer transition-all ${
                    shippingMethod === 'express'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Express Air Cargo</h4>
                      <p className="text-[10px] text-slate-500">2-3 business days priority</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono">{formatPrice(9.99)}</span>
                </label>
              </div>
            </div>

            {/* Section 3: Payment Method */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    03
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Payment Protocol
                  </h3>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Simulation Mode
                </span>
              </div>

              {/* Informational banner */}
              <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Basic Checkout:</strong> Demo store sandbox. No credit card or real financial transaction required.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  onClick={() => setPaymentMethod('Cash on Delivery (Demo)')}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'Cash on Delivery (Demo)'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</h4>
                      <p className="text-[10px] text-slate-500">Settle invoice upon physical delivery</p>
                    </div>
                  </div>
                  {paymentMethod === 'Cash on Delivery (Demo)' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </label>

                <label
                  onClick={() => setPaymentMethod('Demo Credit Card (Simulated)')}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'Demo Credit Card (Simulated)'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Simulated Digital Card</h4>
                      <p className="text-[10px] text-slate-500">Instant validation test credentials</p>
                    </div>
                  </div>
                  {paymentMethod === 'Demo Credit Card (Simulated)' && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </label>
              </div>
            </div>

            <button
              id="place-order-submit-btn"
              type="submit"
              disabled={submittingOrder}
              className="w-full py-3 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-2xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{submittingOrder ? 'Registering Order...' : `Confirm & Commit Order (${formatPrice(totalPrice)})`}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Order Review Sidebar (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs sticky top-20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Manifest Summary</span>
              <span className="text-[10px] font-mono text-slate-400">
                {cart.reduce((s, i) => s + i.quantity, 0)} Units
              </span>
            </h3>

            {/* Cart Items mini list */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 mb-3">
              {cart.map((item) => (
                <div key={item.productId} className="py-2 flex items-center gap-2.5">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-10 h-10 rounded object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Qty: {item.quantity} × {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatPrice(itemsSubtotal)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedPromo})</span>
                  <span className="font-mono">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping ({shippingMethod === 'express' ? 'Express' : 'Standard'})</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {shippingPrice === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    formatPrice(shippingPrice)
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Tax (7%)</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatPrice(taxPrice)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-600 tracking-wider">Total Due</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
