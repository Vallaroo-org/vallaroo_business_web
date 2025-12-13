'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserPlan } from '@/lib/subscription-utils';
import { redirect } from 'next/navigation';

export async function createBusinessAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Business Details
    const name = formData.get('name') as string;
    const nameMl = formData.get('nameMl') as string;
    const description = formData.get('description') as string;
    const descriptionMl = formData.get('descriptionMl') as string;
    const website = formData.get('website') as string;
    const city = formData.get('city') as string; // Main city for business is usually headquarters

    // Owner Details (We might check if we should update the user profile with this, but for now we just capture it if needed by DB, usually owner_id is enough)
    // The mobile app collects Owner Name/Phone but might just be updating the profile or storing it textually if the business table has columns.
    // Looking at mobile code: It calls `updateBusinessDraft`. The DB likely doesn't store "Owner Name" on business table, but maybe User table.
    // Let's check if the table has these columns. Mobile code didn't show the INSERT structure fully for owner name. 
    // Assuming standard fields for now based on previous file context.

    if (!name || !city) {
        return { error: 'Name and City are required' };
    }

    // Check Limits
    const plan = await getCurrentUserPlan(supabase, user.id);

    const { count, error: countError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

    if (countError) {
        return { error: 'Failed to check limits' };
    }

    if ((count || 0) >= plan.features.max_businesses) {
        return { error: `You have reached the limit of ${plan.features.max_businesses} business(es) for your current ${plan.name}. Please upgrade.` };
    }

    const { data: business, error } = await supabase
        .from('businesses')
        .insert({
            name,
            name_ml: nameMl || null,
            description: description || null,
            description_ml: descriptionMl || null,
            website: website || null,
            city,
            owner_id: user.id,
            currency: 'INR',
            is_verified: false
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    // If owner details (phone/name) were passed, we might want to update the public.users table or profiles table.
    // For now, minimizing side effects unless explicitly required.

    return { businessId: business.id };
}

export async function createShopAction(businessId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const name = formData.get('name') as string;
    const nameMl = formData.get('nameMl') as string;

    const address = formData.get('address') as string;
    const addressMl = formData.get('addressMl') as string;

    const city = formData.get('city') as string;
    const cityMl = formData.get('cityMl') as string;

    const categoryId = formData.get('categoryId') as string;

    const openingTime = formData.get('openingTime') as string;
    const closingTime = formData.get('closingTime') as string;
    const deliveryAvailable = formData.get('deliveryAvailable') === 'on';
    const takeawayAvailable = formData.get('takeawayAvailable') === 'on';

    if (!name || !city) {
        return { error: 'Name and City are required' };
    }

    // Check Limits
    const plan = await getCurrentUserPlan(supabase, user.id);

    const { count, error: countError } = await supabase
        .from('shops')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

    if (countError) {
        return { error: 'Failed to check shop limits' };
    }

    if ((count || 0) >= plan.features.max_shops_per_business) {
        return { error: `You have reached the limit of ${plan.features.max_shops_per_business} shop(s) per business for your current ${plan.name}. Please upgrade.` };
    }

    const { error } = await supabase
        .from('shops')
        .insert({
            business_id: businessId,
            name,
            name_ml: nameMl || null,
            address_line_1: address || null,
            address_line_1_ml: addressMl || null,
            city,
            city_ml: cityMl || null,
            category_id: categoryId || null, // Assuming column name
            opening_time: openingTime || null,
            closing_time: closingTime || null,
            delivery_available: deliveryAvailable,
            takeaway_available: takeawayAvailable,
            is_verified: false,
            is_hidden: false
        });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
