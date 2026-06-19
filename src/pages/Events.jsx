import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EVENT_TYPE_STYLES } from '../lib/mockData';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, MapPin, Users, ArrowLeft, Send } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

export function Events() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [activeEventId, setActiveEventId] = useState(id ? Number(id) : null);
  const [registration, setRegistration] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  
  const [events, setEvents] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) throw error;
        
        // Map db fields to camelCase as expected by the UI
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
        
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Fehler beim Laden der Events", err);
      } finally {
        setFetching(false);
      }
    }
    fetchEvents();
  }, []);

  function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("Erfolgreich für das Event angemeldet!");
      setActiveEventId(null);
      setRegistration({ name: '', email: '' });
      navigate('/events');
    }, 800);
  }

  const selectedEvent = activeEventId ? events.find(e => e.id === activeEventId) : null;

  if (selectedEvent) {
    const style = EVENT_TYPE_STYLES[selectedEvent.type] || EVENT_TYPE_STYLES.other;
    const startDate = new Date(selectedEvent.startDate);
    const endDate = new Date(selectedEvent.endDate);

    return (
      <div className="pb-24 bg-[#fdfbf7] min-h-screen">
        <div className="pt-12 px-4 pb-6 bg-grad flex items-center gap-3">
          <button 
            onClick={() => { setActiveEventId(null); navigate('/events'); }}
            className="bg-white/10 border-none text-white w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white m-0 truncate pr-4">Event Details</h1>
        </div>

        <div className="p-4 flex flex-col gap-5 mt-2">
          <div>
            <span 
              className="text-[11px] font-bold px-2.5 py-1 rounded-full mb-3 inline-block shadow-sm"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {style.label}
            </span>
            <h2 className="font-serif text-2xl font-bold m-0 mb-3 text-[#3d1f0f] leading-tight">
              {selectedEvent.title}
            </h2>
            
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="m-0 font-bold text-[#3d1f0f]">{format(startDate, 'EEEE, d. MMMM yyyy', { locale: de })}</p>
                  <p className="m-0 text-xs">{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')} Uhr</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <p className="m-0 font-bold text-[#3d1f0f]">{selectedEvent.location}</p>
              </div>
              {selectedEvent.maxParticipants && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <p className="m-0 font-bold text-[#3d1f0f]">
                    {selectedEvent.currentParticipants} / {selectedEvent.maxParticipants} angemeldet
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed m-0 p-4 bg-white rounded-2xl border border-[#e5d9c8] shadow-sm">
              {selectedEvent.description}
            </p>
          </div>

          {selectedEvent.registrationRequired && (
            <div className="bg-white rounded-2xl border border-[#e5d9c8] p-5 shadow-sm mt-2">
              <h3 className="font-bold text-base mb-4 text-[#3d1f0f]">Anmeldung</h3>
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-gray-700">Name *</label>
                  <input 
                    type="text" required
                    value={registration.name}
                    onChange={e => setRegistration({ ...registration, name: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-[#fafaf8]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1.5 text-gray-700">E-Mail *</label>
                  <input 
                    type="email" required
                    value={registration.email}
                    onChange={e => setRegistration({ ...registration, email: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-[#fafaf8]"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={clsx(
                    "mt-2 w-full p-3.5 rounded-xl bg-grad text-white border-none font-bold cursor-pointer shadow-lg shadow-primary/20 flex justify-center items-center gap-2 active:scale-95 transition-all",
                    loading && "opacity-70 scale-100"
                  )}
                >
                  {loading ? "Wird gesendet…" : "Jetzt anmelden"}
                  {!loading && <Send size={16} />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-[#fdfbf7] min-h-screen">
      <div className="pt-12 px-5 pb-8 bg-grad rounded-b-[2.5rem] shadow-sm mb-6">
        <h1 className="font-serif text-[28px] font-bold text-white m-0 mb-1">Events</h1>
        <p className="text-white/70 text-[13px] m-0 leading-snug">Gemeinschaft erleben · Termine & Veranstaltungen</p>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {events.map(event => {
          const style = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.other;
          const date = new Date(event.startDate);
          
          return (
            <button 
              key={event.id}
              onClick={() => { setActiveEventId(event.id); navigate(`/events/${event.id}`); }}
              className="flex gap-4 items-center bg-white border border-[#e5d9c8] rounded-2xl p-4 cursor-pointer text-left w-full shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex flex-col items-center justify-center shrink-0 border border-primary/10">
                <span className="text-[11px] font-bold uppercase text-primary tracking-wider">
                  {format(date, 'MMM', { locale: de })}
                </span>
                <span className="text-[24px] font-black text-primary leading-none">
                  {format(date, 'dd')}
                </span>
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <span 
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full mb-1.5 inline-block"
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
                <p className="font-bold text-[14px] m-0 mb-1 truncate text-[#3d1f0f] leading-tight">{event.title}</p>
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {format(date, 'HH:mm')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {event.location}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
