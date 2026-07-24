import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Smartphone, X, Share, MoreVertical, Bell, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const DISMISS_KEY = 'cafe_install_confirmed';

// Erkennt, ob die App bereits als installierte PWA läuft (Home-Bildschirm).
// Funktioniert auf den meisten modernen Browsern (Android/Chrome via display-mode,
// iOS Safari via navigator.standalone). Falls die Erkennung fehlschlägt, bleibt
// der Hinweis dauerhaft sichtbar, bis der Nutzer ihn manuell bestätigt.
function isStandalone() {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = window.navigator && window.navigator.standalone === true;
  return !!(mq || iosStandalone);
}

function GuideStep({ number, children }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[12px] flex items-center justify-center mt-0.5">
        {number}
      </span>
      <p className="text-[13px] text-gray-600 leading-relaxed m-0">{children}</p>
    </div>
  );
}

function GuideModal({ onClose }) {
  const [platform, setPlatform] = useState('ios');

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold m-0 text-[#3d1f0f]">App installieren</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer hover:bg-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 p-4 pb-0">
          <button
            onClick={() => setPlatform('ios')}
            className={clsx(
              'flex-1 py-2.5 rounded-xl font-bold text-[13px] border-none cursor-pointer transition-colors',
              platform === 'ios' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
            )}
          >
            iPhone (iOS)
          </button>
          <button
            onClick={() => setPlatform('android')}
            className={clsx(
              'flex-1 py-2.5 rounded-xl font-bold text-[13px] border-none cursor-pointer transition-colors',
              platform === 'android' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
            )}
          >
            Android
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3.5">
          {platform === 'ios' ? (
            <>
              <GuideStep number={1}>Öffne diese Seite in <strong>Safari</strong>.</GuideStep>
              <GuideStep number={2}>
                Tippe unten auf das Teilen-Symbol <Share size={13} className="inline -mt-0.5" /> (Quadrat mit Pfeil nach oben).
              </GuideStep>
              <GuideStep number={3}>Scrolle in der Liste nach unten und wähle <strong>„Zum Home-Bildschirm"</strong>.</GuideStep>
              <GuideStep number={4}>Tippe oben rechts auf <strong>„Hinzufügen"</strong>.</GuideStep>
              <GuideStep number={5}>Öffne die App ab jetzt über das neue Symbol auf deinem Home-Bildschirm.</GuideStep>
            </>
          ) : (
            <>
              <GuideStep number={1}>Öffne diese Seite in <strong>Chrome</strong>.</GuideStep>
              <GuideStep number={2}>
                Tippe oben rechts auf die drei Punkte <MoreVertical size={13} className="inline -mt-0.5" /> (Menü).
              </GuideStep>
              <GuideStep number={3}>Wähle <strong>„App installieren"</strong> bzw. <strong>„Zum Startbildschirm hinzufügen"</strong>.</GuideStep>
              <GuideStep number={4}>Bestätige mit <strong>„Installieren"</strong>.</GuideStep>
              <GuideStep number={5}>Öffne die App ab jetzt über das neue Symbol auf deinem Startbildschirm.</GuideStep>
            </>
          )}
        </div>

        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full p-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold border-none cursor-pointer hover:bg-gray-200 transition-colors"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstallPrompt() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // isStandalone() wird bereits hier beim ersten Rendern ausgewertet (Browser
  // kennen den Anzeigemodus sofort) — kein zusätzlicher Effekt nötig, sobald
  // die App über das Home-Bildschirm-Symbol geöffnet wird, ist dieser Wert
  // schon beim Mount korrekt "true".
  const [installed, setInstalled] = useState(() => {
    if (isStandalone()) {
      localStorage.setItem(DISMISS_KEY, 'true');
      return true;
    }
    return localStorage.getItem(DISMISS_KEY) === 'true';
  });
  const [showGuide, setShowGuide] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  function confirmInstalled() {
    localStorage.setItem(DISMISS_KEY, 'true');
    setInstalled(true);
  }

  async function enableNotifications() {
    try {
      const { subscribeToPushNotifications } = await import('../lib/push');
      await subscribeToPushNotifications(user?.id, 'customer');
      showToast('Benachrichtigungen aktiviert!');
      setHasNotificationPermission(true);
    } catch (e) {
      if (e.message?.includes('nicht unterstützt')) {
        setShowGuide(true);
      } else {
        showToast(e.message || 'Fehler beim Aktivieren der Benachrichtigungen.');
      }
    }
  }

  // Solange die App nicht installiert ist: voller Hinweis (Install-Anleitung +
  // Benachrichtigungen + "bereits installiert"-Bestätigung). Danach verschwindet
  // dieser Teil dauerhaft, wie gefordert — unabhängig vom Benachrichtigungsstatus.
  if (!installed) {
    return (
      <>
        <div className="px-4 pb-4">
          <div className="bg-white border border-[#e5d9c8] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Smartphone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-[#3d1f0f] m-0">Beste Erfahrung freischalten</p>
                <p className="text-[11px] text-gray-500 m-0 mt-0.5 leading-relaxed">
                  Füge die App deinem Home-Bildschirm hinzu und aktiviere Benachrichtigungen, um nichts zu verpassen.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowGuide(true)}
                className="w-full p-3 rounded-xl bg-primary/10 text-primary font-bold text-[13px] border-none cursor-pointer hover:bg-primary/15 transition-colors flex items-center justify-between"
              >
                <span>Anleitung: Zum Home-Bildschirm</span>
                <ChevronRight size={16} />
              </button>
              {!hasNotificationPermission && (
                <button
                  onClick={enableNotifications}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-bold text-[13px] border-none cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/20 active:scale-[0.98] transition-transform"
                >
                  <Bell size={16} /> Benachrichtigungen aktivieren
                </button>
              )}
              <button
                onClick={confirmInstalled}
                className="text-[11px] text-gray-400 hover:text-primary bg-transparent border-none cursor-pointer text-center py-1"
              >
                Ich habe die App bereits installiert
              </button>
            </div>
          </div>
        </div>

        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  // Bereits installiert: nur noch der (bereits vorher vorhandene) separate
  // Hinweis zum Aktivieren von Benachrichtigungen, falls noch nicht erteilt.
  if (!hasNotificationPermission) {
    return (
      <div className="px-4 pb-4">
        <button
          onClick={enableNotifications}
          className="w-full bg-gradient-to-r from-primary to-primary-light text-white border-none rounded-2xl p-4 flex items-center gap-3 cursor-pointer shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Bell size={20} />
          </div>
          <div className="text-left">
            <p className="font-bold text-[13px] m-0">Benachrichtigungen aktivieren</p>
            <p className="text-[11px] text-white/70 m-0 mt-0.5">Erhalte Updates zur Speisekarte</p>
          </div>
        </button>
        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  return null;
}
