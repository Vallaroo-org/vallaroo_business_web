import { createClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/plans';
import { Plan } from '@/lib/types';

export async function getCurrentUserPlan(supabase: any, userId: string): Promise<Plan> {
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'authenticated'])
        .single();

    if (subscription && PLANS[subscription.plan_id]) {
        return PLANS[subscription.plan_id];
    }

    return PLANS.free;
}
