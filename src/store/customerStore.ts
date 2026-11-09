"use client";

import { create } from "zustand";
import {
  getCurrentCustomerAction,
  logoutCustomerAction,
  type CustomerProfileDTO,
} from "@/server/actions/ecommerce/customerActions";

interface CustomerStoreState {
  customer: CustomerProfileDTO | null;
  isLoaded: boolean;
  isLoading: boolean;

  setCustomer: (customer: CustomerProfileDTO | null) => void;
  fetchCustomer: (force?: boolean) => Promise<CustomerProfileDTO | null>;
  logout: () => Promise<void>;
}

export const useCustomerStore = create<CustomerStoreState>((set, get) => ({
  customer: null,
  isLoaded: false,
  isLoading: false,

  setCustomer: (customer) => {
    set({ customer, isLoaded: true, isLoading: false });
  },

  fetchCustomer: async (force = false) => {
    const state = get();
    if (state.isLoaded && !force) {
      return state.customer;
    }
    if (state.isLoading) {
      return state.customer;
    }

    set({ isLoading: true });
    try {
      const res = await getCurrentCustomerAction();
      const profile = res.success && res.data ? res.data : null;
      set({ customer: profile, isLoaded: true, isLoading: false });
      return profile;
    } catch {
      set({ customer: null, isLoaded: true, isLoading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      await logoutCustomerAction();
    } finally {
      set({ customer: null, isLoaded: true, isLoading: false });
    }
  },
}));
