import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem("alfred-install-dismissed")) {
      setDismissed(true);
      return;
    }
    setIos(isIos());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem("alfred-install-dismissed", "1");
    setDismissed(true);
  };

  if (dismissed || isStandalone()) return null;

  const showAndroid = Boolean(deferred);
  const showIos = ios && !showAndroid;

  if (!showAndroid && !showIos) return null;

  return (
    <section className="panel-hud px-4 py-3 flex items-start gap-3">
      <Download className="h-5 w-5 text-alfred-gold shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-alfred-cream">Install Alfred on your phone</p>
        {showAndroid ? (
          <>
            <p className="text-xs text-alfred-mist mt-1">
              Add to your home screen — runs full-screen like a native app, with push notifications.
            </p>
            <button
              type="button"
              className="btn-gold mt-2 text-xs py-1.5"
              onClick={() => {
                void deferred?.prompt().then(() => setDeferred(null));
              }}
            >
              Install app
            </button>
          </>
        ) : (
          <p className="text-xs text-alfred-mist mt-1">
            In Safari: tap <strong className="text-alfred-cream">Share</strong> →{" "}
            <strong className="text-alfred-cream">Add to Home Screen</strong>. Opens full-screen with your green HUD.
          </p>
        )}
      </div>
      <button type="button" className="btn-ghost p-1 shrink-0" onClick={dismiss} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </section>
  );
}
