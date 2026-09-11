import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency } from '../types';

export const USD_TO_INR_RATE = 83.5;

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  toggleCurrency: () => void;
  exchangeRate: number;
  symbol: string;
  currencyLabel: string;
  formatPrice: (amountInUSD: number) => string;
  convertPrice: (amountInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('novapro_currency');
      if (saved === 'INR' || saved === 'USD') {
        return saved;
      }
    } catch {
      // Storage access fallback
    }
    return 'USD';
  });

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    try {
      localStorage.setItem('novapro_currency', curr);
    } catch {
      // ignore
    }
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'INR' : 'USD');
  };

  const symbol = currency === 'USD' ? '$' : '₹';
  const currencyLabel = currency === 'USD' ? 'USD ($)' : 'INR (₹)';

  const convertPrice = (amountInUSD: number): number => {
    if (currency === 'INR') {
      return amountInUSD * USD_TO_INR_RATE;
    }
    return amountInUSD;
  };

  const formatPrice = (amountInUSD: number): string => {
    if (isNaN(amountInUSD)) return `${symbol}0.00`;

    if (currency === 'INR') {
      const inrValue = amountInUSD * USD_TO_INR_RATE;
      return `₹${inrValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return `$${amountInUSD.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate: USD_TO_INR_RATE,
        symbol,
        currencyLabel,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
