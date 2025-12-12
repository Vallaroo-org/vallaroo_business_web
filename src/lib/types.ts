export interface Product {
    id: string;
    business_id: string;
    shop_id: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
    unit?: string | null;
    description?: string | null;
    category_id?: string | null;
    image_urls?: string[] | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    cost_price?: number | null;
    min_stock_alert: number;
    sku?: string | null;
    brand_name?: string | null;
    variants?: unknown[] | null; // Todo: Define variant type
    barcode?: string | null;
    manufacturing_date?: string | null;
    expiry_date?: string | null;
    name_ml?: string | null;
    description_ml?: string | null;
    unit_ml?: string | null;
    brand_name_ml?: string | null;
}

export interface ProductCategory {
    id: string;
    business_id: string;
    name: string;
    description?: string | null;
    name_ml?: string | null;
    description_ml?: string | null;
}

export interface Customer {
    id: string;
    created_at: string;
    business_id: string;
    shop_id?: string;
    name: string;
    name_ml?: string | null;
    phone_number?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    gstin?: string | null;
    updated_at?: string;
}

export interface BillItem {
    product_id: string;
    name: string;
    name_ml?: string | null;
    price: number;
    quantity: number;
    unit?: string | null;
    unit_ml?: string | null;
    discount?: number | null;
}

export interface Order {
    id: string;
    business_id: string;
    shop_id: string;
    bill_number: string;
    issued_at: string;
    items: BillItem[];
    subtotal: number;
    discount: number;
    total: number;
    customer_name?: string | null;
    customer_name_ml?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    customer_type?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    payment_status?: 'paid' | 'unpaid' | 'partial';
    paid_amount?: number;
}

export interface Business {
    id: string;
    owner_id: string;
    name: string;
    description?: string | null;
    phone_number?: string | null;
    address_line1?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    name_ml?: string | null;
    description_ml?: string | null;
    currency: string; // Default INR
    is_verified: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface Shop {
    id: string;
    business_id: string;
    name: string;
    description?: string | null;
    phone_number?: string | null;
    address_line1?: string | null;
    city?: string | null;
    category_id?: string | null;
    logo_url?: string | null;
    name_ml?: string | null;
    description_ml?: string | null;
    address_line1_ml?: string | null;
    city_ml?: string | null;
    opening_time?: string | null;
    closing_time?: string | null;
    delivery_available?: boolean | null;
    takeaway_available?: boolean | null;
    is_verified: boolean;
    is_hidden: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    subscription_plan?: string | null;
}

export interface Story {
    id: string;
    shop_id: string;
    media_url: string;
    media_type: string;
    created_at: string;
    expires_at: string;
}

export type StaffRole = 'owner' | 'partner' | 'manager' | 'cashier' | 'inventory' | 'staff' | 'viewer';

export interface StaffMember {
    id: string;
    business_id: string;
    shop_id?: string | null;
    user_id?: string | null;
    role: StaffRole;
    display_name: string;
    display_name_ml?: string | null;
    email?: string | null;
    phone_number?: string | null;
    profile_image_url?: string | null;
    is_active?: boolean;
    invited_at?: string | null;
    joined_at?: string | null;
}

export interface ShopCategory {
    id: string;
    business_id: string;
    name: string;
    name_ml?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface UserProfile {
    id: string; // references auth.users.id
    email?: string | null;
    display_name?: string | null;
    display_name_ml?: string | null;
    phone_number?: string | null;
    profile_image_url?: string | null;
    about?: string | null;
    about_ml?: string | null;
    default_business_id?: string | null;
    default_shop_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
}
