import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  KeyRound,
  UserCheck,
  Mail,
  Phone,
  Building,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Clock,
  Laptop,
  Check,
  Smartphone,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { User, SecurityAlert } from '../types';
import { useOwner } from '../context/OwnerContext';

interface OwnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const OwnerSettingsModal: React.FC<OwnerSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onNotify,
}) => {
  const { ownerEmail, setOwnerEmail, refreshOwnerStatus } = useOwner();
  const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'password' | 'security'>('profile');

  // Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Email Change State
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Security Alerts State
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [selectedAlertForPreview, setSelectedAlertForPreview] = useState<SecurityAlert | null>(null);

  // Fetch Owner Profile & Alerts when opened
  useEffect(() => {
    if (isOpen && user?.token) {
      loadOwnerProfile();
      loadSecurityAlerts();
      refreshOwnerStatus();
    }
  }, [isOpen, user]);

  const loadOwnerProfile = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/owner/profile', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name || user.name || '');
        setPhone(data.phone || '');
        setStoreName(data.storeName || 'NovaStore Official Flagship');
        setAddress(data.address || '');
        setBio(data.bio || '');
        setEmailAlertsEnabled(data.emailAlertsEnabled !== false);
        if (data.email) {
          setOwnerEmail(data.email);
        }
      }
    } catch (err) {
      console.error('Failed to load owner profile:', err);
    }
  };

  const loadSecurityAlerts = async () => {
    if (!user?.token) return;
    setIsLoadingAlerts(true);
    try {
      const res = await fetch('/api/owner/security-alerts', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        if (data.alerts?.length > 0 && !selectedAlertForPreview) {
          setSelectedAlertForPreview(data.alerts[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load security alerts:', err);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          storeName: storeName.trim(),
          address: address.trim(),
          bio: bio.trim(),
          emailAlertsEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update owner profile');
      }

      onUserUpdated({
        ...user,
        name: data.owner.name,
        phone: data.owner.phone,
        storeName: data.owner.storeName,
        bio: data.owner.bio,
        address: data.owner.address,
        emailAlertsEnabled: data.owner.emailAlertsEnabled,
      });

      onNotify('Owner profile details updated successfully', 'success');
      loadSecurityAlerts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating profile';
      onNotify(message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler for changing owner email address
  const handleChangeOwnerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeError('');

    if (!user?.token) return;

    const targetEmail = newEmail.trim().toLowerCase();
    const confirmEmail = confirmNewEmail.trim().toLowerCase();

    if (!targetEmail) {
      setEmailChangeError('Please enter a valid new email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setEmailChangeError('Please enter a valid email format (e.g., owner@yourstore.com).');
      return;
    }

    if (targetEmail === user.email.toLowerCase()) {
      setEmailChangeError('The new email cannot be identical to your current email address.');
      return;
    }

    if (targetEmail !== confirmEmail) {
      setEmailChangeError('New email and confirmation email do not match.');
      return;
    }

    if (!emailChangePassword) {
      setEmailChangeError('Current password is required to verify email ID change authorization.');
      return;
    }

    setIsChangingEmail(true);
    try {
      const res = await fetch('/api/owner/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          newEmail: targetEmail,
          currentPassword: emailChangePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update owner email ID');
      }

      // Update global context & local state
      setOwnerEmail(data.newEmail);
      onUserUpdated({
        ...user,
        email: data.newEmail,
        isAdmin: true,
      });

      onNotify(
        `Owner Email successfully changed to ${data.newEmail}! Real-time security verification dispatched to both addresses.`,
        'success'
      );

      // Reset form
      setNewEmail('');
      setConfirmNewEmail('');
      setEmailChangePassword('');
      loadSecurityAlerts();
      refreshOwnerStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update owner email';
      setEmailChangeError(message);
      onNotify(message, 'error');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!user?.token) return;

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/owner/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password update failed');
      }

      onNotify(`Password changed successfully! Security alert dispatched to ${user.email}`, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadSecurityAlerts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(message);
      onNotify(message, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendTestAlert = async () => {
    if (!user?.token) return;

    setIsSendingTestAlert(true);
    try {
      const res = await fetch('/api/owner/test-security-alert', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test notification');
      }

      onNotify(`Test security email dispatched to ${user.email}`, 'success');
      loadSecurityAlerts();
      if (data.alert) {
        setSelectedAlertForPreview(data.alert);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Test alert failed';
      onNotify(message, 'error');
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="owner-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="owner-settings-modal"
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with Store Owner Shield Branding */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Owner Security & Store Management</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Owner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exclusive access portal for <span className="text-amber-300 font-mono font-medium">{user?.email || ownerEmail}</span>
              </p>
            </div>
          </div>
          <button
            id="owner-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-2 text-xs font-semibold gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            id="tab-owner-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Owner Profile & Store Details
          </button>

          <button
            type="button"
            id="tab-owner-email"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" /> Change Owner Email ID
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
              Transfer
            </span>
          </button>

          <button
            type="button"
            id="tab-owner-password"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Change Password
          </button>

          <button
            type="button"
            id="tab-owner-security"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Email Security Alerts</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: OWNER PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 text-xs">Store Owner Identity Safeguard</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Your authenticated primary email is currently{' '}
                    <span className="font-bold font-mono text-indigo-900">{user?.email || ownerEmail}</span>.
                    You can switch or update this ID at any time via the <strong>Change Owner Email ID</strong> tab.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Store Owner Name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Authorized Owner Email</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('email')}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-0.5"
                    >
                      Change Email ID &rarr;
                    </button>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ownerEmail}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-xs font-mono cursor-not-allowed"
                    />
                    <span className="absolute right-2 text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Store / Business Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. NovaStore Official Flagship"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Store HQ / Dispatch Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Store HQ Address, City, Country"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Owner Bio & Business Notice
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Notes about store operations or owner verified description"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs"
                />
              </div>

              {/* Security Alert Email Dispatch Preference */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Login Notification Dispatches
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Automatically transmit security alert emails to <span className="font-semibold text-amber-900">{user?.email || ownerEmail}</span> on every sign-in.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlertsEnabled}
                    onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Owner Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CHANGE OWNER EMAIL ID */}
          {activeTab === 'email' && (
            <form onSubmit={handleChangeOwnerEmail} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 text-xs">Authorize Store Owner Email ID Transfer</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Changing your store owner email address updates the system account that possesses administrator authority to add or delete catalog items, adjust store settings, and receive critical security alerts.
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-1">
                    An audit notification and verification receipt will be automatically dispatched to both the current address (<span className="font-mono">{user?.email || ownerEmail}</span>) and your new email address.
                  </p>
                </div>
              </div>

              {emailChangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{emailChangeError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Current Authorized Email</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{user?.email || ownerEmail}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  Active Owner
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    New Owner Email ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. newowner@yourstore.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Confirm New Owner Email ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={confirmNewEmail}
                      onChange={(e) => setConfirmNewEmail(e.target.value)}
                      placeholder="Re-enter new email address"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Current Owner Password (Required for Security Verification)
                </label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    required
                    value={emailChangePassword}
                    onChange={(e) => setEmailChangePassword(e.target.value)}
                    placeholder="Enter your current password to authorize email transfer"
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50/80 rounded-lg p-3 border border-indigo-100 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <p className="text-[11px] text-indigo-900">
                  Upon confirmation, the new email will immediately hold owner rights for product listings, SKU additions, deletions, and password rotation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingEmail}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isChangingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying &amp; Updating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" /> Transfer Owner Email ID
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CHANGE OWNER PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 leading-relaxed text-xs">
                  <p className="font-bold text-slate-900">Secure Credential Rotation</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Changing your password requires verifying your current password. A high-priority security notification will be immediately dispatched to <span className="font-bold font-mono text-indigo-900">{user?.email || ownerEmail}</span> upon change.
                  </p>
                </div>
              </div>

              {passwordError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2.5 flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Current Owner Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (default: admin123)"
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    New Password (Min 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-600 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Password Strength:</span>
                  <span
                    className={`font-bold ${
                      newPassword.length >= 8
                        ? 'text-emerald-600'
                        : newPassword.length >= 6
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Fair' : 'Too Short'}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" /> Update Owner Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: EMAIL SECURITY ALERTS & LOGIN NOTIFICATIONS */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              {/* Security Shield Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-xs">Live Login Email Protection Active</p>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Every time the Store Owner logs in, a real-time security alert is logged and sent to <span className="font-bold text-slate-900">{user?.email || ownerEmail}</span>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={isSendingTestAlert}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  {isSendingTestAlert ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Test Alert to Email
                </button>
              </div>

              {/* Live Interactive Email Notice Viewer */}
              {selectedAlertForPreview ? (
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-800 text-white p-2.5 px-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-400" />
                      <span className="font-bold">Email Inbox Simulation ({selectedAlertForPreview.email || user?.email || ownerEmail})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                      STATUS: {selectedAlertForPreview.status}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 space-y-3">
                    <div className="space-y-1 text-slate-600 border-b border-slate-200 pb-2.5">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">From:</span>
                        <span className="font-mono text-slate-700">NovaStore Security Authority &lt;security@novastore.com&gt;</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">To:</span>
                        <span className="font-mono font-bold text-indigo-700">{selectedAlertForPreview.email || user?.email || ownerEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-900">Subject:</span>
                        <span className="font-bold text-slate-800">{selectedAlertForPreview.title}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Date & Time:</span>
                        <span>{new Date(selectedAlertForPreview.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                        <Shield className="w-4 h-4" />
                        <span>Security Login Dispatch Verification</span>
                      </div>

                      <p className="text-slate-700 leading-relaxed text-xs">
                        {selectedAlertForPreview.message}
                      </p>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-md text-[11px] text-slate-600">
                        <div>
                          <span className="block font-bold text-slate-700">IP Address:</span>
                          <span className="font-mono">{selectedAlertForPreview.ipAddress}</span>
                        </div>
                        <div>
                          <span className="block font-bold text-slate-700">Verification Code:</span>
                          <span className="font-mono font-bold text-indigo-600">{selectedAlertForPreview.securityCode}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block font-bold text-slate-700">Client Agent:</span>
                          <span className="truncate block font-mono text-[10px]">{selectedAlertForPreview.userAgent}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>If this login was initiated by you, no action is required.</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Security Audit Trail List */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Recent Owner Sign-In & Security History ({alerts.length})
                </h3>

                {isLoadingAlerts ? (
                  <div className="text-center py-6 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No alerts logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {alerts.map((alert) => (
                      <div
                        key={alert._id}
                        onClick={() => setSelectedAlertForPreview(alert)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          selectedAlertForPreview?._id === alert._id
                            ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              alert.eventType === 'PASSWORD_CHANGED'
                                ? 'bg-amber-100 text-amber-700'
                                : alert.eventType === 'LOGIN_SUCCESS'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {alert.eventType === 'PASSWORD_CHANGED' ? (
                              <KeyRound className="w-3.5 h-3.5" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs leading-tight">
                              {alert.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                              <span>•</span>
                              <span className="font-mono">{alert.ipAddress}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Sent to Email
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            {alert.securityCode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
