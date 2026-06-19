import { useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Building, ChevronRight } from 'lucide-react';
import { MOCK_EVENTS, EVENT_TYPE_STYLES } from '../lib/mockData';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function Home() {
  const navigate = useNavigate();
  const upcomingEvents = MOCK_EVENTS.slice(0, 3);

  const quickActions = [
    { path: "/menu", icon: Coffee, label: "Speisekarte", desc: "Unsere Angebote" },
    { path: "/events", icon: Calendar, label: "Veranstaltungen", desc: "Events & Öffnungszeiten" },
    { path: "/booking", icon: Building, label: "Raum buchen", desc: "Seminar, Event & mehr" },
  ];

  return (
    <div className="pb-28 bg-[#fdfbf7] min-h-screen">
      {/* Hero */}
      <div className="bg-grad-hero flex flex-col items-center pt-14 px-8 pb-10">
        <div className="w-28 h-28 rounded-full bg-white/15 border-[3px] border-white/30 flex items-center justify-center text-[56px] mb-4 shadow-[0_8px_32px_rgba(60,20,5,0.4)]">
          ☕
        </div>
        <p className="text-[11px] font-bold tracking-[3px] uppercase text-[#6b3520] mb-1.5">Café in der Moschee</p>
        <p className="text-[13px] italic text-[#7c4b2a] opacity-85 text-center leading-relaxed">
          "Jeder Kauf unterstützt Moschee, Schule und Jugend."
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-[#fdfbf7]">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button 
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-white border border-[#e5d9c8] rounded-2xl p-4 cursor-pointer text-left flex flex-col gap-2 shadow-sm transition-transform active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-[13px] text-[#3d1f0f] m-0">{action.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 m-0">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="px-4 py-5 bg-[#fdfbf7]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-serif text-[18px] font-bold m-0">Nächste Veranstaltungen</h2>
          <button 
            onClick={() => navigate('/events')}
            className="border-none bg-transparent text-primary font-bold text-[12px] cursor-pointer flex items-center gap-1"
          >
            Alle <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {upcomingEvents.map(event => {
            const style = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.other;
            const date = new Date(event.startDate);
            
            return (
              <button 
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="flex gap-3 items-center bg-white border border-[#e5d9c8] rounded-2xl p-3 cursor-pointer text-left w-full shadow-sm transition-transform active:scale-95"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/5 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold uppercase text-primary">
                    {format(date, 'MMM', { locale: de })}
                  </span>
                  <span className="text-[20px] font-bold text-primary leading-none">
                    {format(date, 'dd')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] m-0 mb-0.5 truncate">{event.title}</p>
                  <p className="text-[11px] text-gray-400 m-0 mb-1">
                    {format(date, 'HH:mm')} Uhr
                  </p>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Link */}
      <div className="text-center py-2 pb-6">
        <button 
          onClick={() => navigate('/login')}
          className="border-none bg-transparent text-[11px] text-gray-400/60 cursor-pointer hover:text-primary transition-colors"
        >
          Mitarbeiter-Bereich
        </button>
      </div>
    </div>
  );
}
