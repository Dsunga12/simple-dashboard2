/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  BarChart3, 
  Medal,
  Flame,
  Target,
  Shield,
  Crown,
  Upload,
  ChevronRight,
  Info,
  Star,
  Award,
  Sun,
  Moon,
  Users,
  Map,
  DollarSign,
  Activity,
  Sparkles,
  Clock,
  ChevronDown
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { 
  INITIAL_CSV, 
  combineCSVData,
  ZONES, 
  getWeekLabels, 
  RestaurantData 
} from './data';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  doc, 
  onSnapshot, 
  setDoc, 
  Timestamp, 
  handleFirestoreError, 
  OperationType,
  User,
  testConnection
} from './firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ZONE_ICONS: Record<string, React.ReactNode> = {
  Aguila: <span className="text-5xl filter drop-shadow-sm">🐦‍🔥</span>,
  Triunfo: <span className="text-5xl filter drop-shadow-sm">🏆</span>,
  Fuego: <span className="text-5xl filter drop-shadow-sm">🔥</span>,
  Impetu: <span className="text-4xl filter drop-shadow-sm">⏩</span>,
  Dominio: <span className="text-5xl filter drop-shadow-sm">👑</span>,
};

const ZONE_COLORS: Record<string, string> = {
  Aguila: 'bg-white border-emerald-500',
  Triunfo: 'bg-white border-yellow-500',
  Fuego: 'bg-white border-orange-600',
  Impetu: 'bg-white border-purple-500',
  Dominio: 'bg-white border-blue-500',
};

const ZONE_ICON_BG: Record<string, string> = {
  Aguila: 'bg-emerald-500',
  Triunfo: 'bg-yellow-500',
  Fuego: 'bg-orange-600',
  Impetu: 'bg-purple-500',
  Dominio: 'bg-blue-500',
};

const ZONE_TEXT_COLORS: Record<string, string> = {
  Aguila: 'text-emerald-600',
  Triunfo: 'text-yellow-600',
  Fuego: 'text-orange-600',
  Impetu: 'text-purple-600',
  Dominio: 'text-blue-600',
};

const RANK_COLORS = [
  'bg-yellow-400 border-yellow-600 text-black shadow-yellow-400/50',
  'bg-slate-300 border-slate-400 text-slate-800 shadow-slate-300/50',
  'bg-orange-300 border-orange-400 text-orange-900 shadow-orange-300/50',
  'bg-white border-gray-200 text-gray-600 shadow-gray-200/50',
  'bg-white border-gray-200 text-gray-600 shadow-gray-200/50',
];

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<any, any> {
  state: any;
  props: any;
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-red-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="bg-red-50 p-4 rounded-xl mb-6 text-left overflow-auto max-h-40">
              <code className="text-xs text-red-600 break-all">{this.state.errorInfo}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-yellow-400/30"
            >
              Refresh Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [trxCsv, setTrxCsv] = useState(INITIAL_CSV);
  const [salesCsv, setSalesCsv] = useState(INITIAL_CSV);
  const [processedData, setProcessedData] = useState<RestaurantData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [rankingMode, setRankingMode] = useState<'total' | 'wow' | 'sales'>('wow');
  const [raceView, setRaceView] = useState<'restaurant' | 'zone'>('restaurant');
  const isAuthorizedToToggle = user?.email === "magpantay.jervi@gmail.com" || user?.email === "ben@gyg.com.sg" || user?.email === "daniel.sunga@gyg.com.sg";
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [raceWeek, setRaceWeek] = useState(0);
  const [chartTheme, setChartTheme] = useState<'dark' | 'light'>('light');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [lastTrxUpdate, setLastTrxUpdate] = useState<string | null>(null);
  const [lastSalesUpdate, setLastSalesUpdate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const salesInputRef = useRef<HTMLInputElement>(null);

  // Auth State Listener
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      if (u) {
        // Sync user document
        try {
          await setDoc(doc(db, 'users', u.uid), {
            email: u.email,
            role: (u.email === "magpantay.jervi@gmail.com" || u.email === "ben@gyg.com.sg" || u.email === "daniel.sunga@gyg.com.sg") ? 'admin' : 'user'
          }, { merge: true });
        } catch (error) {
          console.error("User sync failed", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Data Listener
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const path = 'dashboard_data/latest';
    const unsubscribe = onSnapshot(doc(db, 'dashboard_data', 'latest'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTrxCsv(data.transactions || INITIAL_CSV);
        setSalesCsv(data.sales || INITIAL_CSV);
        
        const trxTs = data.lastUpdatedTrx as Timestamp;
        if (trxTs) {
          const date = trxTs.toDate();
          const formatted = date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          setLastTrxUpdate(formatted);
        }

        const salesTs = data.lastUpdatedSales as Timestamp;
        if (salesTs) {
          const date = salesTs.toDate();
          const formatted = date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          setLastSalesUpdate(formatted);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const weekLabels = useMemo(() => {
    const numWeeks = processedData.length > 0 ? processedData[0].weeklyTotals.length : 1;
    return getWeekLabels(numWeeks);
  }, [processedData]);

  useEffect(() => {
    setProcessedData(combineCSVData(trxCsv, salesCsv));
  }, [trxCsv, salesCsv]);

  // Update selected week if it's out of bounds after data change, or auto-select latest
  useEffect(() => {
    if (weekLabels.length > 0) {
      setSelectedWeek(weekLabels.length - 1);
    }
  }, [weekLabels.length]);

  // Race Animation Logic
  useEffect(() => {
    let interval: any;
    if (isRaceActive) {
      setRaceWeek(0);
      const maxWeek = weekLabels.length - 1;
      interval = setInterval(() => {
        setRaceWeek((prev) => {
          if (prev >= maxWeek) {
            setIsRaceActive(false);
            return maxWeek;
          }
          return prev + 1;
        });
      }, 2500); // Slower animation
    }
    return () => clearInterval(interval);
  }, [isRaceActive, weekLabels.length]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateFirestoreData = async (fields: any) => {
    if (!user) return;
    const path = 'dashboard_data/latest';
    try {
      await setDoc(doc(db, 'dashboard_data', 'latest'), {
        ...fields,
        updatedBy: user.uid
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        updateFirestoreData({ 
          transactions: text,
          lastUpdatedTrx: Timestamp.now()
        });
      };
      reader.readAsText(file);
    }
  };

  const handleSalesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        updateFirestoreData({ 
          sales: text,
          lastUpdatedSales: Timestamp.now()
        });
      };
      reader.readAsText(file);
    }
  };

  const top5Overall = useMemo(() => {
    if (rankingMode === 'wow' && selectedWeek === 0) {
      return [];
    }

    return [...processedData]
      .sort((a, b) => {
        if (rankingMode === 'total') {
          return b.weeklyTotals[selectedWeek] - a.weeklyTotals[selectedWeek];
        } else if (rankingMode === 'sales') {
          return b.weeklySales[selectedWeek] - a.weeklySales[selectedWeek];
        } else {
          const aWow = a.wowChanges[selectedWeek - 1] || 0;
          const bWow = b.wowChanges[selectedWeek - 1] || 0;
          return bWow - aWow;
        }
      })
      .slice(0, 5);
  }, [processedData, selectedWeek, rankingMode]);

  const zoneData = useMemo(() => {
    return Object.keys(ZONES).map(zoneName => {
      const restaurants = processedData
        .filter(d => d.zone === zoneName)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      const total = restaurants.reduce((sum, o) => sum + o.weeklyTotals[selectedWeek], 0);
      const prevTotal = selectedWeek > 0 
        ? restaurants.reduce((sum, o) => sum + o.weeklyTotals[selectedWeek - 1], 0)
        : total;
      const wow = prevTotal === 0 ? 0 : ((total - prevTotal) / prevTotal) * 100;
      const change = total - prevTotal;

      const totalSales = restaurants.reduce((sum, o) => sum + o.weeklySales[selectedWeek], 0);
      const prevTotalSales = selectedWeek > 0
        ? restaurants.reduce((sum, o) => sum + o.weeklySales[selectedWeek - 1], 0)
        : totalSales;
      const wowSales = prevTotalSales === 0 ? 0 : ((totalSales - prevTotalSales) / prevTotalSales) * 100;
      
      return { zoneName, restaurants, total, wow, change, totalSales, wowSales };
    });
  }, [processedData, selectedWeek]);

  const podiumData = useMemo(() => {
    return [...zoneData].sort((a, b) => {
      if (rankingMode === 'total') return b.total - a.total;
      if (rankingMode === 'sales') return b.totalSales - a.totalSales;
      return b.wow - a.wow;
    });
  }, [zoneData, rankingMode]);

  const accumulatedPoints = useMemo(() => {
    return processedData.map(restaurant => {
      const points = restaurant.wowChanges.reduce((sum, wow) => sum + wow, 0);
      return { ...restaurant, points };
    }).sort((a, b) => b.points - a.points);
  }, [processedData]);

  const chartData = useMemo(() => {
    return weekLabels.map((week, idx) => {
      const entry: any = { name: week.label };
      
      if (raceView === 'restaurant') {
        const weekValues = processedData.map(restaurant => ({
          name: restaurant.name,
          value: rankingMode === 'total' ? restaurant.weeklyTotals[idx] : 
                 rankingMode === 'sales' ? restaurant.weeklySales[idx] :
                 (idx === 0 ? 0 : restaurant.wowChanges[idx - 1])
        })).sort((a, b) => b.value - a.value);

        processedData.forEach(restaurant => {
          const val = rankingMode === 'total' ? restaurant.weeklyTotals[idx] : 
                      rankingMode === 'sales' ? restaurant.weeklySales[idx] :
                      (idx === 0 ? 0 : restaurant.wowChanges[idx - 1]);
          entry[restaurant.name] = val;
          entry[`${restaurant.name}_rank`] = weekValues.findIndex(v => v.name === restaurant.name) + 1;
        });
      } else {
        const weekValues = Object.keys(ZONES).map(zoneName => {
          const restaurants = processedData.filter(r => r.zone === zoneName);
          const total = restaurants.reduce((sum, r) => sum + (rankingMode === 'total' ? r.weeklyTotals[idx] : 
                                                              rankingMode === 'sales' ? r.weeklySales[idx] : 
                                                              (idx === 0 ? 0 : r.wowChanges[idx - 1])), 0);
          return { name: zoneName, value: total };
        }).sort((a, b) => b.value - a.value);

        Object.keys(ZONES).forEach(zoneName => {
          const restaurants = processedData.filter(r => r.zone === zoneName);
          const val = restaurants.reduce((sum, r) => sum + (rankingMode === 'total' ? r.weeklyTotals[idx] : 
                                                            rankingMode === 'sales' ? r.weeklySales[idx] : 
                                                            (idx === 0 ? 0 : r.wowChanges[idx - 1])), 0);
          entry[zoneName] = val;
          entry[`${zoneName}_rank`] = weekValues.findIndex(v => v.name === zoneName) + 1;
        });
      }
      return entry;
    });
  }, [processedData, rankingMode, raceView, weekLabels]);

  const currentRaceTop10 = useMemo(() => {
    const weekIdx = isRaceActive ? raceWeek : weekLabels.length - 1;
    if (raceView === 'restaurant') {
      return [...processedData]
        .map(restaurant => ({
          name: restaurant.name,
          zone: restaurant.zone,
          value: rankingMode === 'total' ? restaurant.weeklyTotals[weekIdx] : 
                 rankingMode === 'sales' ? restaurant.weeklySales[weekIdx] :
                 (weekIdx === 0 ? 0 : restaurant.wowChanges[weekIdx - 1])
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    } else {
      return Object.keys(ZONES).map(zoneName => {
        const restaurants = processedData.filter(r => r.zone === zoneName);
        const val = restaurants.reduce((sum, r) => sum + (rankingMode === 'total' ? r.weeklyTotals[weekIdx] : 
                                                          rankingMode === 'sales' ? r.weeklySales[weekIdx] : 
                                                          (weekIdx === 0 ? 0 : r.wowChanges[weekIdx - 1])), 0);
        return { name: zoneName, zone: zoneName, value: val };
      }).sort((a, b) => b.value - a.value);
    }
  }, [processedData, rankingMode, isRaceActive, raceWeek, raceView, weekLabels.length]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const currentIdx = weekLabels.findIndex(w => w.label === payload.name);
    
    if (isRaceActive && currentIdx > raceWeek) return null;
    if (!isRaceActive && currentIdx >= weekLabels.length) return null;

    const rank = payload[`${dataKey}_rank`];
    const isSelected = raceView === 'restaurant' ? selectedRestaurant === dataKey : selectedZone === dataKey;
    const hasSelection = raceView === 'restaurant' ? selectedRestaurant !== null : selectedZone !== null;
    
    if (hasSelection && !isSelected) return null;

    let dotColor = "#FFD700"; 
    let dotSize = isSelected ? 8 : 5;

    if (rank === 1) { dotColor = "#fbbf24"; dotSize = isSelected ? 10 : 7; } 
    else if (rank === 2) { dotColor = "#94a3b8"; dotSize = isSelected ? 9 : 6; } 
    else if (rank === 3) { dotColor = "#b45309"; dotSize = isSelected ? 9 : 6; } 
    else if (rank <= 5) { dotColor = "#fef08a"; dotSize = isSelected ? 8 : 5; } 

    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={dotSize} 
          fill={dotColor} 
          stroke={isSelected ? (chartTheme === 'dark' ? "#fff" : "#000") : "#000"} 
          strokeWidth={isSelected ? 3 : 1.5} 
          className={cn(isSelected && "animate-pulse")}
        />
        {(rank <= 5 || isSelected) && (
          <text 
            x={cx} 
            y={cy - 14} 
            textAnchor="middle" 
            fill={chartTheme === 'dark' ? dotColor : '#000'} 
            fontSize={isSelected ? 12 : 10} 
            fontWeight="900"
            className="pointer-events-none uppercase tracking-tighter"
          >
            {dataKey}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-yellow-400 selection:text-black pb-20 relative overflow-hidden">
      {/* World Cup Theme Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.12]"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop')`,
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa]/50 via-transparent to-[#f8f9fa]/50" />
        
        {/* Floating Football Icons */}
        <div className="absolute top-[10%] left-[5%] opacity-[0.03] animate-bounce-slow">
          <Activity size={120} className="text-gray-400" />
        </div>
        <div className="absolute top-[20%] right-[8%] opacity-[0.03] animate-spin-slow">
          <Trophy size={180} className="text-gray-400" />
        </div>
        <div className="absolute bottom-[25%] right-[5%] opacity-[0.03] animate-bounce-slow">
          <Zap size={130} className="text-gray-400" />
        </div>
      </div>
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">GYG Singapore</h1>
              <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.2em]">Peak Hour Championship</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!isAuthReady ? (
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            ) : !user ? (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-yellow-400/20"
              >
                <Users size={18} />
                Login to Sync
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logged in as</span>
                  <span className="text-xs font-black uppercase tracking-tight text-gray-900">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-red-500"
                  title="Logout"
                >
                  <Activity size={18} />
                </button>
              </div>
            )}

            {/* Week Selection Dropdown */}
            <div className="relative group">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="appearance-none bg-gray-100 border border-gray-200 rounded-xl px-6 py-3 pr-12 text-sm font-black uppercase tracking-tight cursor-pointer hover:bg-gray-200 focus:ring-2 focus:ring-yellow-400/50 transition-all outline-none min-w-[200px]"
              >
                {weekLabels.map((week, idx) => (
                  <option key={week.label} value={idx}>
                    {week.label} ({week.date})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>

            {isAuthorizedToToggle && (
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setRankingMode('wow')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      rankingMode === 'wow' ? "bg-white text-black shadow-sm" : "text-gray-400"
                    )}
                  >
                    WoW % Growth
                  </button>
                  <button
                    onClick={() => setRankingMode('total')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      rankingMode === 'total' ? "bg-white text-black shadow-sm" : "text-gray-400"
                    )}
                  >
                    Total Txns
                  </button>
                  <button
                    onClick={() => setRankingMode('sales')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      rankingMode === 'sales' ? "bg-white text-black shadow-sm" : "text-gray-400"
                    )}
                  >
                    Total Sales
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      <Clock size={10} />
                      Trx: <span className="text-gray-600">{lastTrxUpdate || 'Never'}</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                      <Activity size={12} />
                      Import Trx
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      <Clock size={10} />
                      Sales: <span className="text-gray-600">{lastSalesUpdate || 'Never'}</span>
                    </div>
                    <button
                      onClick={() => salesInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                      <DollarSign size={12} />
                      Import Sales
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={salesInputRef} 
              onChange={handleSalesUpload} 
              accept=".csv" 
              className="hidden" 
            />
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8 space-y-12">
        
        {/* Top 5 Champions Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <Crown className="text-yellow-600 w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Top 5 Champions</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">The Elite Restaurants of the Week</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {top5Overall.length > 0 ? (
              top5Overall.map((restaurant, idx) => {
                const change = selectedWeek > 0 
                  ? restaurant.weeklyTotals[selectedWeek] - restaurant.weeklyTotals[selectedWeek - 1]
                  : 0;
                const salesChange = selectedWeek > 0
                  ? restaurant.weeklySales[selectedWeek] - restaurant.weeklySales[selectedWeek - 1]
                  : 0;

                return (
                  <motion.div
                    key={restaurant.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative bg-white p-8 rounded-[2rem] border border-gray-100 group overflow-hidden shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-yellow-400/10 transition-all border-b-4 border-b-gray-200"
                  >
                    <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                      <Trophy size={140} />
                    </div>
                    
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-2 transform -rotate-6 shadow-lg",
                        RANK_COLORS[idx]
                      )}>
                        {idx === 0 ? <Crown size={32} /> : idx + 1}
                      </div>
                      
                      <div>
                        <span className="font-black text-2xl uppercase tracking-tighter block">{restaurant.name}</span>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", ZONE_TEXT_COLORS[restaurant.zone])}>
                          {restaurant.zone}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-4xl font-mono font-black tracking-tighter">
                          {rankingMode === 'total' 
                            ? (restaurant.weeklyTotals[selectedWeek] || 0).toLocaleString() 
                            : rankingMode === 'sales'
                            ? '$' + (restaurant.weeklySales[selectedWeek] || 0).toLocaleString()
                            : (restaurant.wowChanges[selectedWeek - 1] || 0).toFixed(1) + '%'}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {rankingMode === 'total' ? 'Transactions' : rankingMode === 'sales' ? 'Sales' : 'WoW Growth'}
                        </div>
                      </div>

                      <div className={cn(
                        "mt-4 inline-flex items-center gap-2 text-sm font-black px-4 py-2 rounded-xl",
                        (restaurant.wowChanges[selectedWeek - 1] || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {(restaurant.wowChanges[selectedWeek - 1] || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span className="text-lg">
                          {rankingMode === 'sales' 
                            ? (salesChange >= 0 ? '+' : '') + salesChange.toLocaleString()
                            : (change >= 0 ? '+' : '') + change.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-5 bg-white p-12 rounded-[2rem] border border-gray-100 text-center shadow-lg">
                <Info className="mx-auto text-gray-300 w-12 h-12 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">Week 1 is the baseline. No WoW data available yet.</p>
              </div>
            )}
          </div>

          {/* 5-Way Podium Section */}
          <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative">
            {/* Podium Flare Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(234,179,8,0.15),transparent_70%)]" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50" />
            
            {/* Decorative Flare Elements */}
            <div className="absolute top-20 left-20 opacity-20 animate-pulse">
              <Sparkles className="text-yellow-500 w-12 h-12" />
            </div>
            <div className="absolute top-40 right-20 opacity-20 animate-bounce-slow">
              <Sparkles className="text-yellow-500 w-8 h-8" />
            </div>
            <div className="absolute bottom-40 left-1/4 opacity-10">
              <Trophy size={200} className="text-yellow-500/20" />
            </div>
            <div className="absolute bottom-40 right-1/4 opacity-10">
              <Trophy size={200} className="text-yellow-500/20" />
            </div>
            
            <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-40 flex items-center justify-center gap-4">
              <Star className="text-yellow-500 w-8 h-8 animate-spin-slow" />
              Zone Championship Podium
              <Star className="text-yellow-500 w-8 h-8 animate-spin-slow" />
            </h3>

            <div className="flex items-end justify-center gap-2 md:gap-4 max-w-5xl mx-auto h-[400px]">
              {/* 4th Place */}
              {podiumData[3] && (
                <div className="flex flex-col items-center group w-1/5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '140px' }}
                    className="w-full bg-gray-100 rounded-t-2xl border-x border-t border-gray-200 flex flex-col items-center justify-end pb-6 gap-2 relative group-hover:bg-gray-200 transition-colors"
                  >
                    <div className="absolute -top-20 flex flex-col items-center">
                      <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center border-2 shadow-sm mb-2", ZONE_COLORS[podiumData[3].zoneName])}>
                        {ZONE_ICONS[podiumData[3].zoneName]}
                      </div>
                    </div>
                    <span className="text-sm font-black uppercase tracking-tighter whitespace-nowrap mb-2">{podiumData[3].zoneName}</span>
                    <span className="text-3xl font-black text-gray-400">4</span>
                  </motion.div>
                  <div className="mt-4 text-center">
                    <div className="text-xl font-black text-emerald-600">
                      {rankingMode === 'wow' ? podiumData[3].wow.toFixed(1) + '%' : rankingMode === 'sales' ? '$' + (podiumData[3].totalSales || 0).toLocaleString() : (podiumData[3].total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 2nd Place */}
              {podiumData[1] && (
                <div className="flex flex-col items-center group w-1/5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '220px' }}
                    className="w-full bg-slate-200 rounded-t-3xl border-x border-t border-slate-300 flex flex-col items-center justify-end pb-8 gap-2 relative group-hover:bg-slate-300 transition-colors shadow-lg shadow-slate-200/50"
                  >
                    <div className="absolute -top-24 flex flex-col items-center">
                      <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-md mb-2 scale-110", ZONE_COLORS[podiumData[1].zoneName])}>
                        {ZONE_ICONS[podiumData[1].zoneName]}
                      </div>
                    </div>
                    <span className="text-base font-black uppercase tracking-tight whitespace-nowrap mb-2">{podiumData[1].zoneName}</span>
                    <span className="text-5xl font-black text-slate-500">2</span>
                  </motion.div>
                  <div className="mt-4 text-center">
                    <div className="text-2xl font-black text-emerald-600">
                      {rankingMode === 'wow' ? podiumData[1].wow.toFixed(1) + '%' : rankingMode === 'sales' ? '$' + (podiumData[1].totalSales || 0).toLocaleString() : (podiumData[1].total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {podiumData[0] && (
                <div className="flex flex-col items-center group w-1/5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '300px' }}
                    className="w-full bg-yellow-400 rounded-t-[2.5rem] border-x border-t border-yellow-500 flex flex-col items-center justify-end pb-10 gap-2 relative group-hover:bg-yellow-500 transition-colors shadow-2xl shadow-yellow-400/30"
                  >
                    <div className="absolute -top-32 flex flex-col items-center">
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={cn("w-28 h-28 rounded-3xl flex items-center justify-center border-4 shadow-xl mb-4 scale-125", ZONE_COLORS[podiumData[0].zoneName])}
                      >
                        {ZONE_ICONS[podiumData[0].zoneName]}
                      </motion.div>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap text-yellow-600">CHAMPION</span>
                    <span className="text-lg font-black uppercase tracking-tight whitespace-nowrap mb-2">{podiumData[0].zoneName}</span>
                    <Crown className="w-12 h-12 text-yellow-700 mb-2" />
                    <span className="text-8xl font-black text-yellow-800">1</span>
                  </motion.div>
                  <div className="mt-4 text-center">
                    <div className="text-3xl font-black text-emerald-600">
                      {rankingMode === 'wow' ? podiumData[0].wow.toFixed(1) + '%' : rankingMode === 'sales' ? '$' + (podiumData[0].totalSales || 0).toLocaleString() : (podiumData[0].total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {podiumData[2] && (
                <div className="flex flex-col items-center group w-1/5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '180px' }}
                    className="w-full bg-orange-200 rounded-t-3xl border-x border-t border-orange-300 flex flex-col items-center justify-end pb-8 gap-2 relative group-hover:bg-orange-300 transition-colors shadow-lg shadow-orange-200/50"
                  >
                    <div className="absolute -top-24 flex flex-col items-center">
                      <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-md mb-2", ZONE_COLORS[podiumData[2].zoneName])}>
                        {ZONE_ICONS[podiumData[2].zoneName]}
                      </div>
                    </div>
                    <span className="text-base font-black uppercase tracking-tight whitespace-nowrap mb-2">{podiumData[2].zoneName}</span>
                    <span className="text-4xl font-black text-orange-500">3</span>
                  </motion.div>
                  <div className="mt-4 text-center">
                    <div className="text-2xl font-black text-emerald-600">
                      {rankingMode === 'wow' ? podiumData[2].wow.toFixed(1) + '%' : rankingMode === 'sales' ? '$' + (podiumData[2].totalSales || 0).toLocaleString() : (podiumData[2].total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 5th Place */}
              {podiumData[4] && (
                <div className="flex flex-col items-center group w-1/5">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100px' }}
                    className="w-full bg-gray-50 rounded-t-xl border-x border-t border-gray-100 flex flex-col items-center justify-end pb-4 gap-1 relative group-hover:bg-gray-100 transition-colors"
                  >
                    <div className="absolute -top-20 flex flex-col items-center">
                      <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center border-2 shadow-sm mb-2", ZONE_COLORS[podiumData[4].zoneName])}>
                        {ZONE_ICONS[podiumData[4].zoneName]}
                      </div>
                    </div>
                    <span className="text-sm font-black uppercase tracking-tighter whitespace-nowrap mb-2">{podiumData[4].zoneName}</span>
                    <span className="text-2xl font-black text-gray-300">5</span>
                  </motion.div>
                  <div className="mt-4 text-center">
                    <div className="text-xl font-black text-emerald-600">
                      {rankingMode === 'wow' ? podiumData[4].wow.toFixed(1) + '%' : rankingMode === 'sales' ? '$' + (podiumData[4].totalSales || 0).toLocaleString() : (podiumData[4].total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Zone Battle Grid */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <Shield className="text-blue-600 w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Zone Leagues</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Restaurant Standings by Zone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {zoneData.map((zone) => (
              <div key={zone.zoneName} className="space-y-4">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-xl relative z-10">
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-4 rounded-xl border-2 shadow-sm", ZONE_COLORS[zone.zoneName])}>
                        {ZONE_ICONS[zone.zoneName]}
                      </div>
                      <span className="font-black uppercase tracking-tight text-lg">{zone.zoneName}</span>
                    </div>
                    <div className={cn(
                      "text-lg font-black px-3 py-1.5 rounded-xl flex items-center justify-center gap-2 shadow-sm w-full",
                      zone.wow >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {zone.wow >= 0 ? '+' : ''}{zone.wow.toFixed(1)}%
                      <span className="opacity-60 text-xs font-black">({zone.change >= 0 ? '+' : ''}{zone.change})</span>
                    </div>
                  </div>
                  <div className="text-3xl font-mono font-black tracking-tighter">
                    {rankingMode === 'sales' ? '$' + (zone.totalSales || 0).toLocaleString() : (zone.total || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {rankingMode === 'sales' ? 'Total Sales' : 'Total Transactions'}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-xl overflow-hidden relative z-10">
                  <div className="divide-y divide-gray-50">
                    {zone.restaurants.map((restaurant) => {
                      const change = selectedWeek > 0 
                        ? restaurant.weeklyTotals[selectedWeek] - restaurant.weeklyTotals[selectedWeek - 1]
                        : 0;
                      return (
                        <div key={restaurant.name} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="text-sm font-black uppercase tracking-tight">{restaurant.name}</div>
                            <div className="text-lg font-black font-mono text-gray-800">
                              {rankingMode === 'sales' ? '$' + (restaurant.weeklySales[selectedWeek] || 0).toLocaleString() : (restaurant.weeklyTotals[selectedWeek] || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className={cn(
                            "text-lg font-black flex flex-col items-end gap-0.5 px-3 py-1.5 rounded-xl",
                            (restaurant.wowChanges[selectedWeek - 1] || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {selectedWeek > 0 && (
                              <>
                                <div className="flex items-center gap-1 text-xl">
                                  {(restaurant.wowChanges[selectedWeek - 1] || 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                  {Math.abs(restaurant.wowChanges[selectedWeek - 1] || 0).toFixed(1)}%
                                </div>
                                <div className="opacity-60 font-black text-sm">
                                  {change >= 0 ? '+' : ''}{change}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accumulated Points Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-2xl">
              <Star className="text-purple-600 w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Accumulated Points</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tally from Week 2 Onwards (1% Growth = 1 Point)</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-2xl overflow-hidden relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
              {accumulatedPoints.map((restaurant, idx) => (
                <div key={restaurant.name} className="bg-white p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2",
                      ZONE_COLORS[restaurant.zone]
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-base font-black uppercase tracking-tight">{restaurant.name}</div>
                      <div className={cn("text-[9px] font-black uppercase tracking-widest", ZONE_TEXT_COLORS[restaurant.zone])}>
                        {restaurant.zone}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-2xl font-mono font-black tracking-tighter",
                      restaurant.points >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {restaurant.points >= 0 ? '+' : ''}{restaurant.points.toFixed(1)}
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Replay */}
        <section className={cn(
          "p-12 rounded-[3rem] relative overflow-hidden shadow-2xl transition-all duration-500 border z-10",
          chartTheme === 'dark' ? "bg-slate-900 border-slate-800 shadow-black/50" : "bg-white border-gray-100 shadow-gray-200/50"
        )}>
          <div className="absolute top-0 right-0 p-12 opacity-[0.05]">
            <BarChart3 size={300} className={chartTheme === 'dark' ? "text-white" : "text-black"} />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 mb-16">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "p-5 rounded-3xl border-2 transition-all duration-500",
                  chartTheme === 'dark' 
                    ? "bg-slate-800 border-yellow-400/50" 
                    : "bg-white border-blue-600/30"
                )}>
                  <BarChart3 className={cn("w-12 h-12", chartTheme === 'dark' ? "text-yellow-400" : "text-blue-600")} />
                </div>
                <div>
                  <h2 className={cn("text-5xl font-black uppercase tracking-tighter mb-2", chartTheme === 'dark' ? "text-white" : "text-black")}>Statistics Replay</h2>
                  <div className="flex items-center gap-4">
                    <p className="text-base text-gray-500 font-bold uppercase tracking-[0.2em]">Weekly performance tracking across all restaurants</p>
                    {(selectedRestaurant || selectedZone) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-yellow-400/10 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-400/20 animate-pulse flex items-center gap-2"
                      >
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        Focus Mode: {raceView === 'restaurant' ? selectedRestaurant : selectedZone}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* View Toggle */}
                <div className={cn(
                  "flex p-1 rounded-xl border",
                  chartTheme === 'dark' ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
                )}>
                  <button
                    onClick={() => setRaceView('restaurant')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      raceView === 'restaurant' ? "bg-white text-black shadow-sm" : "text-gray-500"
                    )}
                  >
                    <Users size={12} />
                    Restaurants
                  </button>
                  <button
                    onClick={() => setRaceView('zone')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      raceView === 'zone' ? "bg-white text-black shadow-sm" : "text-gray-500"
                    )}
                  >
                    <Map size={12} />
                    Zones
                  </button>
                </div>

                {/* Selector */}
                {raceView === 'restaurant' ? (
                  <select 
                    value={selectedRestaurant || ''} 
                    onChange={(e) => setSelectedRestaurant(e.target.value || null)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all outline-none min-w-[180px]",
                      chartTheme === 'dark' 
                        ? "bg-gray-800 border-gray-700 text-white focus:border-yellow-500" 
                        : "bg-gray-50 border-gray-200 text-black focus:border-yellow-500"
                    )}
                  >
                    <option value="">All Restaurants</option>
                    {processedData.map(o => (
                      <option key={o.name} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                ) : (
                  <select 
                    value={selectedZone || ''} 
                    onChange={(e) => setSelectedZone(e.target.value || null)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all outline-none min-w-[180px]",
                      chartTheme === 'dark' 
                        ? "bg-gray-800 border-gray-700 text-white focus:border-yellow-500" 
                        : "bg-gray-50 border-gray-200 text-black focus:border-yellow-500"
                    )}
                  >
                    <option value="">All Zones</option>
                    {Object.keys(ZONES).map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={() => setChartTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    "p-3 rounded-xl border transition-all",
                    chartTheme === 'dark' 
                      ? "bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {chartTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                  onClick={() => setIsRaceActive(true)}
                  disabled={isRaceActive}
                  className={cn(
                    "flex items-center gap-3 px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                    isRaceActive 
                      ? (chartTheme === 'dark' ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed")
                      : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                  )}
                >
                  <Flame className={cn("w-6 h-6", !isRaceActive && "animate-bounce")} />
                  {isRaceActive ? 'Replaying...' : 'Start The Replay'}
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
              <div className="h-[800px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(0, isRaceActive ? raceWeek + 1 : weekLabels.length)}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={chartTheme === 'dark' ? "#ffffff20" : "#00000015"} 
                      vertical={false} 
                      strokeWidth={1}
                    />
                    <XAxis 
                      dataKey="name" 
                      stroke={chartTheme === 'dark' ? "#ffffff60" : "#00000060"} 
                      fontSize={14} 
                      fontWeight="900"
                      tickLine={false} 
                      axisLine={false} 
                      dy={15}
                    />
                    <YAxis 
                      stroke={chartTheme === 'dark' ? "#ffffff60" : "#00000060"} 
                      fontSize={14} 
                      fontWeight="900"
                      tickLine={false} 
                      axisLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => rankingMode === 'total' ? `${(val/1000).toFixed(1)}k` : rankingMode === 'sales' ? `$${(val/1000).toFixed(0)}k` : `${val.toFixed(1)}%`}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={cn(
                              "border rounded-2xl p-6 shadow-2xl min-w-[200px]",
                              chartTheme === 'dark' ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"
                            )}>
                              <p className="text-yellow-500 font-black uppercase tracking-widest text-xs mb-4 border-b border-gray-800 pb-2">{label}</p>
                              <div className="space-y-3">
                                {payload
                                  .sort((a, b) => (b.value as number) - (a.value as number))
                                  .filter((item: any, idx: number) => idx < 10 || (raceView === 'restaurant' ? selectedRestaurant === item.name : selectedZone === item.name))
                                  .map((item: any) => {
                                    const rank = item.payload[`${item.name}_rank`];
                                    const isSelected = raceView === 'restaurant' ? selectedRestaurant === item.name : selectedZone === item.name;
                                    return (
                                      <div key={item.name} className={cn(
                                        "flex items-center justify-between gap-6 p-1 rounded-lg",
                                        isSelected ? "bg-yellow-400/10" : ""
                                      )}>
                                        <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                          <span className={cn(
                                            "font-black text-[10px] uppercase tracking-tight",
                                            chartTheme === 'dark' ? "text-white" : "text-black"
                                          )}>{item.name}</span>
                                        </div>
                                        <span className={cn(
                                          "font-mono text-xs font-black",
                                          chartTheme === 'dark' ? "text-gray-400" : "text-gray-600"
                                        )}>
                                          {typeof item.value === 'number' ? (rankingMode === 'sales' ? '$' + (item.value || 0).toLocaleString() : (item.value || 0).toFixed(1)) : (item.value || '')}
                                          {rankingMode === 'wow' && '%'}
                                          <span className="text-yellow-500 ml-2">({rank})</span>
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {(raceView === 'restaurant' ? processedData : Object.keys(ZONES).map(z => ({ name: z, zone: z }))).map((item: any, i) => {
                      const isSelected = raceView === 'restaurant' ? selectedRestaurant === item.name : selectedZone === item.name;
                      const hasSelection = raceView === 'restaurant' ? selectedRestaurant !== null : selectedZone !== null;
                      
                      return (
                        <Line
                          key={item.name}
                          type="monotone"
                          dataKey={item.name}
                          stroke={ZONE_TEXT_COLORS[item.zone] || '#666'}
                          strokeWidth={isSelected ? 10 : (isRaceActive ? 7 : 5)}
                          strokeOpacity={hasSelection && !isSelected ? 0.1 : 1}
                          dot={<CustomDot />}
                          activeDot={{ r: 10, stroke: '#fff', strokeWidth: 4 }}
                          animationDuration={2500}
                          connectNulls
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* League Table Sidebar */}
              <div className={cn(
                "w-full lg:w-96 rounded-3xl border p-8 pb-12 backdrop-blur-sm flex flex-col min-h-[850px]",
                chartTheme === 'dark' ? "bg-black/30 border-white/5" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-black uppercase tracking-[0.1em] text-yellow-500">League Table</h3>
                  <div className="text-sm font-mono text-gray-500 font-bold">
                    {weekLabels[isRaceActive ? raceWeek : weekLabels.length - 1]?.label}
                  </div>
                </div>
                <div className="space-y-6 flex-1">
                  {currentRaceTop10.map((item, idx) => (
                    <motion.div 
                      key={item.name}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center gap-6 group p-3 rounded-2xl transition-all",
                        (raceView === 'restaurant' ? selectedRestaurant === item.name : selectedZone === item.name) ? "bg-yellow-400/20 border border-yellow-400/30" : "hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-md shrink-0",
                        idx === 0 ? "bg-yellow-400 text-black" : 
                        idx === 1 ? "bg-gray-300 text-black" :
                        idx === 2 ? "bg-orange-400 text-black" : 
                        chartTheme === 'dark' ? "bg-slate-800 text-gray-400" : "bg-white text-gray-400 border border-gray-100"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-lg font-black uppercase tracking-tight truncate",
                          chartTheme === 'dark' ? "text-white" : "text-gray-900"
                        )}>{item.name}</div>
                        <div className={cn("text-xs font-bold uppercase tracking-widest", ZONE_TEXT_COLORS[item.zone] || 'text-gray-400')}>
                          {item.zone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-black font-mono",
                          chartTheme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          {rankingMode === 'total' ? (item.value / 1000).toFixed(1) + 'k' : rankingMode === 'sales' ? '$' + (item.value / 1000).toFixed(0) + 'k' : item.value.toFixed(1) + '%'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-white/10 text-center">
                  <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">
                    {isRaceActive ? "Replay in progress..." : "Final Standings"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="max-w-[1600px] mx-auto p-12 mt-20 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              {Object.entries(ZONES).map(([name, _], idx) => (
                <div 
                  key={name}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-xl",
                    ZONE_COLORS[name]
                  )}
                  style={{ zIndex: 10 - idx }}
                >
                  {ZONE_ICONS[name]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-900">GYG Singapore Peak Hour Championship</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Version 2024.1.0 • World Cup Edition</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">System Status</p>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-tighter">Live Data Feed Active</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
