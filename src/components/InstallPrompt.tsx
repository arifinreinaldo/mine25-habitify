import { Download, Share, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();

  // Already installed
  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <div className="flex-1">
          <p className="text-sm font-medium">App Installed</p>
          <p className="text-xs text-muted-foreground">
            Habitify is installed on your device
          </p>
        </div>
      </div>
    );
  }

  // iOS - show manual instructions
  if (isIOS) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <Share className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Install App</p>
          <p className="text-xs text-muted-foreground">
            Tap <Share className="inline w-3 h-3" /> then "Add to Home Screen"
          </p>
        </div>
      </div>
    );
  }

  // Can install - show install button
  if (canInstall) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <Download className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Install App</p>
          <p className="text-xs text-muted-foreground">
            Add to home screen for quick access
          </p>
        </div>
        <Button variant="default" size="sm" onClick={install}>
          Install
        </Button>
      </div>
    );
  }

  // Not installable (browser doesn't support or already dismissed)
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
      <Download className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">Install App</p>
        <p className="text-xs text-muted-foreground">
          Use browser menu → "Add to Home Screen" or "Install App"
        </p>
      </div>
    </div>
  );
}
