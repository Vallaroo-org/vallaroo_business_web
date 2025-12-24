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
    global_category?: string | null;
    global_sub_category?: string | null;
    global_category_id?: string | null;
    global_sub_category_id?: string | null;
    category?: ProductCategory;
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
    status?: string;
    paid_amount?: number;
    delivery_charge?: number | null;
    transactions?: BillTransaction[];
}

export interface BillTransaction {
    id: string;
    bill_id: string;
    amount: number;
    payment_method: string;
    note?: string | null;
    recorded_at: string;
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
    upi_id?: string | null;
    qr_code_url?: string | null;
    shop_type?: 'product' | 'service' | 'both';
    is_temporarily_closed?: boolean;
    closure_reason?: string | null;
    closure_start_date?: string | null;
    closure_end_date?: string | null;
    hide_shop_during_closure?: boolean;
    hide_products_during_closure?: boolean;
    hide_services_during_closure?: boolean;
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
    is_verified?: boolean;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    razorpay_subscription_id?: string;
    status: 'active' | 'created' | 'authenticated' | 'past_due' | 'halted' | 'cancelled' | 'completed' | 'expired';
    current_period_start?: string;
    current_period_end?: string;
    created_at: string;
    updated_at: string;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    currency: string;
    features: {
        max_businesses: number;
        max_shops_per_business: number;
    };
}

export interface OnlineOrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    variant_name?: string | null;
}

export interface OnlineOrder {
    id: string;
    shop_id: string;
    user_id?: string | null;
    customer_id?: string | null;
    customer_name: string;
    customer_phone: string;
    customer_address?: string | null;
    customer_latitude?: number | null;
    customer_longitude?: number | null;
    items: OnlineOrderItem[];
    total_amount: number;
    status: 'pending' | 'accepted' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled' | 'rejected';
    payment_method: string;
    payment_status: string;
    created_at: string;
    updated_at: string;
    note?: string | null;
    delivery_charge?: number | null;
}

export interface ServiceCategory {
    id: string;
    name: string;
    name_ml?: string | null;
    description?: string | null;
    description_ml?: string | null;
    image_url?: string | null;
    is_active: boolean;
    created_at?: string | null;
}

export interface Service {
    id: string;
    business_id: string;
    shop_id: string;
    category_id?: string | null;
    name: string;
    name_ml?: string | null;
    description?: string | null;
    description_ml?: string | null;
    price: number;
    price_type: 'FIXED' | 'STARTING_FROM';
    duration_minutes?: number | null;
    image_urls?: string[] | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    category?: ServiceCategory;
}
