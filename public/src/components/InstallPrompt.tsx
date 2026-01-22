import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasDismissed) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Banner */}
      <div className="fixed bottom-20 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom duration-500">
        <div className="mx-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-2xl p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="bg-white rounded-xl p-2 flex-shrink-0">
              <Download size={24} className="text-blue-600" />
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="font-bold text-white text-sm mb-1">
                Install CheriFI
              </h3>
              <p className="text-xs text-white/90 mb-3">
                Get quick access and work offline
              </p>
              
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-50 transition"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Popup */}
      <div className="hidden md:block fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-500">
        <div className="bg-zinc-900 rounded-2xl shadow-2xl p-6 w-80 border border-zinc-800">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-600 rounded-xl p-3 flex-shrink-0">
              <Download size={28} className="text-white" />
            </div>
            
            <div>
              <h3 className="font-bold text-white text-lg mb-1">
                Install CheriFI
              </h3>
              <p className="text-sm text-zinc-400">
                Install the app for a better experience
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✓</span>
              <span>Quick access from your desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✓</span>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">✓</span>
              <span>Faster performance</span>
            </div>
          </div>
          
          <button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition"
          >
            Install Now
          </button>
        </div>
      </div>
    </>
  );
};

export default InstallPrompt;