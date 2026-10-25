import { Search, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 lg:px-12 pb-24 lg:pb-12">
      
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Welcome to Sikkim</h1>
        <p className="text-muted-foreground text-sm">Explore digital heritage offline.</p>
      </header>

      {/* Search */}
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search monasteries, events..." 
          className="w-full bg-card border border-border text-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
      </div>

      {/* AI Banner */}
      <Link to="/ai-guide" className="block mb-8 group">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 shadow-lg shadow-indigo-900/20 transition-transform hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={120} />
            </div>
            <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Sparkles className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-white font-semibold text-lg">AI Heritage Guide</h2>
                    <p className="text-white/80 text-sm">Ask local history questions entirely offline.</p>
                </div>
            </div>
        </div>
      </Link>

      {/* Popular Sites */}
      <section>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Featured Monasteries</h3>
        </div>
        
        <div className="grid gap-4">
            {/* Rumtek */}
            <Link to="/3d-tour" className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm group">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Rumtek_Monastery%2C_Sikkim.jpg" alt="Rumtek" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Rumtek Monastery</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} /> 24km from Gangtok
                    </p>
                    <div className="mt-3 flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase">3D Tour</span>
                        <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">Dharma Chakra</span>
                    </div>
                </div>
            </Link>

            {/* Pemayangtse */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors shadow-sm group cursor-not-allowed opacity-75">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Pemayangtse_Monastery_2016.jpg" alt="Pemayangtse" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Pemayangtse</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} /> Pelling, Sikkim
                    </p>
                    <div className="mt-3 flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">In Progress</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
}
