import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Purchases, { PurchasesOfferings, CustomerInfo } from 'react-native-purchases';

function getRCToken() {
  if (__DEV__ || Platform.OS === 'web') return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

const apiKey = getRCToken() ?? '';
let isConfigured = false;

if (apiKey && Platform.OS !== 'web') {
  try {
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('[Purchases] Configured with key:', apiKey.substring(0, 8) + '...');
  } catch (e) {
    console.warn('[Purchases] Failed to configure:', e);
  }
} else if (Platform.OS === 'web') {
  console.log('[Purchases] Skipping configuration on web platform');
}

export function useOfferings() {
  return useQuery<PurchasesOfferings | null>({
    queryKey: ['rc-offerings'],
    queryFn: async () => {
      if (!isConfigured) return null;
      const offerings = await Purchases.getOfferings();
      console.log('[Purchases] Offerings fetched:', JSON.stringify(offerings.current?.identifier));
      return offerings;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useThemePackOffering() {
  return useQuery<PurchasesOfferings | null>({
    queryKey: ['rc-offerings'],
    queryFn: async () => {
      if (!isConfigured) return null;
      const offerings = await Purchases.getOfferings();
      console.log('[Purchases] Offerings fetched for theme pack');
      return offerings;
    },
    staleTime: 1000 * 60 * 5,
    select: (data) => data,
  });
}

export function useCustomerInfo() {
  return useQuery<CustomerInfo | null>({
    queryKey: ['rc-customer-info'],
    queryFn: async () => {
      if (!isConfigured) return null;
      const info = await Purchases.getCustomerInfo();
      console.log('[Purchases] Customer info fetched');
      return info;
    },
    staleTime: 1000 * 60,
  });
}

export function useHasPremiumThemes() {
  const { data: customerInfo } = useCustomerInfo();
  if (__DEV__) return true;
  return customerInfo?.entitlements?.active?.['premium_themes'] !== undefined;
}

export function usePurchaseCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isConfigured) throw new Error('Purchases not available on this platform');
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.[0];
      if (!pkg) {
        throw new Error('No credit package available');
      }
      console.log('[Purchases] Purchasing package:', pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      console.log('[Purchases] Purchase completed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      queryClient.invalidateQueries({ queryKey: ['rc-offerings'] });
    },
  });
}

export function usePurchaseThemePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isConfigured) throw new Error('Purchases not available on this platform');
      const offerings = await Purchases.getOfferings();
      const themeOffering = offerings.all?.['theme_pack'];
      const pkg = themeOffering?.availablePackages?.[0];
      if (!pkg) {
        console.log('[Purchases] Available offerings:', Object.keys(offerings.all ?? {}));
        throw new Error('Theme pack not available');
      }
      console.log('[Purchases] Purchasing theme pack:', pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      console.log('[Purchases] Theme pack purchase completed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      queryClient.invalidateQueries({ queryKey: ['rc-offerings'] });
    },
  });
}

export function usePurchaseLevelPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isConfigured) throw new Error('Purchases not available on this platform');
      const offerings = await Purchases.getOfferings();
      const levelOffering = offerings.all?.['level_pack'];
      const pkg = levelOffering?.availablePackages?.[0];
      if (!pkg) {
        console.log('[Purchases] Available offerings:', Object.keys(offerings.all ?? {}));
        throw new Error('Level pack not available');
      }
      console.log('[Purchases] Purchasing level pack:', pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      console.log('[Purchases] Level pack purchase completed');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      queryClient.invalidateQueries({ queryKey: ['rc-offerings'] });
    },
  });
}

export function useRestorePurchases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isConfigured) throw new Error('Purchases not available on this platform');
      console.log('[Purchases] Restoring purchases...');
      const info = await Purchases.restorePurchases();
      console.log('[Purchases] Purchases restored');
      return info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
    },
  });
}
