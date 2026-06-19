import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { CheckCircle2, Building, CalendarDays, Clock, Users, Package } from 'lucide-react';
import clsx from 'clsx';

export function Booking() {
  const { showToast } = useToast();
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    package: 'hourly',
    name: '',
    email: '',
    phone: '',
    guests: '',
    purpose: ''
  });

  const packages = [
    { id: 'hourly', label: 'Stündlich', desc: 'Kurze Meetings' },
    { id: 'half', label: 'Halber Tag', desc: 'Bis zu 4 Stunden' },
    { id: 'full', label: 'Ganzer Tag', desc: 'Bis zu 8 Stunden' },
    { id: 'catered', label: 'Mit Service', desc: 'Inkl. Bewirtung' }
  ];

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('done');
      showToast("Buchungsanfrage erfolgreich gesendet!");
    }, 1000);
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-grad text-white flex items-center justify-center shadow-2xl shadow-primary/30 mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#3d1f0f] mb-2">Anfrage gesendet!</h2>
        <p className="text-gray-500 mb-8 max-w-[260px] leading-relaxed">
          Wir haben deine Anfrage erhalten und melden uns in Kürze zur Bestätigung.
        </p>
        <button 
          onClick={() => { setStep('form'); setFormData({ date: '', startTime: '', endTime: '', package: 'hourly', name: '', email: '', phone: '', guests: '', purpose: '' }); }}
          className="w-full max-w-[200px] p-4 rounded-xl bg-grad text-white font-bold cursor-pointer border-none shadow-lg shadow-primary/20"
        >
          Neue Anfrage
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-[#fdfbf7] min-h-screen">
      <div className="pt-12 px-5 pb-8 bg-grad rounded-b-[2.5rem] shadow-sm mb-6">
        <h1 className="font-serif text-[28px] font-bold text-white m-0 mb-1">Raum buchen</h1>
        <p className="text-white/70 text-[13px] m-0 leading-snug">Für Seminare, Feiern oder Meetings</p>
      </div>

      <div className="px-5">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#e5d9c8] p-5 shadow-sm">
          
          <div className="mb-6">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-[#3d1f0f]">
              <Package size={18} className="text-primary" /> Paket wählen
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {packages.map(pkg => (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => setFormData({ ...formData, package: pkg.id })}
                  className={clsx(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all",
                    formData.package === pkg.id 
                      ? "border-primary bg-primary/5 shadow-[inset_0_0_0_1px_rgba(92,45,14,1)]" 
                      : "border-[#e5d9c8] bg-white hover:border-gray-300"
                  )}
                >
                  <p className={clsx("font-bold text-[13px] m-0 mb-0.5", formData.package === pkg.id ? "text-primary" : "text-[#3d1f0f]")}>
                    {pkg.label}
                  </p>
                  <p className="text-[10px] text-gray-400 m-0">{pkg.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-[#3d1f0f]">
              <CalendarDays size={18} className="text-primary" /> Wann?
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <input 
                  type="date" required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 transition-all bg-[#fafaf8]"
                />
              </div>
              <div className="flex gap-3">
                <input 
                  type="time" required placeholder="Start"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 transition-all bg-[#fafaf8]"
                />
                <input 
                  type="time" required placeholder="Ende"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 transition-all bg-[#fafaf8]"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-[#3d1f0f]">
              <Users size={18} className="text-primary" /> Details
            </h3>
            <div className="flex flex-col gap-3">
              <input 
                type="text" required placeholder="Name / Organisation"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary transition-all bg-[#fafaf8]"
              />
              <div className="flex gap-3">
                <input 
                  type="email" required placeholder="E-Mail"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary transition-all bg-[#fafaf8]"
                />
                <input 
                  type="tel" placeholder="Telefon"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary transition-all bg-[#fafaf8]"
                />
              </div>
              <div className="flex gap-3">
                <input 
                  type="number" required placeholder="Anzahl Gäste" min="1"
                  value={formData.guests}
                  onChange={e => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary transition-all bg-[#fafaf8]"
                />
              </div>
              <textarea 
                required placeholder="Zweck der Veranstaltung" rows={2}
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full p-3.5 rounded-xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary transition-all bg-[#fafaf8] resize-none"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className={clsx(
              "w-full p-4 rounded-xl bg-grad text-white font-bold cursor-pointer border-none shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95",
              loading && "opacity-70 scale-100"
            )}
          >
            {loading ? "Wird gesendet…" : "Anfrage absenden"}
          </button>
        </form>
      </div>
    </div>
  );
}
