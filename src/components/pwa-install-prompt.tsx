'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from './ui/button';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if user is on iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIos);

        // Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isStandalone) return;

        // Android / Desktop Install Prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // iOS detection (show only if not standalone)
        if (isIos && !isStandalone) {
            // Check if we've shown it recently to avoid annoyance? 
            // For now, show it.
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-foreground text-background rounded-xl p-4 shadow-2xl flex flex-col gap-4 border border-border">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icon-192.png" alt="App Icon" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Install Vallaroo Business</h3>
                            <p className="text-sm text-muted-foreground/80">
                                {isIOS
                                    ? "Install this app on your iPhone for a better experience."
                                    : "Install our app for easier access and better performance."}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleDismiss} className="text-muted-foreground/80 hover:text-background transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isIOS ? (
                    <div className="text-sm bg-background/10 p-3 rounded-lg">
                        Tap <Share className="w-4 h-4 inline mx-1" /> and select <strong>Add to Home Screen</strong> <span className="text-xl leading-none inline-block align-middle">+</span>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleInstallClick}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        >
                            <Download className="w-4 h-4 mr-2" /> Install App
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            variant="outline"
                            className="w-full border-muted-foreground/20 hover:bg-muted-foreground/10"
                        >
                            Not Now
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
