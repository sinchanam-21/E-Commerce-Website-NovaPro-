import React, { createContext, useContext, useState, useEffect } from 'react';

interface OwnerContextType {
  ownerEmail: string;
  storeName: string;
  ownerName: string;
  setOwnerEmail: (email: string) => void;
  refreshOwnerStatus: () => Promise<void>;
  checkIsOwner: (email?: string, isAdmin?: boolean) => boolean;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export const OwnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownerEmail, setOwnerEmailState] = useState<string>(() => {
    try {
      return localStorage.getItem('novastore_owner_email') || 'oreooreooreo9@gmail.com';
    } catch {
      return 'oreooreooreo9@gmail.com';
    }
  });
  const [storeName, setStoreName] = useState<string>('NovaStore Official Flagship');
  const [ownerName, setOwnerName] = useState<string>('Store Owner');

  const refreshOwnerStatus = async () => {
    try {
      const res = await fetch('/api/owner/status');
      if (res.ok) {
        const data = await res.json();
        if (data.ownerEmail) {
          setOwnerEmailState(data.ownerEmail);
          try {
            localStorage.setItem('novastore_owner_email', data.ownerEmail);
          } catch {
            // ignore
          }
        }
        if (data.storeName) setStoreName(data.storeName);
        if (data.ownerName) setOwnerName(data.ownerName);
      }
    } catch (err) {
      console.warn('Failed to refresh owner status:', err);
    }
  };

  useEffect(() => {
    refreshOwnerStatus();
  }, []);

  const setOwnerEmail = (newEmail: string) => {
    const clean = newEmail.toLowerCase().trim();
    setOwnerEmailState(clean);
    try {
      localStorage.setItem('novastore_owner_email', clean);
    } catch {
      // ignore
    }
  };

  const checkIsOwner = (email?: string, isAdmin?: boolean) => {
    if (!email) return false;
    const cleanUserEmail = email.toLowerCase().trim();
    const cleanOwnerEmail = ownerEmail.toLowerCase().trim();
    return cleanUserEmail === cleanOwnerEmail || (Boolean(isAdmin) && cleanUserEmail === cleanOwnerEmail);
  };

  return (
    <OwnerContext.Provider
      value={{
        ownerEmail,
        storeName,
        ownerName,
        setOwnerEmail,
        refreshOwnerStatus,
        checkIsOwner,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
};

export const useOwner = (): OwnerContextType => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwner must be used within an OwnerProvider');
  }
  return context;
};
