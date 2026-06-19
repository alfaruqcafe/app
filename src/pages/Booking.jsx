import { Clock } from 'lucide-react';

export function Booking() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-grad text-white flex items-center justify-center shadow-2xl shadow-primary/30 mb-6">
        <Clock size={40} />
      </div>
      <h2 className="font-serif text-2xl font-bold text-[#3d1f0f] mb-2">Raumbuchung bald verfügbar</h2>
      <p className="text-gray-500 mb-8 max-w-[260px] leading-relaxed">
        Wir arbeiten gerade an unserem neuen Buchungssystem. Schau bald wieder vorbei!
      </p>
    </div>
  );
}
