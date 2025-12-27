'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/hooks/use-business';
import { Bell, Mail, Smartphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const { selectedBusiness } = useBusiness();
    const [loading, setLoading] = useState(false);

    // Mock settings state
    const [settings, setSettings] = useState({
        orderUpdatesEmail: true,
        orderUpdatesPush: true,
        marketingEmail: false,
        securityAlerts: true,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast.success('Notification preferences saved.');
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-4xl px-2 sm:px-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Notifications</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Manage how you receive alerts and updates.</p>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                        Order Updates
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Receive notifications when new orders are placed or status changes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-background gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-foreground text-sm sm:text-base">Email Notifications</p>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receive updates via email.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('orderUpdatesEmail')}
                            className={`w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors flex items-center px-0.5 sm:px-1 flex-shrink-0 ${settings.orderUpdatesEmail ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.orderUpdatesEmail ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-background gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-foreground text-sm sm:text-base">Push Notifications</p>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receive updates on your mobile device.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('orderUpdatesPush')}
                            className={`w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors flex items-center px-0.5 sm:px-1 flex-shrink-0 ${settings.orderUpdatesPush ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.orderUpdatesPush ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border bg-card">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        General
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-background gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="min-w-0">
                                <p className="font-medium text-foreground text-sm sm:text-base">Security Alerts</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">Get notified about important account activity.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('securityAlerts')}
                            className={`w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors flex items-center px-0.5 sm:px-1 flex-shrink-0 ${settings.securityAlerts ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.securityAlerts ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                    {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
}
