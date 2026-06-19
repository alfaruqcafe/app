import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Eye, EyeOff, Lock, User, ArrowLeft } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const user = await login(username, password);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/staff');
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col">
      <div className="p-4">
        <button 
          onClick={() => navigate("/")}
          className="bg-white border border-[#e5d9c8] w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer text-gray-600 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-6 pb-20">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-grad rounded-[1.5rem] mx-auto flex items-center justify-center text-white mb-4 shadow-xl shadow-primary/20">
            <Coffee size={36} strokeWidth={2.5} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#3d1f0f] m-0">Mitarbeiter Login</h1>
          <p className="text-gray-500 text-sm mt-1">Bitte melde dich an</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 shadow-sm border border-[#e5d9c8]">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center mb-4">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input 
                type="text" required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Benutzername"
                className="w-full p-4 pl-10 rounded-2xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 bg-[#fafaf8] transition-all"
              />
            </div>
            
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Passwort"
                className="w-full p-4 pl-10 pr-10 rounded-2xl border border-[#e5d9c8] text-sm box-border outline-none focus:border-primary focus:ring-1 bg-[#fafaf8] transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent border-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full p-4 rounded-xl bg-grad text-white border-none font-bold text-base cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:scale-100"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
          
          <div className="mt-5 pt-5 border-t border-[#e5d9c8] flex flex-col gap-1.5 text-center text-xs text-gray-400">
            <p className="m-0">Demo Staff: staff / staff</p>
            <p className="m-0">Demo Admin: admin / admin</p>
          </div>
        </form>
      </div>
    </div>
  );
}
