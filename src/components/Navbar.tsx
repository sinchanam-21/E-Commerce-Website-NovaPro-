import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  PackageCheck,
  PackagePlus,
  ShieldCheck,
  LogOut,
  X,
  Menu,
  ChevronDown,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { User } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useOwner } from '../context/OwnerContext';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'owner') => void;
  onLogout: () => void;
  onOpenOrders: () => void;
  onOpenAddProduct?: () => void;
  onOpenOwnerSettings?: () => void;
  onSelectCategory: (category: string) => void;
  activeCategory: string;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onOpenOrders,
  onOpenAddProduct,
  onOpenOwnerSettings,
  onSelectCategory,
  activeCategory,
  onNavigateHome,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currency, setCurrency, exchangeRate } = useCurrency();
  const { ownerEmail } = useOwner();

  const isOwner = Boolean(
    user && (user.isAdmin || (ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase()))
  );

  const categories = [
    'All',
    'Fashion',
    'Mobiles',
    'Electronics',
    'Audio',
    'Home & Kitchen',
    'Beauty',
    'Footwear',
    'Wearables',
    'Accessories',
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Status & System Strip */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">System Online</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">Cloud Sync</span>
            <span className="hidden sm:inline">• Real-time Multi-Device Active (Firestore)</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-slate-400 hidden lg:inline font-mono">
            1 USD ≈ ₹{exchangeRate.toFixed(2)}
          </span>
          <span className="text-slate-400 hidden md:inline">Express Dispatch Active</span>
          <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-300 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
            PROMO: SAVE10
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Brand & Status */}
          <div className="flex items-center space-x-3">
            <button
              id="nav-brand-logo"
              onClick={onNavigateHome}
              className="flex items-center space-x-2.5 text-left group focus:outline-none"
            >
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-xs group-hover:bg-indigo-500 transition-colors">
                N
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  NOVA<span className="text-indigo-600">PRO</span>
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded uppercase tracking-wider">
                  Active
                </span>
              </div>
            </button>
          </div>

          {/* Search bar (Desktop) - High Density */}
          <div className="hidden md:flex flex-1 max-w-sm mx-3 relative">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input-desktop"
                type="text"
                placeholder="Search catalog by SKU, title, specs..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8.5 pr-8 py-1.5 rounded-lg text-xs border border-slate-200 bg-slate-50 hover:bg-slate-100/80 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none text-slate-800"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Currency Selector Toggle: USD ($) vs INR (₹) */}
            <div
              id="currency-switcher"
              className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px]"
              title={`Active currency: ${currency === 'USD' ? 'US Dollar ($)' : 'Indian Rupee (₹)'} • 1 USD ≈ ₹${exchangeRate.toFixed(2)}`}
            >
              <button
                id="currency-toggle-usd"
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                  currency === 'USD'
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label="Set currency to US Dollar"
              >
                <span>$</span>
                <span className="hidden sm:inline">USD</span>
              </button>

              <button
                id="currency-toggle-inr"
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-0.5 ${
                  currency === 'INR'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label="Set currency to Indian Rupee"
              >
                <span>₹</span>
                <span className="hidden sm:inline">INR</span>
              </button>
            </div>

            {/* Orders shortcut */}
            <button
              id="nav-orders-btn"
              onClick={onOpenOrders}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition-colors"
              title="View your orders"
            >
              <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Orders</span>
            </button>

            {/* Store Owner Actions: Add Product & Security Portal */}
            {isOwner && (
              <>
                <button
                  id="nav-add-product-btn"
                  onClick={onOpenAddProduct}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all shadow-2xs"
                  title="Add New SKU (Store Owner Only)"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">+ Add SKU</span>
                </button>

                <button
                  id="nav-owner-settings-btn"
                  onClick={onOpenOwnerSettings}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-md transition-all shadow-2xs"
                  title={`Owner Profile, Password & Security Alerts (${ownerEmail})`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden lg:inline">Owner Security</span>
                </button>
              </>
            )}

            {/* User Account / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                    isOwner
                      ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isOwner
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
                    }`}
                  >
                    {isOwner ? <ShieldCheck className="w-3 h-3" /> : user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-slate-800 max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</p>
                        {isOwner && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold uppercase tracking-wider">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    {isOwner && (
                      <>
                        <button
                          id="dropdown-add-product"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenAddProduct?.();
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 flex items-center gap-2 border-b border-slate-100 transition-colors"
                        >
                          <PackagePlus className="w-4 h-4 text-indigo-600" />
                          <span>+ Add New Product SKU</span>
                        </button>

                        <button
                          id="dropdown-owner-security"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenOwnerSettings?.();
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100/80 flex items-center gap-2 border-b border-slate-100 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Owner Details & Security</span>
                        </button>
                      </>
                    )}

                    <button
                      id="dropdown-my-orders"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>My Orders</span>
                    </button>

                    <button
                      id="dropdown-logout-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="sign-in-btn"
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-md transition-all"
                  title="Sign in to your customer account"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </button>

                {/* Extra Feature: Direct Store Owner Gateway Access Near Sign In */}
                <button
                  id="nav-owner-login-btn"
                  onClick={() => onOpenAuth('owner')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100/90 border border-amber-300 rounded-md transition-all shadow-2xs group"
                  title="Store Owner Security Gateway Portal"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
                  <span className="hidden sm:inline">Owner Login</span>
                </button>
              </div>
            )}

            {/* Cart Button */}
            <button
              id="open-cart-btn"
              onClick={onOpenCart}
              className="relative px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span
                  id="cart-badge-count"
                  className="bg-white text-indigo-700 font-black text-[10px] px-1.5 py-0.2 rounded-sm"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input & currency switcher */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-2.5 pt-1 space-y-2">
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Display Currency:</span>
              <div className="flex items-center bg-white p-0.5 rounded border border-slate-200">
                <button
                  id="mobile-currency-usd"
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    currency === 'USD'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  $ USD
                </button>
                <button
                  id="mobile-currency-inr"
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    currency === 'INR'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ₹ INR
                </button>
              </div>
            </div>

            {isOwner && (
              <div className="space-y-1.5">
                <button
                  id="mobile-owner-add-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAddProduct?.();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <PackagePlus className="w-4 h-4 text-indigo-600" />
                  <span>+ Add New Product SKU</span>
                </button>

                <button
                  id="mobile-owner-security-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOwnerSettings?.();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Owner Details, Password & Security Alerts</span>
                </button>
              </div>
            )}

            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-input-mobile"
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8.5 pr-8 py-1.5 rounded-md text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Navigation Bar - High Density Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1.5 border-t border-slate-100 no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                id={`cat-nav-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  onSelectCategory(cat);
                  onNavigateHome();
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 text-indigo-700 font-bold border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
