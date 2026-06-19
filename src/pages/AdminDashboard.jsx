import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMenu } from '../contexts/MenuContext';
import { LogOut, Plus, Trash2, Edit2, X, Save, Bell } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { categories, updateItem } = useMenu();
  
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '', imageUrl: '' });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-6 text-center">
        <p className="font-bold mb-4">Zugriff verweigert</p>
        <button onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-2 rounded-xl">Zum Login</button>
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  function openEditModal(category, item) {
    setEditingItem({ categoryId: category.id, itemId: item.id });
    setEditForm({ 
      name: item.name, 
      price: item.price, 
      description: item.description || '', 
      imageUrl: item.imageUrl || '' 
    });
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    updateItem(editingItem.categoryId, editingItem.itemId, {
      name: editForm.name,
      price: parseFloat(editForm.price),
      description: editForm.description,
      imageUrl: editForm.imageUrl
    });
    setEditingItem(null);
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col pb-20">
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="font-serif text-xl font-bold m-0 text-amber-400">Admin Dashboard</h1>
          <p className="text-white/70 text-xs m-0">Speisekarte verwalten</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              try {
                const { subscribeToPushNotifications } = await import('../lib/push');
                await subscribeToPushNotifications(user.id, user.role);
                alert("Push-Benachrichtigungen aktiviert!");
              } catch (e) {
                alert(e.message || "Fehler");
              }
            }}
            className="bg-white/10 hover:bg-white/20 border-none w-10 h-10 rounded-xl flex items-center justify-center text-white cursor-pointer transition-colors"
            title="Benachrichtigungen aktivieren"
          >
            <Bell size={18} />
          </button>
          <button 
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 border-none w-10 h-10 rounded-xl flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-[#3d1f0f]">Kategorien & Artikel</h2>
          <button className="flex items-center gap-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-primary-light transition-colors border-none">
            <Plus size={16} /> Kategorie
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {categories.map(category => (
            <div key={category.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5d9c8]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-[#3d1f0f] m-0">{category.name}</h3>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-primary bg-transparent border-none cursor-pointer"><Edit2 size={16} /></button>
                  <button className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {category.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold">Img</div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-[#3d1f0f] m-0">{item.name}</p>
                        <p className="text-xs text-gray-400 m-0">{item.price.toFixed(2)} € {item.isExtra && '(Extra)'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => openEditModal(category, item)}
                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 border-none flex items-center justify-center cursor-pointer hover:bg-gray-200"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border-none flex items-center justify-center cursor-pointer hover:bg-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full py-2.5 border-2 border-dashed border-[#e5d9c8] rounded-xl text-gray-500 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:text-primary transition-colors bg-transparent">
                <Plus size={16} /> Artikel hinzufügen
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold m-0 text-[#3d1f0f]">Artikel bearbeiten</h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer hover:bg-gray-300"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Name</label>
                <input 
                  required type="text"
                  value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Preis (€)</label>
                <input 
                  required type="number" step="0.01" min="0"
                  value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Beschreibung</label>
                <textarea 
                  value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50 resize-none h-20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Bild hochladen</label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm({...editForm, imageUrl: reader.result});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full p-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {editForm.imageUrl && (
                    <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-gray-200 relative">
                      <img src={editForm.imageUrl} alt="Vorschau" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setEditForm({...editForm, imageUrl: ''})}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center border-none cursor-pointer hover:bg-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button" onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 border-none cursor-pointer"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-white border-none cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
