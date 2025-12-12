'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useBusiness } from '@/components/providers/business-provider';

export default function HelpPage() {
    const { selectedBusiness } = useBusiness();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
                <p className="text-muted-foreground">Get assistance and view legal documents.</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>Need help? Our support team is here for you.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                        <div className="p-2 mr-4 bg-primary/10 rounded-full text-primary">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-foreground">Email Support</h3>
                            <p className="text-sm text-muted-foreground">support@vallaroo.com</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="mailto:support@vallaroo.com">Email Us</a>
                        </Button>
                    </div>

                    <div className="flex items-center p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                        <div className="p-2 mr-4 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-foreground">WhatsApp Support</h3>
                            <p className="text-sm text-muted-foreground">Chat with us directly</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer">Chat</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>Legal & Policies</CardTitle>
                    <CardDescription>Review our terms and privacy policy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link href="/privacy" className="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center">
                            <FileText className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-foreground">Privacy Policy</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/terms" className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Terms of Service
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/refund" className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Refund Policy
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/shipping" className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            Shipping Policy
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle>App Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium text-foreground">v0.1.0</span>
                        </div>
                        {selectedBusiness && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Business ID</span>
                                <span className="font-mono text-xs text-foreground bg-muted p-1 rounded">{selectedBusiness.id}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
