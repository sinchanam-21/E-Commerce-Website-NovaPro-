import React, { useEffect, useState } from 'react';
import {
  X,
  PackageCheck,
  Calendar,
  MapPin,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Order, User } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOrderCancelled?: (cancelledOrder: Order) => void;
  onNotify?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  onOrderCancelled,
  onNotify,
}) => {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders';
      if (user?.email) {
        url += `?email=${encodeURIComponent(user.email)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (!orderToCancel) return;
    setCancellingOrderId(orderToCancel._id);

    try {
      const res = await fetch(`/api/orders/${orderToCancel._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        onNotify?.('error', 'Cancellation Failed', errData.error || 'Unable to cancel this order.');
        return;
      }

      const updatedOrder: Order = await res.json();

      // Update state locally in the orders list
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );

      setOrderToCancel(null);
      onNotify?.(
        'info',
        'Order Cancelled',
        `Order ${updatedOrder.orderNumber} voided. Reserved stock returned to store inventory.`
      );
      onOrderCancelled?.(updatedOrder);
    } catch (err) {
      console.error('Error cancelling order:', err);
      onNotify?.('error', 'Network Error', 'Failed to communicate with cancellation service.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 z-10 max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Order Ledger History
              </h3>
              <p className="text-[11px] text-slate-500">
                {user ? `Records for ${user.email}` : 'Recent order transactions for this session'}
              </p>
            </div>
          </div>

          <button
            id="close-order-history-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 mt-2 font-mono">Synchronizing ledger...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">No Orders Found</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                You have not registered any hardware orders yet. Place an order to review it here.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isCancelled = order.status === 'Cancelled';

              return (
                <div
                  key={order._id}
                  className={`p-3.5 rounded-lg border transition-colors ${
                    isCancelled
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCancelled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>Cancelled</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{order.status}</span>
                        </span>
                      )}

                      <span
                        className={`text-xs font-black font-mono ${
                          isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="py-2.5 divide-y divide-slate-100 space-y-1.5">
                    {order.orderItems.map((item, i) => (
                      <div
                        key={i}
                        className="pt-1.5 first:pt-0 flex items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-7 h-7 rounded object-cover bg-slate-50 border border-slate-200 shrink-0"
                          />
                          <span className="truncate text-slate-700 font-medium text-xs">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px] shrink-0">
                          {item.quantity} × {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer details & Cancel Order Button */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">
                          {isCancelled ? 'Voided' : `Est: ${order.estimatedDelivery}`}
                        </span>
                      </div>
                    </div>

                    {/* Cancellation Action or Info */}
                    <div>
                      {isCancelled ? (
                        <span className="text-[10px] text-rose-600 font-medium italic">
                          {order.cancellationReason
                            ? `Reason: ${order.cancellationReason}`
                            : 'Order voided • Restocked'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={`cancel-order-btn-${order.orderNumber}`}
                          onClick={() => {
                            setOrderToCancel(order);
                            setCancelReason('Changed my mind');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                        >
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Cancel Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Cancel Order Confirmation Prompt */}
      {orderToCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-5 border border-slate-200 shadow-2xl text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Cancel Order {orderToCancel.orderNumber}?
              </h4>
            </div>

            <div className="py-3 text-xs text-slate-600 space-y-2.5">
              <p>
                Are you sure you want to cancel this order? Item units (
                {orderToCancel.orderItems.reduce((s, i) => s + i.quantity, 0)} total) will be returned immediately to store stock.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  id="order-history-cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Delivery ETA too long">Delivery ETA too long</option>
                  <option value="Incorrect shipping address entered">Incorrect shipping address entered</option>
                  <option value="Other / Demo Testing">Other / Demo Testing</option>
                </select>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={Boolean(cancellingOrderId)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                id="order-history-confirm-cancel-btn"
                onClick={handleExecuteCancel}
                disabled={Boolean(cancellingOrderId)}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                {cancellingOrderId ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Cancel</span>
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
