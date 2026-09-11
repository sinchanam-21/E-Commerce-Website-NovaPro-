import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Truck,
  ShieldCheck,
  RefreshCw,
  Search,
  Package,
} from 'lucide-react';
import { Product, CartItem, User, Order, ViewMode } from './types';
import { allProducts } from './data';
import {
  getInitialCatalog,
  sanitizeAndPersistCatalog,
  saveDeletedProductId,
  removeCustomProduct,
  saveCustomProduct,
  resetFactoryCatalog,
  getDeletedProductIds,
  getCustomAddedProducts,
} from './utils/catalogStorage';
import {
  subscribeToCloudCatalog,
  syncDeletionToCloud,
  syncCustomProductToCloud,
  syncResetToCloud,
} from './utils/cloudSync';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderConfirmation } from './components/OrderConfirmation';
import { AuthModal } from './components/AuthModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { FiltersBar } from './components/FiltersBar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AddProductModal } from './components/AddProductModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { MeeshoCategoryBar } from './components/MeeshoCategoryBar';
import { OwnerSettingsModal } from './components/OwnerSettingsModal';
import { useCurrency } from './context/CurrencyContext';
import { useOwner } from './context/OwnerContext';

export default function App() {
  const { formatPrice } = useCurrency();
  const { ownerEmail } = useOwner();
  // Navigation & View State
  const [currentView, setCurrentView] = useState<ViewMode>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Products Data State - Preloaded with persistent catalog state (respecting deletions & additions)
  const [products, setProducts] = useState<Product[]>(() => getInitialCatalog());
  const [loading, setLoading] = useState(false);

  // Filter & Search State
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Cart & Promo State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('novastore_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedPromo, setAppliedPromo] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // User & Auth State
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('novastore_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'owner'>('login');

  // Orders State
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Store Owner Product & Security Management State (oreooreooreo9@gmail.com)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isOwnerSettingsOpen, setIsOwnerSettingsOpen] = useState(false);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isOwner = Boolean(
    user && (user.isAdmin || (ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase()))
  );

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('novastore_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [cart]);

  // Sync User to LocalStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('novastore_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('novastore_user');
      }
    } catch (e) {
      console.warn('LocalStorage save user failed:', e);
    }
  }, [user]);

  // Load Products from Express API & Real-time Cloud Sync
  useEffect(() => {
    fetchProducts();

    // Real-time Firebase Cloud synchronization across all devices & links
    const unsubscribe = subscribeToCloudCatalog(({ deletedIds, customProducts }) => {
      setProducts(() => {
        const activeBase = allProducts.filter((p) => !deletedIds.includes(p._id));
        const merged = [...customProducts, ...activeBase];
        try {
          localStorage.setItem('novastore_catalog', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Non-JSON response (Static hosting mode)');
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Sanitize with local and cloud deletion tracking
        const sanitized = sanitizeAndPersistCatalog(data);
        setProducts(sanitized);
        return;
      }
    } catch (err) {
      // Backend not running (e.g. deployed on Vercel as static site) or offline
      console.info('Using local & cloud persistent catalog tracking:', err);
      setProducts(getInitialCatalog());
    } finally {
      setLoading(false);
    }
  };

  // Toast Notification Helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product._id);
      if (existing) {
        const nextQty = Math.min(product.countInStock, existing.quantity + quantity);
        return prevCart.map((item) =>
          item.productId === product._id ? { ...item, quantity: nextQty } : item
        );
      } else {
        return [...prevCart, { productId: product._id, product, quantity }];
      }
    });

    addToast('success', 'Added to Cart', `${product.name} (x${quantity})`);
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setCurrentView('checkout');
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(item.product.countInStock, quantity) }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    addToast('info', 'Item Removed', 'Product was removed from your cart.');
  };

  const handleApplyPromo = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SAVE10' || clean === 'WELCOME20') {
      setAppliedPromo(clean);
      addToast(
        'success',
        'Coupon Applied!',
        clean === 'SAVE10' ? '10% discount activated!' : '20% discount activated!'
      );
      return true;
    }
    return false;
  };

  // Order Placement Success
  const handleOrderSuccess = (order: Order) => {
    setLastOrder(order);
    setCart([]);
    setAppliedPromo('');
    setCurrentView('order-success');
    addToast('success', 'Order Confirmed!', `Order ${order.orderNumber} successfully registered.`);
    // Re-fetch products to update stock numbers
    fetchProducts();
  };

  // Cancel Order Handler
  const handleCancelOrder = async (orderId: string, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        const updatedOrder: Order = await res.json();
        if (lastOrder && (lastOrder._id === orderId || lastOrder.orderNumber === orderId)) {
          setLastOrder(updatedOrder);
        }
        addToast(
          'info',
          'Order Cancelled',
          `Order ${updatedOrder.orderNumber} voided. Reserved stock returned to store inventory.`
        );
        fetchProducts();
        return true;
      }
      throw new Error('API cancelled response not ok');
    } catch (err) {
      console.warn('API cancellation unavailable, updating order locally:', err);
      try {
        const saved = localStorage.getItem('novastore_orders');
        if (saved) {
          const ordersList: Order[] = JSON.parse(saved);
          const found = ordersList.find((o) => o._id === orderId || o.orderNumber === orderId);
          if (found) {
            found.status = 'Cancelled';
            found.cancelledAt = new Date().toISOString();
            found.cancellationReason = reason || 'Customer requested cancellation';
            localStorage.setItem('novastore_orders', JSON.stringify(ordersList));
            if (lastOrder && (lastOrder._id === orderId || lastOrder.orderNumber === orderId)) {
              setLastOrder({ ...found });
            }
            addToast(
              'info',
              'Order Cancelled',
              `Order ${found.orderNumber} voided. Reserved stock returned to store inventory.`
            );
            return true;
          }
        }
      } catch (storageErr) {
        console.warn('Local cancellation failed', storageErr);
      }
      addToast('info', 'Order Cancelled', `Order ${orderId} cancelled.`);
      return true;
    }
  };

  // Authentication Handlers
  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    setUser({ ...authenticatedUser, token });
    if (token) {
      localStorage.setItem('novastore_token', token);
    }
    if (authenticatedUser.email.toLowerCase() === 'oreooreooreo9@gmail.com') {
      addToast(
        'success',
        'Owner Security Login Alert Dispatched',
        `Real-time security notification and verification audit dispatched to ${authenticatedUser.email}.`
      );
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('novastore_token');
    addToast('info', 'Signed Out', 'You have been logged out of your account.');
  };

  // Store Owner Catalog Management Handlers
  const handleProductAdded = (newProduct: Product) => {
    saveCustomProduct(newProduct);
    syncCustomProductToCloud(newProduct);
    setProducts((prev) => {
      const filtered = prev.filter((p) => p._id !== newProduct._id);
      const updated = [newProduct, ...filtered];
      try {
        localStorage.setItem('novastore_catalog', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast('success', 'SKU Added', `"${newProduct.name}" is now live in your store catalog across all devices.`);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
  };

  const handleProductDeleted = (deletedId: string) => {
    // 1. Permanently record deletion in localStorage
    saveDeletedProductId(deletedId);
    // 2. Remove from custom products if it was a custom added SKU
    removeCustomProduct(deletedId);
    // 3. Broadcast deletion to Firebase Firestore so all other devices update instantly
    syncDeletionToCloud(deletedId);
    // 4. Update active React state
    setProducts((prev) => {
      const updated = prev.filter((p) => p._id !== deletedId);
      try {
        localStorage.setItem('novastore_catalog', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    // 5. Remove from shopping cart
    setCart((prev) => prev.filter((item) => item.productId !== deletedId));
    // 6. Navigate away if viewing the deleted product detail
    if (selectedProductId === deletedId) {
      setSelectedProductId(null);
      setCurrentView('catalog');
    }
  };

  // Restore factory catalog (clears deletions and custom overrides)
  const handleResetCatalog = async () => {
    const restored = resetFactoryCatalog();
    setProducts(restored);
    syncResetToCloud();

    try {
      const isOwner = Boolean(
        user && (user.isAdmin || user.email?.toLowerCase() === 'oreooreooreo9@gmail.com')
      );
      const token =
        user?.token ||
        localStorage.getItem('novastore_token') ||
        (isOwner ? 'owner-token-oreo' : '');

      await fetch('/api/products/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.info('Backend reset fallback:', err);
    }

    addToast(
      'success',
      'Factory Catalog Restored',
      'Product catalog successfully restored to original 90 items on all devices.'
    );
  };

  // Navigation Handlers
  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product._id);
    setCurrentView('product-detail');
  };

  const handleNavigateHome = () => {
    setSelectedProductId(null);
    setCurrentView('catalog');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSortBy('featured');
    setPriceRange('all');
    setInStockOnly(false);
  };

  const isFiltered =
    activeCategory !== 'All' ||
    searchQuery !== '' ||
    sortBy !== 'featured' ||
    priceRange !== 'all' ||
    inStockOnly;

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Search keyword
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Price range filter
    if (priceRange === 'under-50') {
      result = result.filter((p) => p.price < 50);
    } else if (priceRange === '50-150') {
      result = result.filter((p) => p.price >= 50 && p.price <= 150);
    } else if (priceRange === 'over-150') {
      result = result.filter((p) => p.price > 150);
    }

    // In-stock only
    if (inStockOnly) {
      result = result.filter((p) => p.countInStock > 0);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [products, activeCategory, searchQuery, priceRange, inStockOnly, sortBy]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const productsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={user}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onOpenOwnerSettings={() => setIsOwnerSettingsOpen(true)}
        onSelectCategory={setActiveCategory}
        activeCategory={activeCategory}
        onNavigateHome={handleNavigateHome}
      />

      {/* Main App Body */}
      <main className="flex-1">
        {currentView === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-150">
            {/* Store Owner Exclusive Security & Management Banner */}
            {isOwner && (
              <div
                id="owner-security-banner"
                className="mb-5 bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Owner Portal Active</span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                        {user?.email || ownerEmail}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      You have exclusive authority to add/delete inventory, edit owner details, rotate credentials, and inspect email security alerts.
                      <span className="ml-2 font-mono text-emerald-400 font-semibold inline-flex items-center gap-1">
                        • {products.length} active SKUs
                        {getDeletedProductIds().length > 0 && ` (${getDeletedProductIds().length} deleted)`}
                        {getCustomAddedProducts().length > 0 && ` (${getCustomAddedProducts().length} custom)`}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getDeletedProductIds().length > 0 && (
                    <button
                      id="owner-banner-restore-btn"
                      type="button"
                      onClick={handleResetCatalog}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                      title="Restore all 90 factory products and clear deleted items list"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restore Factory SKUs ({getDeletedProductIds().length})</span>
                    </button>
                  )}
                  <button
                    id="owner-banner-settings-btn"
                    type="button"
                    onClick={() => setIsOwnerSettingsOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Owner Details &amp; Password</span>
                  </button>
                  <button
                    id="owner-banner-add-btn"
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <span>+ Add New SKU</span>
                  </button>
                </div>
              </div>
            )}

            {/* Meesho & Flipkart Style Visual Category Rail with Trust Badges */}
            <MeeshoCategoryBar
              activeCategory={activeCategory}
              onSelectCategory={(cat) => {
                setActiveCategory(cat);
                handleNavigateHome();
              }}
              productsCountByCategory={productsCountByCategory}
            />

            {/* High Density Metric & Telemetry Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Catalog Inventory</span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">Live</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{products.length}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">SKUs in stock</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Dispatch SLA</span>
                  <span className="text-[9px] font-bold text-emerald-600 font-mono">99.8%</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">&lt; 24h</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Same-Day Pickup</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Buyer Satisfaction</span>
                  <span className="text-[9px] font-bold text-amber-600">★ 4.9 / 5</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">328</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Verified Reviews</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-lg p-3.5 border border-slate-800 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Promotion</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">SAVE10</span>
                  <span className="text-[10px] text-slate-300">10% Off Orders</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-2 flex items-center justify-between">
                  <span>Code valid at checkout</span>
                  <span className="text-indigo-400">Cart &gt;{formatPrice(50)}</span>
                </div>
              </div>
            </div>

            {/* Hero / Store Banner - High Density Compact Layout */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 text-white p-6 sm:p-8 mb-6 border border-slate-800 shadow-xs">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2.5 border border-indigo-500/30">
                    <Sparkles className="w-3 h-3 text-indigo-300" />
                    <span>NovaStore Pro • Full Catalog Active</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    High-Performance Hardware &amp; Creator Essentials
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                    Direct-to-consumer inventory with real-time stock allocation, Express API integration, and one-click demo checkout.
                  </p>
                </div>

                {/* Trust Metrics Pill Strip */}
                <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-semibold">Free Express Shipping &gt;{formatPrice(50)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-semibold">2-Year Official Warranty</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold">30-Day Hassle-Free Returns</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Sorting Toolbar */}
            <FiltersBar
              totalCount={filteredProducts.length}
              selectedCategory={activeCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              inStockOnly={inStockOnly}
              onToggleInStock={() => setInStockOnly(!inStockOnly)}
              onResetFilters={handleResetFilters}
              isFiltered={isFiltered}
            />

            {/* Products Grid - High Density Layout */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-lg border border-slate-200 p-3 animate-pulse space-y-2"
                  >
                    <div className="w-full aspect-[4/3] bg-slate-200 rounded-md" />
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto my-8 shadow-2xs">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center mx-auto mb-2.5">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No matching SKUs found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try broadening your search query or reset active filters.
                </p>
                <button
                  id="empty-reset-filters-btn"
                  onClick={handleResetFilters}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onSelectProduct={handleSelectProduct}
                    onAddToCart={handleAddToCart}
                    onDeleteProduct={isOwner ? handleOpenDeleteModal : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separate Product Details Page View */}
        {currentView === 'product-detail' && selectedProductId && (
          <ProductDetail
            productId={selectedProductId}
            user={user}
            onBack={handleNavigateHome}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProduct}
            onDeleteProduct={isOwner ? handleOpenDeleteModal : undefined}
            allProducts={products}
            onNotify={addToast}
          />
        )}

        {/* Basic Checkout Page View (No payment needed) */}
        {currentView === 'checkout' && (
          <CheckoutPage
            cart={cart}
            user={user}
            appliedPromo={appliedPromo}
            onBack={() => setCurrentView('catalog')}
            onOrderSuccess={handleOrderSuccess}
            onNotify={addToast}
          />
        )}

        {/* Order Confirmation Screen */}
        {currentView === 'order-success' && lastOrder && (
          <OrderConfirmation
            order={lastOrder}
            onContinueShopping={handleNavigateHome}
            onViewOrders={() => {
              setCurrentView('catalog');
              setIsOrdersOpen(true);
            }}
            onCancelOrder={handleCancelOrder}
            onNotify={addToast}
          />
        )}
      </main>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => setCurrentView('checkout')}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
      />

      {/* Authentication Modal (Login / Register / Owner Portal) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onNotify={addToast}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        user={user}
        onOrderCancelled={(cancelledOrder) => {
          if (
            lastOrder &&
            (lastOrder._id === cancelledOrder._id ||
              lastOrder.orderNumber === cancelledOrder.orderNumber)
          ) {
            setLastOrder(cancelledOrder);
          }
          fetchProducts();
        }}
        onNotify={addToast}
      />

      {/* Store Owner Product Add Modal (oreooreooreo9@gmail.com) */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        user={user}
        onProductAdded={handleProductAdded}
        onNotify={addToast}
      />

      {/* Store Owner Product Delete Modal (oreooreooreo9@gmail.com) */}
      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        user={user}
        onProductDeleted={handleProductDeleted}
        onNotify={addToast}
      />

      {/* Store Owner Profile, Password & Email Security Modal (oreooreooreo9@gmail.com) */}
      <OwnerSettingsModal
        isOpen={isOwnerSettingsOpen}
        onClose={() => setIsOwnerSettingsOpen(false)}
        user={user}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
          try {
            localStorage.setItem('novastore_user', JSON.stringify(updatedUser));
          } catch (e) {
            console.warn('LocalStorage save failed:', e);
          }
        }}
        onNotify={(msg, type) => addToast(type || 'info', 'Owner Security Alert', msg)}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Site Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-slate-900">
                  Nova<span className="text-indigo-600">Store</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Full-featured Mini E-Commerce Website built with React, Vite, Tailwind CSS, Express.js backend, and MongoDB document structure.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Express.js API &amp; MongoDB Document Store Online</span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Categories
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                {['Audio', 'Wearables', 'Electronics', 'Home Office', 'Accessories'].map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setActiveCategory(cat);
                        handleNavigateHome();
                      }}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Quick Features
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Shopping Cart ({totalCartCount})
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsOrdersOpen(true)}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Track Orders
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => (user ? handleLogout() : setIsAuthOpen(true))}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {user ? 'Sign Out' : 'Sign In / Register'}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} NovaStore Mini E-Commerce. All rights reserved.</p>
            <p className="text-[11px]">Designed with clean craftsmanship &amp; accessibility.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
