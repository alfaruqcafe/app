import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Building, ChevronRight } from 'lucide-react';
import { EVENT_TYPE_STYLES } from '../lib/mockData';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

export function Home() {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true })
          .limit(3);
        
        if (error) throw error;
        
        const mappedEvents = data.map(e => ({
          id: e.id,
          title: e.title,
          type: e.type,
          startDate: e.start_date,
          endDate: e.end_date,
          location: e.location,
          description: e.description,
          maxParticipants: e.max_participants,
          currentParticipants: e.current_participants || 0,
          registrationRequired: e.registration_required
        }));
        
        setUpcomingEvents(mappedEvents);
      } catch (err) {
        console.error("Fehler beim Laden der Events", err);
      }
    }
    fetchEvents();
  }, []);

  const quickActions = [
    { path: "/menu", icon: Coffee, label: "Speisekarte", desc: "Unsere Angebote" },
    { path: "/events", icon: Calendar, label: "Veranstaltungen", desc: "Events & Öffnungszeiten" },
    { path: "/booking", icon: Building, label: "Raum buchen", desc: "Seminar, Event & mehr" },
  ];

  return (
    <div className="pb-28 bg-[#fdfbf7] min-h-screen">
      {/* Hero */}
      <div className="bg-grad-hero flex flex-col items-center pt-14 px-8 pb-10">
        <div className="w-32 h-32 mb-4 flex items-center justify-center drop-shadow-[0_8px_24px_rgba(60,20,5,0.3)]">
          <img src="/cafe-logo.png" alt="Café Logo" className="w-full h-full object-contain" />
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
