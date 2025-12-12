'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Business, Shop } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

interface BusinessContextType {
    businesses: Business[];
    shops: Shop[];
    selectedBusiness: Business | null;
    selectedShop: Shop | null;
    isLoading: boolean;
    setBusiness: (business: Business | null) => void;
    setShop: (shop: Shop) => void;
    refreshContext: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const loadContext = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            // 1. Fetch User Profile for defaults
            const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // 2. Fetch businesses (User is staff/owner)
            const { data: staffMembers } = await supabase
                .from('staff_members')
                .select('business:businesses(*)')
                .eq('user_id', user.id);

            const fetchedBusinesses = staffMembers
                ?.map((item: { business: Business | Business[] | null }) => item.business)
                .flat()
                .filter((b: Business | null) => b !== null) as Business[] || [];

            setBusinesses(fetchedBusinesses);

            if (fetchedBusinesses.length === 0) {
                if (!pathname?.includes('/onboarding')) {
                    router.replace('/onboarding/business');
                }
                setIsLoading(false);
                return;
            }

            // 3. Determine Active Business
            // Priority: UserProfile Default -> First in list
            let activeBusiness: Business | null = null;

            // Prefer UserProfile default if available
            if (userProfile?.default_business_id) {
                activeBusiness = fetchedBusinesses.find(b => b.id === userProfile.default_business_id) || null;
            }

            // Fallback to first business
            if (!activeBusiness) {
                activeBusiness = fetchedBusinesses[0];
            }

            if (activeBusiness) {
                // Set business but don't trigger the setter's side effects yet to avoid double fetching
                setSelectedBusiness(activeBusiness);

                // 4. Fetch Shops for Active Business
                const { data: shopData } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('business_id', activeBusiness.id);

                const fetchedShops = shopData || [];
                setShops(fetchedShops);

                // 5. Determine Active Shop
                // Priority: UserProfile Default -> First in list
                let activeShop: Shop | null = null;
                if (userProfile?.default_shop_id) {
                    activeShop = fetchedShops.find(s => s.id === userProfile.default_shop_id) || null;
                }

                if (!activeShop) {
                    activeShop = fetchedShops[0] || null;
                }

                setSelectedShop(activeShop);
            }

        } catch (error) {
            console.error('Error loading business context:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContext();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const updateDefaultPreference = async (businessId?: string, shopId?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updates: Record<string, string> = {};
        if (businessId) updates.default_business_id = businessId;
        if (shopId) updates.default_shop_id = shopId;

        await supabase.from('user_profiles').upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() });
    };

    const setBusiness = async (business: Business | null) => {
        setSelectedBusiness(business);

        if (business) {
            // Update User Profile Default
            updateDefaultPreference(business.id, undefined);

            setIsLoading(true);
            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('business_id', business.id);

            const fetchedShops = shopData || [];
            setShops(fetchedShops);

            // Default to first shop or existing default if valid
            const newShop = fetchedShops[0] || null;
            setShop(newShop); // This will also update default shop
            setIsLoading(false);
        } else {
            setShops([]);
            setShop(null);
        }
    };

    const setShop = (shop: Shop | null) => {
        setSelectedShop(shop);
        if (shop) {
            updateDefaultPreference(undefined, shop.id);
        }
    };

    return (
        <BusinessContext.Provider
            value={{
                businesses,
                shops,
                selectedBusiness,
                selectedShop,
                isLoading,
                setBusiness,
                setShop,
                refreshContext: loadContext,
            }}
        >
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
}
