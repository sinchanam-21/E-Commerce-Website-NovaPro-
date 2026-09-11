import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Order } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface OrderConfirmationProps {
  order: Order;
  onContinueShopping: () => void;
  onViewOrders: () => void;
  onCancelOrder?: (orderId: string, reason?: string) => Promise<boolean>;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onContinueShopping,
  onViewOrders,
  onCancelOrder,
  onNotify,
}) => {
  const { formatPrice } = useCurrency();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Fire festive celebratory confetti only if order is active
    if (order.status !== 'Cancelled') {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback safely ignored
      }
    }
  }, [order.status]);

  const handleConfirmCancel = async () => {
    if (!onCancelOrder) return;
    setCancelling(true);
    try {
      const success = await onCancelOrder(order._id, cancelReason);
      if (success) {
        setShowCancelDialog(false);
      }
    } catch (err) {
      console.error('Error in handleConfirmCancel:', err);
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Hero Card - High Density */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-7 text-center">
        {isCancelled ? (
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
        )}

        {isCancelled ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            Order Voided / Cancelled
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            Order Manifest Registered
          </span>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
          {isCancelled
            ? 'Order Cancelled Successfully'
            : 'Transaction Committed Successfully'}
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {isCancelled ? (
            <>
              Order <strong className="text-slate-800 font-mono">{order.orderNumber}</strong> has been cancelled.
              All reserved item quantities were automatically returned to the active warehouse catalog.
            </>
          ) : (
            <>
              Fulfillment pipeline activated. Dispatch notification sent to{' '}
              <strong className="text-slate-800 font-mono">{order.customerEmail}</strong>.
            </>
          )}
        </p>

        {isCancelled && order.cancellationReason && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50/80 px-3 py-1.5 rounded-lg border border-rose-200/80">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Reason: <strong>{order.cancellationReason}</strong></span>
          </div>
        )}

        {/* Order Identifier & Delivery ETA Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-left">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Order Ledger ID</span>
            <span id="confirmed-order-number" className="text-xs font-bold text-slate-900 font-mono">
              {order.orderNumber}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              {isCancelled ? 'Cancellation Date' : 'Estimated Transit ETA'}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-mono">
                {isCancelled && order.cancelledAt
                  ? new Date(order.cancelledAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : order.estimatedDelivery}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pipeline Status</span>
            <div className="flex items-center gap-1 text-xs font-bold">
              {isCancelled ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelled (Restocked)</span>
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{order.status} (Verified)</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Order Details & Summary */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Purchased Items List */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <span>Manifest Items</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{order.orderItems.length} SKUs</span>
            </h4>

            <div className="space-y-2 divide-y divide-slate-100">
              {order.orderItems.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center gap-2.5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 rounded object-cover border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Consignee Destination</span>
              </h4>

              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="text-slate-400 font-mono mt-0.5 text-[10px]">{order.shippingAddress.phone}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Payment Mode</span>
                <span className="font-semibold text-slate-900">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Freight Classification</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {order.shippingMethod}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span className="uppercase tracking-wider">Settled Balance</span>
                <span className={`font-black text-sm font-mono ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            id="order-confirmation-continue-btn"
            onClick={onContinueShopping}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Return to Catalog</span>
          </button>

          <button
            id="order-confirmation-orders-btn"
            onClick={onViewOrders}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-200"
          >
            <span>Audit All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Cancel Order Option Button (if order is not already cancelled) */}
          {!isCancelled && onCancelOrder && (
            <button
              id="order-confirmation-cancel-btn"
              onClick={() => setShowCancelDialog(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-rose-200"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal / Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-xl text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cancel Order {order.orderNumber}?
              </h3>
            </div>

            <div className="py-3 text-xs text-slate-600 space-y-3">
              <p>
                Are you sure you want to cancel this order? This action will immediately void the shipment and restore <strong>{order.orderItems.reduce((s, i) => s + i.quantity, 0)} items</strong> back to the store's stock.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  id="cancel-reason-select"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Delivery ETA too long">Delivery ETA too long</option>
                  <option value="Incorrect shipping address entered">Incorrect shipping address entered</option>
                  <option value="Other / Testing demo cancel">Other / Testing demo cancel</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                id="confirm-cancel-order-modal-btn"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                {cancelling ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
