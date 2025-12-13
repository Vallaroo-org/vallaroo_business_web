'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Business, Shop, StaffMember } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

interface BusinessContextType {
    businesses: Business[];
    shops: Shop[];
    selectedBusiness: Business | null;
    selectedShop: Shop | null;
    currentStaff: StaffMember | null; // Added currentStaff
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
    const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null); // State for current staff
    const [userStaffRecords, setUserStaffRecords] = useState<StaffMember[]>([]); // cache all records
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    // Helper to determine active staff record based on context
    const determineActiveStaff = (
        staffList: StaffMember[],
        business: Business | null,
        shop: Shop | null
    ): StaffMember | null => {
        if (!staffList.length) return null;

        // 1. Shop Context
        if (shop) {
            // A. Specific shop role
            const shopRole = staffList.find(s => s.shop_id === shop.id);
            if (shopRole) return shopRole;

            // B. Business-level role for this shop's business
            const businessRole = staffList.find(s => s.business_id === shop.business_id && !s.shop_id);
            if (businessRole) return businessRole;
        }

        // 2. Business Context
        if (business) {
            // A. Business-level role
            const businessRole = staffList.find(s => s.business_id === business.id && !s.shop_id);
            if (businessRole) return businessRole;

            // B. Any role for this business
            const anyRole = staffList.find(s => s.business_id === business.id);
            if (anyRole) return anyRole;
        }

        // 3. Fallback
        return staffList[0];
    };

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

            // 2. Fetch ALL businesses logic via Staff Members
            // Get ALL staff records for this user (to support multi-role logic)
            const { data: allStaffMembers } = await supabase
                .from('staff_members')
                .select('*, roles(name, role_permissions(permissions(slug)))') // Join roles if needed, though types uses flat role. 
                // Note: The previous Flutter fix relied on explicit role table joins. 
                // Here types.ts StaffRole is a string enum. Let's assume the view or query handles it or we map it.
                // Actually the types.ts definitions for StaffMember has 'role: StaffRole'. 
                // The DB staff_members table has role_id. 
                // We should probably select everything and let Supabase mapping logic (if any) or manual mapping occur.
                // For now, let's select basic columns matching the type.
                .eq('user_id', user.id);

            const typedStaffList = (allStaffMembers || []) as unknown as StaffMember[];
            // Note: DB returns snake_case, Type expects snake_case for fields like business_id? 
            // Type definition in types.ts:
            // business_id: string; shop_id?: string; user_id?: string;
            // DB columns are business_id, shop_id. So keys match.

            setUserStaffRecords(typedStaffList);

            const staffBusinessIds = allStaffMembers?.map((sm: any) => sm.business_id) || [];

            let query = supabase.from('businesses').select('*');

            if (staffBusinessIds.length > 0) {
                query = query.or(`owner_id.eq.${user.id},id.in.(${staffBusinessIds.join(',')})`);
            } else {
                query = query.eq('owner_id', user.id);
            }

            const { data: businessesData, error: businessError } = await query;

            if (businessError) {
                console.error("Error fetching businesses:", businessError);
            }

            const fetchedBusinesses = businessesData as Business[] || [];
            setBusinesses(fetchedBusinesses);

            if (fetchedBusinesses.length === 0) {
                if (!pathname?.includes('/onboarding')) {
                    router.replace('/onboarding/business');
                }
                setIsLoading(false);
                return;
            }

            // 3. Determine Active Business
            let activeBusiness: Business | null = null;
            if (userProfile?.default_business_id) {
                activeBusiness = fetchedBusinesses.find(b => b.id === userProfile.default_business_id) || null;
            }
            if (!activeBusiness) {
                activeBusiness = fetchedBusinesses[0];
            }

            let activeShop: Shop | null = null;
            if (activeBusiness) {
                setSelectedBusiness(activeBusiness);

                // 4. Fetch Shops
                const { data: shopData } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('business_id', activeBusiness.id);

                const fetchedShops = shopData || [];
                setShops(fetchedShops);

                // 5. Determine Active Shop
                if (userProfile?.default_shop_id) {
                    activeShop = fetchedShops.find(s => s.id === userProfile.default_shop_id) || null;
                }
                if (!activeShop) {
                    activeShop = fetchedShops[0] || null;
                }
                setSelectedShop(activeShop);
            }

            // 6. Set Active Staff using new logic
            const activeStaff = determineActiveStaff(typedStaffList, activeBusiness, activeShop);
            setCurrentStaff(activeStaff);

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
            updateDefaultPreference(business.id, undefined);
            setIsLoading(true);
            const { data: shopData } = await supabase
                .from('shops')
                .select('*')
                .eq('business_id', business.id);

            const fetchedShops = shopData || [];
            setShops(fetchedShops);

            const newShop = fetchedShops[0] || null;
            setShop(newShop); // This will update shop & staff

            // Recalculate staff for new business context (shop is newShop)
            const newStaff = determineActiveStaff(userStaffRecords, business, newShop);
            setCurrentStaff(newStaff);

            setIsLoading(false);
        } else {
            setShops([]);
            setShop(null);
            setCurrentStaff(null);
        }
    };

    const setShop = (shop: Shop | null) => {
        setSelectedShop(shop);
        if (shop) {
            updateDefaultPreference(undefined, shop.id);
        }
        // Recalculate staff for new shop context
        const newStaff = determineActiveStaff(userStaffRecords, selectedBusiness, shop);
        setCurrentStaff(newStaff);
    };

    return (
        <BusinessContext.Provider
            value={{
                businesses,
                shops,
                selectedBusiness,
                selectedShop,
                currentStaff,
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
