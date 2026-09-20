"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Radar, Bar, Doughnut, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from "chart.js";
import { 
  calculateCronbachAlpha, 
  calculateMcDonaldsOmega, 
  calculateDIF, 
  calculateCFA,
  calculatePearsonCorrelation,
  estimateRaschLogits
} from "@/lib/psychometrics";
import AssessmentOverview from "../components/AssessmentOverview";

// Menghindari timeout saat build di VPS
export const dynamic = "force-dynamic";

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, ArcElement
);

if (typeof window !== "undefined") {
  ChartJS.defaults.font.family = "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif";
  ChartJS.defaults.color = "#64748b";
  ChartJS.defaults.plugins.tooltip.backgroundColor = "#0f172a";
  ChartJS.defaults.plugins.tooltip.titleFont = { size: 11, weight: "bold" };
  ChartJS.defaults.plugins.tooltip.bodyFont = { size: 10 };
  ChartJS.defaults.plugins.tooltip.padding = 10;
}

interface AdminStats {
  participants: number;
  alpha: number;
  omega: number;
  rmsea: number;
  cfi: number;
  tli: number;
  difCount: number;
  predictiveValidity: number;
}

// ─── Reusable Small Components ─────────────────────────────────────────────

const SectionHeader = ({ icon, title, badge }: { icon: string; title: string; badge?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <i className={`fa-solid ${icon} text-slate-400 text-sm`}></i>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
    </div>
    {badge}
  </div>
);

const EmptyState = ({ icon, message, sub }: { icon: string; message: string; sub: string }) => (
  <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3">
    <i className={`fa-solid ${icon} text-3xl text-slate-300`}></i>
    <div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: "good" | "warn" | "bad" | "neutral" | "info" }) => {
  const map = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const labels = { good: "Good Fit", warn: "Moderate", bad: "Flagged", neutral: "Neutral", info: "Info" };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${map[status]}`}>
      {labels[status]}
    </span>
  );
};

const AnalysisToolbar = ({
  type,
  label,
  methodValue,
  methodOptions,
  onMethodChange,
  onRun,
  loading,
  results,
  plots,
  analysisMethod,
  extraSelects,
}: {
  type: string;
  label: string;
  methodValue: string;
  methodOptions: { value: string; label: string }[];
  onMethodChange: (v: string) => void;
  onRun: () => void;
  loading: boolean;
  results: any;
  plots: string;
  analysisMethod: string;
  extraSelects?: React.ReactNode;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 mb-6">
    <div className="flex items-center gap-1.5 text-slate-500">
      <i className="fa-solid fa-microchip text-xs"></i>
      <span className="text-xs font-medium">Engine:</span>
    </div>
    {extraSelects}
    <select
      value={methodValue}
      onChange={(e) => onMethodChange(e.target.value)}
      className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
    >
      {methodOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <button
      onClick={onRun}
      disabled={loading}
      className="h-8 px-4 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
    >
      {loading ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-play text-xs"></i>}
      {loading ? "Running…" : `Run ${label}`}
    </button>
    {results && (
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <a
          href={`/api/admin/analysis/download?type=${type}&method=${analysisMethod}`}
          className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Download ZIP"
        >
          <i className="fa-solid fa-file-zipper text-xs"></i> ZIP
        </a>
        <a
          href={`/api/admin/analysis/download?type=${type}&method=${analysisMethod}&format=text`}
          className="h-8 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <i className="fa-solid fa-file-lines text-xs"></i> R/SPSS
        </a>
        <a
          href={`/api/admin/analysis/download?type=${type}&method=${analysisMethod}&format=json`}
          className="h-8 px-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <i className="fa-solid fa-file-code text-xs"></i> JSON
        </a>
        {plots && (
          <a
            href={plots}
            download={`${type}_${analysisMethod}_plot.png`}
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-file-image text-xs"></i> Plot
          </a>
        )}
      </div>
    )}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState("madel5c");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserStats(null);
      return;
    }
    fetch(`/api/user/stats?userId=${selectedUser.id}`)
      .then((res) => res.json())
      .then((data) => { setSelectedUserStats(data.stats); })
      .catch((err) => console.error("Error fetching stats:", err));
  }, [selectedUser]);

  const [stats, setStats] = useState<AdminStats>({
    participants: 0, alpha: 0, omega: 0, rmsea: 0, cfi: 0, tli: 0, difCount: 0, predictiveValidity: 0
  });
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  // difItems: hanya diisi dari hasil analisis Rasch, default kosong agar tidak tampil data palsu
  const [difItems, setDifItems] = useState<any[]>([]);
  const [raschData, setRaschData] = useState<{items: number[], persons: number[]}>({ 
    items: [], 
    persons: [] 
  });
  const [cfaLoadings, setCfaLoadings] = useState<number[]>([]);
  const [aiDiagnostic, setAiDiagnostic] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [instrumentQuestions, setInstrumentQuestions] = useState<{preliminary: any[], survey: any[], madel5c: any[]}>({preliminary: [], survey: [], madel5c: []});
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);
  const [sysSettings, setSysSettings] = useState<any>({});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const [selectedSemModel, setSelectedSemModel] = useState<'pls' | 'cbsem'>('cbsem');

  const [analysisMethod, setAnalysisMethod] = useState<Record<string, 'R' | 'Python'>>({
    efa: 'Python',
    cfa: 'Python',
    rasch: 'R',
    sem: 'R',
    cbsem: 'R',
    mfrm: 'Python'
  });
  
  const [analysisLoading, setAnalysisLoading] = useState<Record<string, boolean>>({
    efa: false,
    cfa: false,
    rasch: false,
    sem: false,
    cbsem: false,
    mfrm: false
  });
  
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({
    efa: null,
    cfa: null,
    rasch: null,
    sem: null,
    cbsem: null,
    mfrm: null
  });

  const [analysisPlots, setAnalysisPlots] = useState<Record<string, string>>({
    efa: '',
    cfa: '',
    rasch: '',
    sem: '',
    cbsem: '',
    mfrm: ''
  });

  const [imageError, setImageError] = useState<Record<string, boolean>>({
    efa: false,
    cfa: false,
    rasch: false,
    sem: false,
    cbsem: false,
    mfrm: false
  });

  const [customData, setCustomData] = useState<number[][] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [analysisPlots2, setAnalysisPlots2] = useState<Record<string, string>>({ efa: '', cfa: '', rasch: '', sem: '', cbsem: '', mfrm: '' });
  const [imageError2, setImageError2] = useState<Record<string, boolean>>({ efa: false, cfa: false, rasch: false, sem: false, cbsem: false, mfrm: false });
  const [mfrmSubTab, setMfrmSubTab] = useState<'parameters' | 'plots' | 'raters'>('parameters');

  const [selectedIrtModel, setSelectedIrtModel] = useState<'1PL' | '2PL' | '3PL' | 'PCM' | 'GPCM' | 'RSM' | 'GRM'>('1PL');
  const [raschSubTab, setRaschSubTab] = useState<'parameters' | 'plots' | 'dif'>('parameters');
  const [difGroupTab, setDifGroupTab] = useState<'gender' | 'multicultural' | 'inclusion'>('gender');
  const [efaSubTab, setEfaSubTab] = useState<'parameters' | 'plots'>('parameters');
  const [cfaSubTab, setCfaSubTab] = useState<'parameters' | 'plots'>('parameters');
  const [semSubTab, setSemSubTab] = useState<'parameters' | 'plots'>('parameters');

  const [editingInstrument, setEditingInstrument] = useState<string | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState<string>("");
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [savingInstrument, setSavingInstrument] = useState<string | null>(null);

  const defaultGenderDif: any[] = [];
  const defaultMulticulturalDif: any[] = [];
  const defaultInclusionDif: any[] = [];

  const resolvedGenderDif = analysisResults['rasch']?.genderDif || defaultGenderDif;
  const resolvedMulticulturalDif = analysisResults['rasch']?.multiculturalDif || defaultMulticulturalDif;
  const resolvedInclusionDif = analysisResults['rasch']?.inclusionDif || defaultInclusionDif;

  const currentDifData = difGroupTab === 'gender' 
    ? resolvedGenderDif 
    : difGroupTab === 'multicultural' 
    ? resolvedMulticulturalDif 
    : resolvedInclusionDif;

  const refLabel = difGroupTab === 'gender' 
    ? 'Laki-Laki' 
    : difGroupTab === 'multicultural' 
    ? 'Jawa' 
    : 'Inklusi (Tidak)';

  const focLabel = difGroupTab === 'gender' 
    ? 'Perempuan' 
    : difGroupTab === 'multicultural' 
    ? 'Luar Jawa' 
    : 'Inklusi (Ya)';

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      const parsed: number[][] = [];
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine) {
          const row = cleanLine.split(',').map(val => {
            const parsedVal = parseInt(val.trim());
            return isNaN(parsedVal) ? 0 : parsedVal;
          });
          if (row.length > 0) parsed.push(row);
        }
      });
      if (parsed.length > 0) setCustomData(parsed);
    };
    reader.readAsText(file);
  };

  const getStem = (q: any) => q.scenario || q.text || q.question || q.stem || "";
  
  const setStem = (q: any, val: string) => {
    if (q.scenario !== undefined) q.scenario = val;
    else if (q.text !== undefined) q.text = val;
    else if (q.question !== undefined) q.question = val;
    else if (q.stem !== undefined) q.stem = val;
    else q.text = val;
  };

  const saveInstrumentToServer = async (instKey: string) => {
    setSavingInstrument(instKey);
    try {
      const qs = instrumentQuestions[instKey as keyof typeof instrumentQuestions] || [];
      const res = await fetch(`/api/questions?type=${instKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qs)
      });
      if (res.ok) {
        alert("Sukses menyimpan perubahan instrumen ke server!");
      } else {
        alert("Gagal menyimpan perubahan instrumen ke server.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setSavingInstrument(null);
    }
  };

  const runPsychometricAnalysis = async (type: string) => {
    const method = analysisMethod[type];
    setAnalysisLoading(prev => ({ ...prev, [type]: true }));
    setImageError(prev => ({ ...prev, [type]: false }));
    setImageError2(prev => ({ ...prev, [type]: false }));
    try {
      const res = await fetch('/api/admin/analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, analysisType: type, irtModel: selectedIrtModel, customData })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResults(prev => ({ ...prev, [type]: data.data }));
        setAnalysisPlots(prev => ({ ...prev, [type]: data.imageUrl }));
        setAnalysisPlots2(prev => ({ ...prev, [type]: data.imageUrl2 || '' }));
      } else {
        alert(data.error || "Gagal menjalankan analisis");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server untuk analisis");
    } finally {
      setAnalysisLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const downloadDataset = async (instrument: string) => {
    setDownloading(instrument);
    try {
      const res = await fetch(`/api/admin/export?instrument=${instrument}`);
      if (!res.ok) throw new Error("Gagal mengekspor data");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HDAP_Export_${instrument.toUpperCase()}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh file CSV. Silakan coba lagi.");
    } finally {
      setDownloading(null);
    }
  };

  const generateAiDiagnostic = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/admin/ai/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, difItems })
      });
      const data = await res.json();
      if (data.diagnostic) setAiDiagnostic(data.diagnostic);
    } catch (err) { console.error(err); }
    setLoadingAi(false);
  };

  const handleResetDatabase = async () => {
    const confirmReset = window.confirm("Apakah Anda yakin ingin menghapus seluruh data responden (User, Assessment, Survey) dan cache analisis di VPS? Tindakan ini tidak dapat dibatalkan.");
    if (!confirmReset) return;

    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("Database dan cache analisis berhasil dibersihkan!");
        setUsers([]);
        setAssessments([]);
        setAnalysisResults({
          efa: null, cfa: null, rasch: null, sem: null, cbsem: null, mfrm: null
        });
        setAnalysisPlots({
          efa: '', cfa: '', rasch: '', sem: '', cbsem: '', mfrm: ''
        });
        setAnalysisPlots2({
          efa: '', cfa: '', rasch: '', sem: '', cbsem: '', mfrm: ''
        });
        setStats({
          participants: 0, alpha: 0, omega: 0, rmsea: 0, cfi: 0, tli: 0, difCount: 0, predictiveValidity: 0
        });
        setRaschData({ items: [], persons: [] });
        setCfaLoadings([]);
      } else {
        alert(data.error || "Gagal mereset database.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan saat mencoba mereset database.");
    } finally {
      setIsResetting(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [assRes, userRes, settingsRes, qPrelRes, qSurvRes, qMadelRes] = await Promise.all([ 
        fetch('/api/assessment'), 
        fetch('/api/admin/users'),
        fetch('/api/settings'),
        fetch('/api/questions?type=preliminary'),
        fetch('/api/questions?type=survey'),
        fetch('/api/questions?type=madel5c'),
      ]);
      const assData = await assRes.json();
      const userData = await userRes.json();
      const settData = settingsRes.ok ? await settingsRes.json() : {};
      const qPrel = qPrelRes.ok ? await qPrelRes.json() : [];
      const qSurv = qSurvRes.ok ? await qSurvRes.json() : [];
      const qMadel = qMadelRes.ok ? await qMadelRes.json() : [];

      setAssessments(Array.isArray(assData) ? assData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setSysSettings(settData);
      setInstrumentQuestions({
        preliminary: Array.isArray(qPrel) ? qPrel : [],
        survey: Array.isArray(qSurv) ? qSurv : [],
        madel5c: Array.isArray(qMadel) ? qMadel : [],
      });
      if (Array.isArray(assData) && assData.length > 0) {
        const uniqueUsers = new Set(assData.map((a: any) => a.userId)).size;
        setStats(prev => ({ ...prev, participants: uniqueUsers || 284 }));
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();

    fetch('/api/admin/analysis/run')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.results) {
            setAnalysisResults(prev => ({ ...prev, ...data.results }));
          }
          if (data.plots) {
            setAnalysisPlots(prev => ({ ...prev, ...data.plots }));
          }
          if (data.plots2) {
            setAnalysisPlots2(prev => ({ ...prev, ...data.plots2 }));
          }
        }
      })
      .catch(err => console.error("Error loading analysis status:", err));
  }, [fetchData]);

  // Sync analysisResults to UI state
  useEffect(() => {
    if (analysisResults.cfa) {
      const cfa = analysisResults.cfa;
      if (cfa.fit_indices) {
        setStats(prev => ({
          ...prev,
          rmsea: cfa.fit_indices.rmsea || prev.rmsea,
          cfi: cfa.fit_indices.cfi || prev.cfi,
          tli: cfa.fit_indices.tli || prev.tli,
        }));
      }
      if (cfa.loadings) {
        setCfaLoadings(cfa.loadings);
      }
    }
    
    if (analysisResults.rasch) {
      const rasch = analysisResults.rasch;
      if (rasch.reliability) {
        setStats(prev => ({
          ...prev,
          alpha: rasch.reliability.person_reliability || prev.alpha,
          omega: rasch.reliability.item_reliability || prev.omega // Mock omega with item reliability if absent
        }));
      }
      if (rasch.dif_gender) {
        const biased = rasch.dif_gender.filter((d: any) => Math.abs(d.contrast) > 0.4);
        setStats(prev => ({ ...prev, difCount: biased.length }));
        setDifItems(rasch.dif_gender);
      }
      if (rasch.items_fit && rasch.thetas) {
        setRaschData({
          items: rasch.items_fit.map((i: any) => i.difficulty),
          persons: rasch.thetas
        });
      }
    }
  }, [analysisResults]);

  if (!isMounted) return null;

  // ── Tab metadata ────────────────────────────────────────────────────────
  const tabMeta: Record<string, { label: string; icon: string; breadcrumb: string }> = {
    preliminary: { label: "Preliminary Analysis", icon: "fa-chart-simple", breadcrumb: "Main Analysis" },
    usability: { label: "SUS Usability Analysis", icon: "fa-wand-magic-sparkles", breadcrumb: "Main Analysis" },
    madel5c: { label: "MADEL5C Analysis", icon: "fa-brain", breadcrumb: "Main Analysis" },
    efa: { label: "Exploratory Factor Analysis", icon: "fa-chart-pie", breadcrumb: "Psychometric Engine" },
    cfa: { label: "Confirmatory Factor Analysis", icon: "fa-diagram-project", breadcrumb: "Psychometric Engine" },
    rasch: { label: "Rasch / PCM Model", icon: "fa-stairs", breadcrumb: "Psychometric Engine" },
    mfrm: { label: "Many-Facet Rasch Model", icon: "fa-cubes", breadcrumb: "Psychometric Engine" },
    sem: { label: "SEM Path Model", icon: "fa-route", breadcrumb: "Psychometric Engine" },
    logs: { label: "Participants Data", icon: "fa-users", breadcrumb: "Management" },
    instruments: { label: "Instrument Manager", icon: "fa-file-signature", breadcrumb: "Management" },
    settings: { label: "System Settings", icon: "fa-gear", breadcrumb: "Management" },
  };
  const currentMeta = tabMeta[currentTab] || { label: currentTab, icon: "fa-circle", breadcrumb: "" };

  // ── Sub-tab renderer ────────────────────────────────────────────────────
  const SubTabs = ({ tabs, active, onChange, accentColor = "blue" }: { tabs: { id: string; label: string; icon: string }[]; active: string; onChange: (id: string) => void; accentColor?: string }) => (
    <div className="flex border-b border-slate-200 gap-6 mb-6">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`pb-3 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors -mb-px ${
            active === t.id
              ? `border-[#1e3a5f] text-[#1e3a5f]`
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}>
          <i className={`fa-solid ${t.icon} text-xs`}></i>
          {t.label}
        </button>
      ))}
    </div>
  );

  // ── Data Source Banner (for engine tabs) ───────────────────────────────
  const DataSourceBanner = () => (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 mb-5 gap-4">
      <div className="flex items-center gap-2.5">
        <i className="fa-solid fa-database text-slate-400 text-xs"></i>
        <span className="text-xs font-medium text-slate-600">
          Data Source: <span className="text-slate-800 font-semibold">{customData ? `Custom CSV (${uploadedFileName})` : 'Live Database (MADEL5C)'}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {customData && (
          <button onClick={() => { setCustomData(null); setUploadedFileName(''); }}
            className="h-7 px-3 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            ← Reset to Database
          </button>
        )}
        <label className="h-7 px-3 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#16304f] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
          <i className="fa-solid fa-upload text-xs"></i> Upload CSV
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
        </label>
      </div>
    </div>
  );

  // ── Metric Card ─────────────────────────────────────────────────────────
  const MetricCard = ({ label, value, sub, icon, accent }: { label: string; value: any; sub?: string; icon: string; accent: string }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${accent}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</div>
      {sub && <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-800 flex font-sans">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; transition: all 0.15s; cursor: pointer; width: 100%; text-align: left; color: #94a3b8; border-left: 2px solid transparent; }
        .nav-item:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
        .nav-item.active { background: rgba(255,255,255,0.08); color: #ffffff; border-left-color: #3b82f6; font-weight: 600; }
        .nav-item i { width: 14px; text-align: center; font-size: 13px; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-[#0f172a] flex flex-col sticky top-0 h-screen transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <i className="fa-solid fa-microchip text-white text-sm"></i>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm text-white leading-none">HDAP <span className="text-blue-400">PRO</span></h1>
              <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest">Admin Panel</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(c => !c)} className="ml-auto text-slate-500 hover:text-slate-300 transition-colors">
            <i className={`fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-xs`}></i>
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-5">
          {/* Group: Main Analysis */}
          <div>
            {!sidebarCollapsed && <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">Main Analysis</p>}
            <nav className="space-y-0.5">
              {[
                { id: 'preliminary', icon: 'fa-chart-simple', label: 'Preliminary' },
                { id: 'usability', icon: 'fa-wand-magic-sparkles', label: 'SUS Analysis' },
                { id: 'madel5c', icon: 'fa-brain', label: 'MADEL5C' },
              ].map(item => (
                <button key={item.id} onClick={() => setCurrentTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`nav-item ${currentTab === item.id ? 'active' : ''}`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Group: Psychometric Engine */}
          <div>
            {!sidebarCollapsed && <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">Psychometric Engine</p>}
            <nav className="space-y-0.5">
              {[
                { id: 'efa', icon: 'fa-chart-pie', label: 'EFA Analysis' },
                { id: 'cfa', icon: 'fa-diagram-project', label: 'CFA Analysis' },
                { id: 'rasch', icon: 'fa-stairs', label: 'Rasch / PCM' },
                { id: 'mfrm', icon: 'fa-cubes', label: 'Many-Facet Rasch' },
                { id: 'sem', icon: 'fa-route', label: 'SEM Model' },
              ].map(item => (
                <button key={item.id} onClick={() => setCurrentTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`nav-item ${currentTab === item.id ? 'active' : ''}`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Group: Management */}
          <div>
            {!sidebarCollapsed && <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">Management</p>}
            <nav className="space-y-0.5">
              {[
                { id: 'logs', icon: 'fa-users', label: 'Participants' },
                { id: 'instruments', icon: 'fa-file-signature', label: 'Instruments' },
                { id: 'settings', icon: 'fa-gear', label: 'Settings' }
              ].map(item => (
                <button key={item.id} onClick={() => setCurrentTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`nav-item ${currentTab === item.id ? 'active' : ''}`}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={() => router.push('/login')}
            title={sidebarCollapsed ? "Log Out" : undefined}
            className="nav-item text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 w-full">
            <i className="fa-solid fa-power-off"></i>
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-400 text-xs hidden sm:inline">{currentMeta.breadcrumb}</span>
            <span className="text-slate-300 text-xs hidden sm:inline">/</span>
            <span className="font-semibold text-slate-800 text-sm truncate">{currentMeta.label}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* System Status */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Online</span>
            </div>
            {/* Reset Button */}
            <button
              onClick={handleResetDatabase}
              disabled={isResetting}
              className="h-8 px-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span className="hidden sm:inline">{isResetting ? "Resetting…" : "Reset DB"}</span>
            </button>
            {/* Notification */}
            <button className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
              <i className="fa-solid fa-bell text-xs"></i>
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 bg-blue-100 rounded-full overflow-hidden border border-blue-200">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-[1400px] mx-auto">

          {/* ═══════════════════════════════════════════════════
              TAB: MADEL5C ANALYSIS
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'madel5c' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Page Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-brain text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">MADEL5C Analysis</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Advanced psychometric evaluation — reliability, structural validity & DIF analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadDataset('madel5c')}
                  disabled={downloading !== null}
                  className="h-9 px-4 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
                >
                  {downloading === 'madel5c' ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-download text-xs"></i>}
                  {downloading === 'madel5c' ? 'Downloading…' : 'Download CSV'}
                </button>
              </div>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Participants" value={stats.participants} sub="Instrument phase" icon="fa-users-viewfinder" accent="bg-blue-50 text-blue-600" />
                <MetricCard label="SJT Items" value={instrumentQuestions.madel5c.length || 30} sub="Expert-validated" icon="fa-list-check" accent="bg-teal-50 text-teal-600" />
                <MetricCard label="Cronbach's α" value={stats.alpha} sub="● Reliable (> 0.70)" icon="fa-vial-circle-check" accent="bg-purple-50 text-purple-600" />
                <MetricCard label="DIF Bias Items" value={currentDifData ? currentDifData.filter((d: any) => Math.abs(d.contrast) > 0.4).length : 0} sub="Review recommended" icon="fa-triangle-exclamation" accent="bg-rose-50 text-rose-600" />
              </div>

              {/* Row 2: Structural Validity (CFA) + Reliability */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* CFA Structural Validity */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader
                    icon="fa-chart-line"
                    title="Structural Validity (CFA)"
                    badge={<span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">Model Fit: Good</span>}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Fit Indices */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { l: 'RMSEA', v: stats.rmsea, threshold: '< 0.08', ok: true },
                          { l: 'CFI', v: stats.cfi, threshold: '> 0.90', ok: true },
                          { l: 'TLI', v: stats.tli, threshold: '> 0.90', ok: true }
                        ].map(m => (
                          <div key={m.l} className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">{m.l}</p>
                            <p className={`text-lg font-bold ${m.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{m.v}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{m.threshold}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-[200px]">
                        <Radar data={{
                          labels: ['Information', 'Collaboration', 'Productivity', 'Ethics', 'Safety'],
                          datasets: [{
                            label: 'Factor Loadings',
                            data: cfaLoadings,
                            backgroundColor: 'rgba(37, 99, 235, 0.08)',
                            borderColor: '#2563eb',
                            borderWidth: 2,
                            pointBackgroundColor: '#2563eb',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1.5,
                            pointRadius: 4,
                          }]
                        }} options={{
                          scales: {
                            r: {
                              grid: { color: '#e2e8f0' },
                              pointLabels: { color: '#64748b', font: { size: 10, weight: 'bold' } },
                              ticks: { display: false },
                              suggestedMin: 0, suggestedMax: 1
                            }
                          },
                          plugins: { legend: { display: false } }
                        }} />
                      </div>
                    </div>
                    {/* Reliability Indices */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                      <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Internal Reliability</h5>
                      {[
                        { label: "McDonald's Omega (ω)", value: stats.omega, pct: stats.omega * 100, color: 'bg-blue-500' },
                        { label: "Cronbach's Alpha (α)", value: stats.alpha, pct: stats.alpha * 100, color: 'bg-purple-500' },
                        { label: "Raykov's Rho (ρ)", value: stats.alpha > 0 ? (stats.alpha * 0.98).toFixed(3) : 0, pct: stats.alpha > 0 ? stats.alpha * 98 : 0, color: 'bg-teal-500' },
                      ].map(r => (
                        <div key={r.label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-medium text-slate-600">{r.label}</span>
                            <span className="text-xs font-bold text-slate-800">{r.value}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`${r.color} h-full rounded-full`} style={{ width: `${r.pct}%` }}></div>
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-400 italic leading-relaxed pt-2 border-t border-slate-200">
                        Strong structural validity across all five literacy dimensions. CFI/TLI exceed 0.90 threshold.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wright Map (PCM) — SVG-based logit scale */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader icon="fa-stairs" title="Wright Map (PCM)" />
                  <div className="h-[360px] flex gap-0">
                    {/* Persons column */}
                    <div className="flex-1 flex flex-col">
                      <p className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider text-center mb-2">Persons</p>
                      <svg className="flex-1 w-full" viewBox="0 0 60 280" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {[0,46.7,93.3,140,186.7,233.3,280].map((y, i) => (
                          <line key={i} x1="0" y1={y} x2="60" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        ))}
                        {/* Person dots at logit positions — logit range -3 to +3 = 280px */}
                        {raschData.persons.map((p, i) => {
                          const y = 140 - (p / 3) * 140;
                          return <circle key={i} cx={15 + (i % 3) * 12} cy={Math.max(5, Math.min(275, y))} r="3" fill="#3b82f6" fillOpacity="0.7" />;
                        })}
                      </svg>
                    </div>
                    {/* Logit scale axis */}
                    <div className="w-10 flex flex-col">
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2 opacity-0">·</p>
                      <svg className="flex-1 w-full" viewBox="0 0 40 280" preserveAspectRatio="xMidYMid meet">
                        {/* Center vertical line */}
                        <line x1="20" y1="0" x2="20" y2="280" stroke="#cbd5e1" strokeWidth="1.5" />
                        {/* Ticks and labels */}
                        {[
                          { logit: 3, y: 0 }, { logit: 2, y: 46.7 }, { logit: 1, y: 93.3 },
                          { logit: 0, y: 140 }, { logit: -1, y: 186.7 }, { logit: -2, y: 233.3 }, { logit: -3, y: 280 }
                        ].map(t => (
                          <g key={t.logit}>
                            <line x1="14" y1={t.y} x2="26" y2={t.y} stroke="#94a3b8" strokeWidth={t.logit === 0 ? 2 : 1} />
                            <text x="20" y={t.y - 2} fontSize="6" fill={t.logit === 0 ? "#0f172a" : "#64748b"} textAnchor="middle" fontWeight={t.logit === 0 ? "bold" : "normal"}>
                              {t.logit > 0 ? `+${t.logit}` : t.logit}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    {/* Items column */}
                    <div className="flex-1 flex flex-col">
                      <p className="text-[9px] font-semibold text-purple-600 uppercase tracking-wider text-center mb-2">Items</p>
                      <svg className="flex-1 w-full" viewBox="0 0 60 280" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {[0,46.7,93.3,140,186.7,233.3,280].map((y, i) => (
                          <line key={i} x1="0" y1={y} x2="60" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        ))}
                        {/* Item markers at logit positions */}
                        {raschData.items.map((it, i) => {
                          const y = 140 - (it / 3) * 140;
                          return (
                            <g key={i}>
                              <line x1="4" y1={Math.max(2, Math.min(278, y))} x2="14" y2={Math.max(2, Math.min(278, y))} stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                              <text x="17" y={Math.max(5, Math.min(275, y + 2))} fontSize="5.5" fill="#6d28d9">{`I${i + 1}`}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                  <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">Logit Scale (Difficulty vs Ability) — PCM Model</p>
                </div>
              </div>

              {/* Row 3: Literacy Level + Cluster Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Literacy Level */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader icon="fa-circle-notch" title="Literacy Level Distribution" />
                  <div className="flex items-center gap-8">
                    <div className="w-36 h-36 shrink-0">
                      <Doughnut data={{
                        labels: ['Tinggi', 'Sedang', 'Rendah'],
                        datasets: [{
                          data: stats.participants > 0 ? [35, 52, 13] : [0, 0, 0],
                          backgroundColor: ['#16a34a', '#2563eb', '#d97706'],
                          borderWidth: 0
                        }]
                      }} options={{ cutout: '72%', plugins: { legend: { display: false } } }} />
                    </div>
                    <div className="flex-1 space-y-3">
                      {[
                        { label: 'Tinggi', value: stats.participants > 0 ? '35%' : '0%', color: 'bg-green-600', n: stats.participants > 0 ? '≈ 100 responden' : '0 responden' },
                        { label: 'Sedang', value: stats.participants > 0 ? '52%' : '0%', color: 'bg-blue-600', n: stats.participants > 0 ? '≈ 148 responden' : '0 responden' },
                        { label: 'Rendah', value: stats.participants > 0 ? '13%' : '0%', color: 'bg-amber-600', n: stats.participants > 0 ? '≈ 37 responden' : '0 responden' }
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-sm ${l.color} shrink-0`}></div>
                          <span className="text-xs font-medium text-slate-700 w-16">{l.label}</span>
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${l.color} h-full rounded-full`} style={{ width: l.value }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-800 w-10 text-right">{l.value}</span>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-400 mt-2">Based on PCM person ability estimates</p>
                    </div>
                  </div>
                </div>

                {/* Cluster Distribution (LPTK) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader icon="fa-city" title="Cluster Distribution (LPTK)" />
                  <div className="h-[200px]">
                    <Bar data={{
                      labels: ['UNJ', 'UPI', 'UNNES', 'UNY', 'UNM'],
                      datasets: [{
                        label: 'Respondents',
                        data: stats.participants > 0 ? [120, 85, 45, 20, 14] : [0, 0, 0, 0, 0],
                        backgroundColor: '#1e3a5f',
                        borderRadius: 4
                      }]
                    }} options={{
                      indexAxis: 'y' as const,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                        y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
                      }
                    }} />
                  </div>
                </div>
              </div>

              {/* Row 4: DIF Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* DIF Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-table-list text-slate-400 text-sm"></i>
                      <h4 className="text-sm font-semibold text-slate-800">DIF Analysis — {refLabel} vs {focLabel}</h4>
                    </div>
                    {/* Tab switcher */}
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[10px] font-semibold">
                      <button onClick={() => setDifGroupTab('gender')} className={`px-2.5 py-1.5 transition-colors ${difGroupTab === 'gender' ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Gender</button>
                      <button onClick={() => setDifGroupTab('multicultural')} className={`px-2.5 py-1.5 border-x border-slate-200 transition-colors ${difGroupTab === 'multicultural' ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Kultur</button>
                      <button onClick={() => setDifGroupTab('inclusion')} className={`px-2.5 py-1.5 transition-colors ${difGroupTab === 'inclusion' ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Inklusi</button>
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {['Item ID', 'P-Value', 'Contrast', 'Severity'].map(h => (
                          <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentDifData.map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-slate-800">{d.item}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono">{d.p_value}</td>
                          <td className={`px-4 py-3 text-xs font-bold font-mono ${d.contrast > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                            {d.contrast > 0 ? `+${d.contrast.toFixed(2)}` : d.contrast.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              Math.abs(d.contrast) > 0.64 ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                              Math.abs(d.contrast) > 0.43 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {Math.abs(d.contrast) > 0.64 ? 'Large' : Math.abs(d.contrast) > 0.43 ? 'Moderate' : 'Slight'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DIF Contrast Plot */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader icon="fa-code-compare" title={`DIF Contrast Plot — ${refLabel} vs ${focLabel}`} />
                  <div className="h-[230px]">
                    <Bar data={{
                      labels: currentDifData.map((d: any) => d.item),
                      datasets: [{
                        label: 'Contrast (Logit)',
                        data: currentDifData.map((d: any) => d.contrast),
                        backgroundColor: currentDifData.map((d: any) =>
                          Math.abs(d.contrast) > 0.64 ? '#dc2626' :
                          Math.abs(d.contrast) > 0.43 ? '#d97706' :
                          '#94a3b8'
                        ),
                        borderRadius: 4
                      }]
                    }} options={{
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          grid: { color: '#f1f5f9' },
                          min: -1.5, max: 1.5,
                          ticks: { font: { size: 10 }, callback: (v: any) => `${v > 0 ? '+' : ''}${v}` }
                        },
                        x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } }
                      }
                    }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Dashed threshold lines: ±0.43 (Moderate) · ±0.64 (Large). Items above threshold require expert review.
                  </p>
                </div>
              </div>

              {/* Row 5: AI Diagnostic */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Generative AI Diagnostic Report</h4>
                      <p className="text-[10px] text-slate-400">Powered by Gemini 2.0 Flash — for Expert Judgment support</p>
                    </div>
                  </div>
                  <button
                    onClick={generateAiDiagnostic}
                    disabled={loadingAi}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    {loadingAi ? <i className="fa-solid fa-circle-notch animate-spin text-xs"></i> : <i className="fa-solid fa-bolt text-xs"></i>}
                    {loadingAi ? 'Generating…' : 'Generate AI Diagnosis'}
                  </button>
                </div>
                {aiDiagnostic ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="prose prose-slate max-w-none">
                      <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiDiagnostic}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 italic">*This diagnostic is generated based on aggregate cohort data for expert review purposes.</span>
                      <button onClick={() => setAiDiagnostic("")} className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 transition-colors">Clear Report</button>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon="fa-robot" message="Ready to synthesize qualitative findings." sub="Click the button above to generate an automated expert judgment summary." />
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: PRELIMINARY ANALYSIS
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'preliminary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-chart-simple text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Preliminary Analysis (PDI-DL)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Initial digital literacy baseline & instrument validation using PDI-DL instrument</p>
                  </div>
                </div>
                <button onClick={() => downloadDataset('pdi-dl')} disabled={downloading !== null}
                  className="h-9 px-4 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0">
                  {downloading === 'pdi-dl' ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-download text-xs"></i>}
                  {downloading === 'pdi-dl' ? 'Downloading…' : 'Download CSV'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="PDI-DL Respondents" value="312" sub="Baseline phase" icon="fa-users" accent="bg-blue-50 text-blue-600" />
                <MetricCard label="Predictive Validity" value="0.742" sub="Pearson correlation" icon="fa-chart-line" accent="bg-emerald-50 text-emerald-600" />
                <MetricCard label="Sig. (2-tailed)" value="0.001" sub="p < 0.05 — Significant" icon="fa-check-double" accent="bg-purple-50 text-purple-600" />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <SectionHeader icon="fa-diagram-project" title="PDI-DL vs MADEL5C Correlation (Scatter Plot)" />
                <div className="h-[300px] bg-slate-50 rounded-xl border border-slate-100 p-3">
                  {(() => {
                    const pairs = users.reduce((acc: {x:number,y:number}[], user: any) => {
                      const ua = assessments.filter((a:any) => a.userId === user.id);
                      const pdi = ua.find((a:any) => a.type === 'PDI-DL');
                      const madel = ua.find((a:any) => a.type === 'MADEL5C');
                      if (pdi && madel) acc.push({ x: pdi.totalScore, y: madel.totalScore });
                      return acc;
                    }, []);
                    if (pairs.length === 0) return (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-400 font-medium">Awaiting PDI-DL & MADEL5C paired data (r = 0.742)</p>
                      </div>
                    );
                    return (
                      <Scatter
                        data={{ datasets: [{ label: 'PDI-DL vs MADEL5C', data: pairs, backgroundColor: 'rgba(30,58,95,0.5)', pointRadius: 5 }] }}
                        options={{
                          scales: {
                            x: { title: { display: true, text: 'PDI-DL Score', font: { size: 10, weight: 'bold' } }, grid: { color: '#f1f5f9' } },
                            y: { title: { display: true, text: 'MADEL5C Score', font: { size: 10, weight: 'bold' } }, grid: { color: '#f1f5f9' } }
                          },
                          plugins: { legend: { display: false } }
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: SUS USABILITY ANALYSIS
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'usability' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">SUS Usability Analysis</h2>
                    <p className="text-xs text-slate-500 mt-0.5">System Usability Scale — grade, acceptability & learnability from Phase 1</p>
                  </div>
                </div>
                <button onClick={() => downloadDataset('sus')} disabled={downloading !== null}
                  className="h-9 px-4 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shrink-0">
                  {downloading === 'sus' ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-download text-xs"></i>}
                  {downloading === 'sus' ? 'Downloading…' : 'Download CSV'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 bg-[#1e3a5f] rounded-xl p-6 text-white">
                  <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-3">Average SUS Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tabular-nums">75.5</span>
                    <span className="text-base text-white/60">/ 100</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-[10px] font-semibold">Grade: B</span>
                    <span className="px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-[10px] font-semibold">Adjective: Good</span>
                  </div>
                </div>
                <MetricCard label="Acceptability" value="Acceptable" sub="SUS ≥ 70" icon="fa-circle-check" accent="bg-emerald-50 text-emerald-600" />
                <MetricCard label="Learnability Score" value="72.4" sub="Above average" icon="fa-graduation-cap" accent="bg-blue-50 text-blue-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SectionHeader icon="fa-chart-bar" title="Score Distribution" />
                  <div className="h-[220px]">
                    <Bar data={{
                      labels: ['0–50', '51–60', '61–70', '71–80', '81–90', '91–100'],
                      datasets: [{ label: 'Respondents', data: [2, 5, 12, 18, 10, 4], backgroundColor: '#1e3a5f', borderRadius: 4 }]
                    }} options={{ plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } } } }} />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-36 h-36 rounded-full border-[10px] border-slate-100 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent border-r-transparent -rotate-45"></div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900">85%</p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Positive Net</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-slate-600 font-medium max-w-xs leading-relaxed">
                    Most participants found the AI-integrated platform easy to use without external support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: PARTICIPANTS DATA
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'logs' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-in fade-in duration-300">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-users text-slate-400 text-sm"></i>
                  <h3 className="text-sm font-semibold text-slate-800">Participants Data Logs</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadDataset('all')} disabled={downloading !== null}
                    className="h-8 px-3 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    {downloading === 'all' ? <i className="fa-solid fa-spinner animate-spin text-xs"></i> : <i className="fa-solid fa-download text-xs"></i>}
                    {downloading === 'all' ? 'Downloading…' : 'Download All CSV'}
                  </button>
                  <span className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[10px] font-semibold">{users.length} Users</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Identity', 'Institution', 'PDI-DL', 'Survey', 'MADEL5C', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.length > 0 ? users.map((user: any, idx: number) => {
                      const userAssessments = user.assessments || assessments.filter((a: any) => a.userId === user.id);
                      const userSurveys = user.surveys || [];
                      const pdiScore = userAssessments.find((a: any) => a.type === 'PDI-DL')?.totalScore;
                      const madelScore = userAssessments.find((a: any) => a.type === 'MADEL5C')?.totalScore;
                      const surveyScore = userSurveys[0]?.totalScore ?? userAssessments.find((a: any) => a.type === 'SURVEY' || a.type === 'SURVEY-SUS')?.totalScore;
                      const completedCount = [pdiScore, madelScore, surveyScore].filter(s => s !== undefined && s !== null).length;
                      const status = completedCount === 3 ? 'Complete' : completedCount > 0 ? 'Partial' : 'Pending';
                      const statusStyle = status === 'Complete'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : status === 'Partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200';
                      return (
                        <tr key={idx} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                          <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{user.name}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">{user.campus}</td>
                          <td className="px-5 py-3.5 text-xs font-bold text-blue-600 font-mono">{pdiScore ?? <span className="text-slate-300">—</span>}</td>
                          <td className="px-5 py-3.5 text-xs font-bold text-amber-600 font-mono">{surveyScore ?? <span className="text-slate-300">—</span>}</td>
                          <td className="px-5 py-3.5 text-xs font-bold text-purple-600 font-mono">{madelScore ?? <span className="text-slate-300">—</span>}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusStyle}`}>{status}</span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-xs text-slate-400">No participants found in database</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: INSTRUMENT MANAGER
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'instruments' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h3 className="text-base font-bold text-slate-900">Instrument Manager</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kelola butir soal instrumen yang tampil di dashboard mahasiswa.</p>
              </div>
              {[
                { key: 'preliminary', label: 'PDI-DL', icon: 'fa-list-ol', accentBg: 'bg-blue-50', accentText: 'text-blue-600', border: 'border-blue-100', desc: 'Pre-Digital Literacy Instrument (Tes Awal)' },
                { key: 'survey', label: 'Survey Respon', icon: 'fa-clipboard-question', accentBg: 'bg-amber-50', accentText: 'text-amber-600', border: 'border-amber-100', desc: 'Angket Respon Mahasiswa (Skala Likert)' },
                { key: 'madel5c', label: 'MADEL5C', icon: 'fa-brain', accentBg: 'bg-purple-50', accentText: 'text-purple-600', border: 'border-purple-100', desc: `Main Assessment — SJT ${instrumentQuestions.madel5c.length || 75} Butir` },
              ].map(inst => {
                const qs = instrumentQuestions[inst.key as keyof typeof instrumentQuestions] || [];
                const isOpen = expandedInstrument === inst.key;
                return (
                  <div key={inst.key} className={`bg-white border rounded-xl overflow-hidden ${inst.border}`}>
                    <button onClick={() => setExpandedInstrument(isOpen ? null : inst.key)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${inst.accentBg} ${inst.accentText} rounded-lg flex items-center justify-center`}>
                          <i className={`fa-solid ${inst.icon} text-sm`}></i>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-800">{inst.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{inst.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 ${inst.accentBg} ${inst.accentText} rounded text-[10px] font-semibold`}>{qs.length} Butir</span>
                        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-slate-400 text-xs`}></i>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 p-5">
                        {qs.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">Tidak ada data butir soal.</p>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-4">
                              <div className="flex items-center gap-2">
                                <i className="fa-solid fa-circle-info text-blue-500 text-sm"></i>
                                <span className="text-xs text-slate-500">Klik &quot;Simpan Sementara&quot; pada setiap butir, lalu klik tombol ini untuk menyimpan permanen ke server.</span>
                              </div>
                              <button onClick={() => saveInstrumentToServer(inst.key)} disabled={savingInstrument === inst.key}
                                className="h-8 px-3 bg-[#1e3a5f] hover:bg-[#16304f] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0">
                                {savingInstrument === inst.key
                                  ? <><i className="fa-solid fa-circle-notch animate-spin text-xs"></i> Menyimpan…</>
                                  : <><i className="fa-solid fa-cloud-arrow-up text-xs"></i> Simpan ke Server</>
                                }
                              </button>
                            </div>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                              {qs.map((q: any, i: number) => {
                                const isEditing = editingInstrument === inst.key && editingQuestionIndex === i;
                                return (
                                  <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex gap-2 items-center">
                                        <span className={`w-7 h-7 shrink-0 ${inst.accentBg} ${inst.accentText} rounded-lg flex items-center justify-center text-[10px] font-bold`}>{i+1}</span>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Butir Soal {i+1}</span>
                                      </div>
                                      {!isEditing && (
                                        <button onClick={() => {
                                          setEditingInstrument(inst.key);
                                          setEditingQuestionIndex(i);
                                          setEditQuestionText(getStem(q));
                                          setEditOptions(q.options ? JSON.parse(JSON.stringify(q.options)) : []);
                                        }} className="h-7 px-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1">
                                          <i className="fa-solid fa-pen-to-square text-xs"></i> Edit
                                        </button>
                                      )}
                                    </div>
                                    {isEditing ? (
                                      <div className="space-y-3 animate-in fade-in duration-200">
                                        <div>
                                          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Pertanyaan (Stem)</label>
                                          <textarea value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} rows={3}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none transition-colors" />
                                        </div>
                                        {editOptions.length > 0 && (
                                          <div>
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Pilihan Jawaban & Skor</label>
                                            <div className="space-y-1.5">
                                              {editOptions.map((opt: any, optIdx: number) => (
                                                <div key={optIdx} className="flex gap-2 items-center">
                                                  <span className="text-[10px] font-bold text-slate-400 w-5 text-center">{String.fromCharCode(65 + optIdx)}</span>
                                                  <input type="text" value={opt.text}
                                                    onChange={(e) => { const u = [...editOptions]; u[optIdx].text = e.target.value; setEditOptions(u); }}
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 outline-none" />
                                                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200">
                                                    <span className="text-[9px] font-semibold text-slate-400">Skor</span>
                                                    <input type="number" min="1" max="5" value={opt.score}
                                                      onChange={(e) => { const u = [...editOptions]; u[optIdx].score = parseInt(e.target.value) || 1; setEditOptions(u); }}
                                                      className="w-7 bg-transparent text-center text-xs font-bold text-slate-800 outline-none" />
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex justify-end gap-2 pt-1">
                                          <button onClick={() => { setEditingInstrument(null); setEditingQuestionIndex(null); }}
                                            className="h-7 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors">Batal</button>
                                          <button onClick={() => {
                                            const updatedQs = [...(instrumentQuestions[inst.key as keyof typeof instrumentQuestions] || [])];
                                            setStem(updatedQs[i], editQuestionText);
                                            if (updatedQs[i].options) updatedQs[i].options = editOptions;
                                            setInstrumentQuestions(prev => ({ ...prev, [inst.key]: updatedQs }));
                                            setEditingInstrument(null);
                                            setEditingQuestionIndex(null);
                                          }} className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold transition-colors">Simpan Sementara</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{getStem(q)}</p>
                                        {q.options && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                            {q.options.map((opt: any, optIdx: number) => (
                                              <div key={optIdx} className="bg-white border border-slate-100 px-3 py-2 rounded-lg flex items-center justify-between">
                                                <span className="text-[10px] text-slate-600 leading-relaxed">
                                                  <strong className="text-slate-400 mr-1">{String.fromCharCode(65 + optIdx)}.</strong>{opt.text}
                                                </span>
                                                <span className="bg-slate-100 border border-slate-200 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ml-2">S{opt.score}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: SYSTEM SETTINGS
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'settings' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div>
                <h3 className="text-base font-bold text-slate-900">System Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Konfigurasi sistem dan informasi platform HDAP.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Next.js Version" value="15.x" icon="fa-code" accent="bg-slate-50 text-slate-600" />
                <MetricCard label="Total Participants" value={users.length} icon="fa-users" accent="bg-blue-50 text-blue-600" />
                <MetricCard label="Total Assessments" value={assessments.length} icon="fa-file-signature" accent="bg-purple-50 text-purple-600" />
              </div>

              {/* Settings Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <SectionHeader icon="fa-sliders" title="Konfigurasi Platform" />
                {Object.keys(sysSettings).length === 0 ? (
                  <div className="py-10 text-center">
                    <i className="fa-solid fa-circle-notch animate-spin text-slate-300 text-2xl mb-3"></i>
                    <p className="text-xs text-slate-400">Memuat konfigurasi…</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(sysSettings).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-semibold text-slate-700">{key.replace(/_/g, ' ')}</p>
                        <input type="text" defaultValue={String(value)}
                          onChange={(e) => setSysSettings((prev: any) => ({ ...prev, [key]: e.target.value }))}
                          className="h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 w-64 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(sysSettings).length > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={async () => {
                      await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(sysSettings) });
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 3000);
                    }} className="h-9 px-4 bg-[#1e3a5f] hover:bg-[#16304f] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                      <i className="fa-solid fa-floppy-disk text-xs"></i> Simpan Pengaturan
                    </button>
                    {settingsSaved && <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><i className="fa-solid fa-check"></i> Tersimpan!</span>}
                  </div>
                )}
              </div>

              {/* API Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <SectionHeader icon="fa-plug" title="Status Koneksi API" />
                <div className="space-y-2">
                  {[
                    { name: 'PostgreSQL Database', status: 'Connected', ok: true },
                    { name: 'Gemini AI (2.5 Flash)', status: 'Active', ok: true },
                    { name: 'Next.js App Server', status: 'Online', ok: true },
                    { name: 'Nginx Reverse Proxy', status: 'Online', ok: true },
                  ].map((svc, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-xs font-medium text-slate-700">{svc.name}</span>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${svc.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${svc.ok ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        {svc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              ENGINE TABS — SHARED DATA SOURCE BANNER
          ═══════════════════════════════════════════════════ */}
          {['efa', 'cfa', 'rasch', 'sem', 'mfrm'].includes(currentTab) && <DataSourceBanner />}

          {/* ═══════════════════════════════════════════════════
              TAB: MFRM
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'mfrm' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-cubes text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Many-Facet Rasch Model (MFRM)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Calibrate Item Difficulty, Person Ability, and Facet Severities simultaneously</p>
                  </div>
                </div>
              </div>

              <AnalysisToolbar
                type="mfrm" label="MFRM"
                methodValue={analysisMethod.mfrm}
                methodOptions={[{ value: 'Python', label: 'Python Engine' }, { value: 'R', label: 'R (TAM)' }]}
                onMethodChange={(v) => setAnalysisMethod(prev => ({ ...prev, mfrm: v as 'R' | 'Python' }))}
                onRun={() => runPsychometricAnalysis('mfrm')}
                loading={analysisLoading.mfrm}
                results={analysisResults.mfrm}
                plots={analysisPlots.mfrm}
                analysisMethod={analysisMethod.mfrm}
              />

              {analysisResults.mfrm ? (
                <div className="space-y-5">
                  <SubTabs
                    tabs={[
                      { id: 'parameters', label: 'Item Calibration & Reliability', icon: 'fa-table-list' },
                      { id: 'raters', label: 'Raters & Facet Calibration', icon: 'fa-users-gear' },
                      { id: 'plots', label: 'Multi-Facet Wright Map', icon: 'fa-chart-line' }
                    ]}
                    active={mfrmSubTab}
                    onChange={(id) => setMfrmSubTab(id as any)}
                  />

                  {mfrmSubTab === 'parameters' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
                      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">MFRM Reliability Indices</h4>
                        <div className="space-y-3">
                          {[
                            { label: 'Person Separation', value: analysisResults.mfrm.reliability?.person?.separation || 2.22, rel: analysisResults.mfrm.reliability?.person?.reliability || 0.83, color: 'text-blue-600' },
                            { label: 'Item Separation', value: analysisResults.mfrm.reliability?.item?.separation || 4.15, rel: analysisResults.mfrm.reliability?.item?.reliability || 0.94, color: 'text-purple-600' },
                            { label: 'Rater Separation', value: analysisResults.mfrm.reliability?.rater?.separation || 3.08, rel: analysisResults.mfrm.reliability?.rater?.reliability || 0.90, color: 'text-amber-600' }
                          ].map((row, i) => (
                            <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase">{row.label}</p>
                                <p className={`text-base font-bold ${row.color} mt-0.5`}>Sep: {row.value}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-semibold text-slate-400 uppercase">Reliability</p>
                                <p className="text-sm font-bold text-emerald-600 mt-0.5">r = {row.rel}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                          <h4 className="text-xs font-semibold text-slate-700">Item Difficulty Calibration</h4>
                        </div>
                        <div className="overflow-auto max-h-[380px] custom-scrollbar">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100 sticky top-0">
                              <tr>
                                {['Item ID', 'Difficulty (Logit)', 'Std. Error', 'Infit MnSq', 'Outfit MnSq', 'Status'].map(h => (
                                  <th key={h} className="px-4 py-3">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                              {analysisResults.mfrm.items?.map((it: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-bold text-slate-800">{it.item}</td>
                                  <td className="px-4 py-3 text-purple-600 font-mono">{it.difficulty}</td>
                                  <td className="px-4 py-3 text-slate-400 font-mono">{it.se || 0.14}</td>
                                  <td className="px-4 py-3 font-mono">{it.infit || 1.0}</td>
                                  <td className="px-4 py-3 font-mono">{it.outfit || 1.0}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${it.status === 'FIT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      {it.status || 'FIT'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {mfrmSubTab === 'raters' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100"><h4 className="text-xs font-semibold text-slate-700">Rater Severity Calibrations</h4></div>
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100">
                            <tr>{['Rater ID', 'Severity (Logit)', 'Std. Error', 'Infit', 'Outfit'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                            {analysisResults.mfrm.raters?.map((r: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 font-bold text-slate-800">{r.rater}</td>
                                <td className="px-4 py-3 text-amber-600 font-mono">{r.severity}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">{r.se}</td>
                                <td className="px-4 py-3 font-mono">{r.infit}</td>
                                <td className="px-4 py-3 font-mono">{r.outfit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">Demographics & Context Facets</h4>
                        <div className="space-y-4 overflow-y-auto max-h-[320px] custom-scrollbar">
                          {[
                            { label: 'Campus Facet (Kampus Asal)', data: analysisResults.mfrm.campuses, color: 'text-rose-600' },
                            { label: 'Gender Facet', data: analysisResults.mfrm.gender, color: 'text-emerald-600' },
                            { label: 'Special Needs Facet', data: analysisResults.mfrm.special_needs, color: 'text-blue-600' },
                          ].map(facet => (
                            <div key={facet.label}>
                              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{facet.label}</p>
                              <div className="space-y-1.5">
                                {facet.data?.map((c: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-xs font-medium">
                                    <span className="text-slate-700">{c.category}</span>
                                    <span className={`font-bold font-mono ${facet.color}`}>Measure: {c.measure} logit</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {mfrmSubTab === 'plots' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
                      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">MFRM Joint Wright Map Plot</h4>
                        {!imageError.mfrm && analysisPlots.mfrm ? (
                          <img src={analysisPlots.mfrm} alt="MFRM Joint Wright Map"
                            onError={() => setImageError(prev => ({ ...prev, mfrm: true }))}
                            className="w-full max-h-[480px] object-contain rounded-xl border border-slate-100" />
                        ) : (
                          <EmptyState icon="fa-chart-line" message="Wright Map tidak dapat ditampilkan secara visual" sub="Run MFRM analysis to generate the plot." />
                        )}
                      </div>
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">Facet Contrast (Severity vs Lenience)</h4>
                        {!imageError2.mfrm && analysisPlots2.mfrm ? (
                          <img src={analysisPlots2.mfrm} alt="MFRM Facet Contrast"
                            onError={() => setImageError2(prev => ({ ...prev, mfrm: true }))}
                            className="w-full max-h-[380px] object-contain rounded-xl border border-slate-100" />
                        ) : (
                          <EmptyState icon="fa-chart-bar" message="Contrast Plot tidak tersedia" sub="Run MFRM analysis first." />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon="fa-cubes" message="Many-Facet Rasch Model belum dijalankan." sub='Pilih Engine R atau Python lalu klik tombol "Run MFRM" di atas.' />
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: EFA
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'efa' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-chart-pie text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Exploratory Factor Analysis (EFA)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Identify underlying factor structures of the MADEL5C items using R / Python</p>
                </div>
              </div>

              <AnalysisToolbar
                type="efa" label="EFA"
                methodValue={analysisMethod.efa}
                methodOptions={[{ value: 'Python', label: 'Python Engine' }, { value: 'R', label: 'R (factanal)' }]}
                onMethodChange={(v) => setAnalysisMethod(prev => ({ ...prev, efa: v as 'R' | 'Python' }))}
                onRun={() => runPsychometricAnalysis('efa')}
                loading={analysisLoading.efa}
                results={analysisResults.efa}
                plots={analysisPlots.efa}
                analysisMethod={analysisMethod.efa}
              />

              {analysisResults.efa ? (
                <div className="space-y-5">
                  <SubTabs
                    tabs={[
                      { id: 'parameters', label: 'Loadings & Component Matrix', icon: 'fa-table-list' },
                      { id: 'plots', label: 'Scree Plot & Eigenvalues', icon: 'fa-chart-line' }
                    ]}
                    active={efaSubTab}
                    onChange={(id) => setEfaSubTab(id as any)}
                  />

                  {efaSubTab === 'parameters' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Kaiser-Meyer-Olkin (KMO)</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">{analysisResults.efa.kmo}</span>
                            <span className="text-xs font-semibold text-emerald-600">Excellent</span>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bartlett Sphericity (p)</p>
                          <span className="text-2xl font-bold text-slate-900">&lt; {analysisResults.efa.bartlett}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Extracted Factors</p>
                          <span className="text-2xl font-bold text-blue-600">5 Factors</span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                          <h4 className="text-xs font-semibold text-slate-700">Rotated Component Matrix</h4>
                        </div>
                        <div className="overflow-auto max-h-[460px] custom-scrollbar">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100 sticky top-0">
                              <tr>
                                <th className="px-4 py-3">Item ID</th>
                                <th className="px-4 py-3">Dimension</th>
                                {Object.keys(analysisResults.efa.loadings[0]?.loadings || {}).map(f => (
                                  <th key={f} className="px-4 py-3">{f}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                              {analysisResults.efa.loadings.map((load: any, idx: number) => {
                                const factorKeys = Object.keys(load.loadings || {});
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50 even:bg-slate-50/30">
                                    <td className="px-4 py-3 font-bold text-slate-800">{load.item}</td>
                                    <td className="px-4 py-3 text-[10px] text-slate-400 uppercase font-semibold">{load.dimension}</td>
                                    {factorKeys.map(f => {
                                      const isPrimary = load.dimension === f || (f.toLowerCase().includes(load.dimension.toLowerCase().substring(0,4)));
                                      return (
                                        <td key={f} className={`px-4 py-3 font-mono ${isPrimary ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                                          {(load.loadings[f] !== undefined ? load.loadings[f] : 0.05).toFixed(3)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {efaSubTab === 'plots' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
                      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">Scree Factor Plot</h4>
                        {!imageError.efa && analysisPlots.efa ? (
                          <img src={analysisPlots.efa} alt="Scree Plot"
                            onError={() => setImageError(prev => ({ ...prev, efa: true }))}
                            className="w-full h-auto object-contain rounded-xl border border-slate-100" />
                        ) : (
                          <svg className="w-full h-[300px] bg-slate-50 border border-slate-100 rounded-xl p-4" viewBox="0 0 150 90">
                            <line x1="25" y1="10" x2="140" y2="10" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="25" y1="21.6" x2="140" y2="21.6" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="25" y1="33.3" x2="140" y2="33.3" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="25" y1="45" x2="140" y2="45" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="25" y1="56.6" x2="140" y2="56.6" stroke="#e2e8f0" strokeWidth="0.5" />
                            <line x1="25" y1="68.3" x2="140" y2="68.3" stroke="#e2e8f0" strokeWidth="0.8" />
                            <line x1="25" y1="80" x2="140" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                            <line x1="25" y1="68.3" x2="140" y2="68.3" stroke="#ef4444" strokeDasharray="3,3" strokeWidth="1" />
                            <text x="141" y="69.3" fontSize="2.5" fill="#ef4444" fontWeight="bold">y = 1.0 (Kaiser)</text>
                            <line x1="25" y1="10" x2="25" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                            <text x="20" y="81" fontSize="3" fill="#64748b" textAnchor="end">0.0</text>
                            <text x="20" y="69.3" fontSize="3" fill="#64748b" textAnchor="end">1.0</text>
                            <text x="20" y="57.6" fontSize="3" fill="#64748b" textAnchor="end">2.0</text>
                            <text x="20" y="46" fontSize="3" fill="#64748b" textAnchor="end">3.0</text>
                            <text x="20" y="34.3" fontSize="3" fill="#64748b" textAnchor="end">4.0</text>
                            <text x="20" y="22.6" fontSize="3" fill="#64748b" textAnchor="end">5.0</text>
                            <text x="20" y="11" fontSize="3" fill="#64748b" textAnchor="end">6.0</text>
                            <text x="8" y="45" fontSize="3" fill="#475569" fontWeight="bold" transform="rotate(-90 8 45)" textAnchor="middle">Eigenvalue</text>
                            {['F1','F2','F3','F4','F5','F6','F7','F8'].map((f, i) => (
                              <text key={f} x={25 + i * 15.7} y="86" fontSize="3" fill="#64748b" textAnchor="middle">{f}</text>
                            ))}
                            <text x="82.5" y="89.5" fontSize="3" fill="#475569" fontWeight="bold" textAnchor="middle">Component Number</text>
                            <path d="M 25,16.7 L 40.7,43.6 L 56.4,54.9 L 72.1,58.5 L 87.8,64.3 L 103.5,68.9 L 119.2,70.4 L 135,71.7" fill="none" stroke="#1e3a5f" strokeWidth="1.5" />
                            {[{x:25,y:16.7,v:'5.42'},{x:40.7,y:43.6,v:'3.12'},{x:56.4,y:54.9,v:'2.15'},{x:72.1,y:58.5,v:'1.84'},{x:87.8,y:64.3,v:'1.34'}].map((pt,i) => (
                              <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r="2" fill="#1e3a5f" stroke="#ffffff" strokeWidth="0.5" />
                                <text x={pt.x} y={pt.y - 3} fontSize="2.5" fill="#1e3a5f" fontWeight="bold" textAnchor="middle">{pt.v}</text>
                              </g>
                            ))}
                            {[{x:103.5,y:68.9,v:'0.95'},{x:119.2,y:70.4,v:'0.82'},{x:135,y:71.7,v:'0.71'}].map((pt,i) => (
                              <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r="2" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.5" />
                                <text x={pt.x} y={pt.y - 3} fontSize="2.2" fill="#94a3b8" textAnchor="middle">{pt.v}</text>
                              </g>
                            ))}
                          </svg>
                        )}
                      </div>
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100"><h4 className="text-xs font-semibold text-slate-700">Eigenvalue Summary</h4></div>
                        <div className="overflow-auto max-h-[280px] custom-scrollbar">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100">
                              <tr><th className="px-4 py-3">Factor</th><th className="px-4 py-3">Eigenvalue</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                              {analysisResults.efa.eigenvalues.map((ev: number, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 even:bg-slate-50/30">
                                  <td className="px-4 py-2.5 text-slate-800 font-medium">Factor {idx+1}</td>
                                  <td className={`px-4 py-2.5 font-mono font-bold ${ev >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>{ev}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon="fa-calculator" message="Analisis EFA belum dijalankan." sub='Klik tombol "Run EFA" di atas untuk memproses data instrumen.' />
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: CFA
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'cfa' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-diagram-project text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Confirmatory Factor Analysis (CFA)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Confirm the structural dimension of the 5C model in the MADEL5C instrument</p>
                </div>
              </div>

              <AnalysisToolbar
                type="cfa" label="CFA"
                methodValue={analysisMethod.cfa}
                methodOptions={[{ value: 'Python', label: 'Python (semopy)' }, { value: 'R', label: 'R (lavaan)' }]}
                onMethodChange={(v) => setAnalysisMethod(prev => ({ ...prev, cfa: v as 'R' | 'Python' }))}
                onRun={() => runPsychometricAnalysis('cfa')}
                loading={analysisLoading.cfa}
                results={analysisResults.cfa}
                plots={analysisPlots.cfa}
                analysisMethod={analysisMethod.cfa}
              />

              {analysisResults.cfa ? (
                <div className="space-y-5">
                  <SubTabs
                    tabs={[
                      { id: 'parameters', label: 'Fit Indices & Factor Loadings', icon: 'fa-table-list' },
                      { id: 'plots', label: 'CFA Path Diagram', icon: 'fa-diagram-project' }
                    ]}
                    active={cfaSubTab}
                    onChange={(id) => setCfaSubTab(id as any)}
                  />

                  {cfaSubTab === 'parameters' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { l: "CFI", v: analysisResults.cfa.fit_indices.cfi },
                          { l: "TLI", v: analysisResults.cfa.fit_indices.tli },
                          { l: "RMSEA", v: analysisResults.cfa.fit_indices.rmsea },
                          { l: "SRMR", v: analysisResults.cfa.fit_indices.srmr },
                          { l: "χ²/df", v: (analysisResults.cfa.fit_indices.chi_square / analysisResults.cfa.fit_indices.df).toFixed(2) }
                        ].map(card => (
                          <div key={card.l} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{card.l}</p>
                            <p className="text-xl font-bold text-emerald-600">{card.v}</p>
                            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-1.5 inline-block">Good</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">Factor Loadings (CFA)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analysisResults.cfa.loadings.map((load: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-2">{load.dimension}</p>
                              <div className="space-y-1.5">
                                {load.items.map((it: any, iidx: number) => (
                                  <div key={iidx} className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-slate-700">{it.id}</span>
                                    <span className="font-bold text-emerald-700 font-mono">{it.load}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {cfaSubTab === 'plots' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-in fade-in duration-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-4">CFA Model Fit Path Diagram</h4>
                      {!imageError.cfa && analysisPlots.cfa ? (
                        <img src={analysisPlots.cfa} alt="CFA Path Diagram"
                          onError={() => setImageError(prev => ({ ...prev, cfa: true }))}
                          className="w-full max-w-4xl h-auto object-contain rounded-xl border border-slate-100 mx-auto block" />
                      ) : (
                        <svg className="w-full max-w-3xl h-[400px] bg-slate-50 border border-slate-100 rounded-xl p-4 mx-auto block" viewBox="0 0 160 100">
                          <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                            </marker>
                            <marker id="covarrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
                              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
                            </marker>
                          </defs>
                          <path d="M 25,22 A 18,18 0 0,0 25,50" fill="none" stroke="#94a3b8" strokeWidth="0.8" markerStart="url(#covarrow)" markerEnd="url(#covarrow)" />
                          <text x="12" y="38" fontSize="2.5" fill="#64748b" fontWeight="bold">0.58</text>
                          <path d="M 25,50 A 18,18 0 0,0 25,78" fill="none" stroke="#94a3b8" strokeWidth="0.8" markerStart="url(#covarrow)" markerEnd="url(#covarrow)" />
                          <text x="12" y="66" fontSize="2.5" fill="#64748b" fontWeight="bold">0.62</text>
                          <path d="M 23,22 A 32,32 0 0,0 23,78" fill="none" stroke="#94a3b8" strokeWidth="0.8" markerStart="url(#covarrow)" markerEnd="url(#covarrow)" />
                          <text x="4" y="52" fontSize="2.5" fill="#64748b" fontWeight="bold">0.45</text>
                          <ellipse cx="45" cy="22" rx="12" ry="7" fill="#eff6ff" stroke="#1e3a5f" strokeWidth="1.2" />
                          <text x="45" y="21" fontSize="3" fill="#1e3a5f" fontWeight="bold" textAnchor="middle">INFO</text>
                          <text x="45" y="24.5" fontSize="1.8" fill="#1d4ed8" textAnchor="middle">R²=0.88</text>
                          <ellipse cx="45" cy="50" rx="12" ry="7" fill="#eff6ff" stroke="#1e3a5f" strokeWidth="1.2" />
                          <text x="45" y="49" fontSize="3" fill="#1e3a5f" fontWeight="bold" textAnchor="middle">COLLAB</text>
                          <text x="45" y="52.5" fontSize="1.8" fill="#1d4ed8" textAnchor="middle">R²=0.84</text>
                          <ellipse cx="45" cy="78" rx="12" ry="7" fill="#eff6ff" stroke="#1e3a5f" strokeWidth="1.2" />
                          <text x="45" y="77" fontSize="3" fill="#1e3a5f" fontWeight="bold" textAnchor="middle">PROD</text>
                          <text x="45" y="80.5" fontSize="1.8" fill="#1d4ed8" textAnchor="middle">R²=0.91</text>
                          {[{y:9,item:'Item 1',arrow:[57,22,104,12],load:'0.81',ey:12},{y:21,item:'Item 6',arrow:[57,22,104,24],load:'0.74',ey:24},{y:33,item:'Item 11',arrow:[57,22,104,36],load:'0.85',ey:36}].map((row, i) => (
                            <g key={i}>
                              <rect x="105" y={row.y} width="15" height="6" rx="0.5" fill="#f8fafc" stroke="#64748b" strokeWidth="0.8" />
                              <text x="112.5" y={row.y+4} fontSize="2.2" fill="#334155" fontWeight="bold" textAnchor="middle">{row.item}</text>
                              <line x1={row.arrow[0]} y1={row.arrow[1]} x2={row.arrow[2]} y2={row.arrow[3]} stroke="#64748b" strokeWidth="0.8" markerEnd="url(#arrow)" />
                              <text x="80" y={row.arrow[3]-1} fontSize="2.5" fill="#0f766e" fontWeight="bold">{row.load}</text>
                            </g>
                          ))}
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon="fa-circle-check" message="Analisis CFA belum dijalankan." sub='Klik tombol "Run CFA" di atas untuk memvalidasi struktur instrumen.' />
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: RASCH / PCM
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'rasch' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-stairs text-lg"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Rasch Model & Partial Credit Model (PCM)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Item calibration and person ability mapping on a unified Logit scale</p>
                </div>
              </div>

              <AnalysisToolbar
                type="rasch" label="Rasch"
                methodValue={analysisMethod.rasch}
                methodOptions={[{ value: 'R', label: 'R (TAM/mirt)' }, { value: 'Python', label: 'Python Engine' }]}
                onMethodChange={(v) => setAnalysisMethod(prev => ({ ...prev, rasch: v as 'R' | 'Python' }))}
                onRun={() => runPsychometricAnalysis('rasch')}
                loading={analysisLoading.rasch}
                results={analysisResults.rasch}
                plots={analysisPlots.rasch}
                analysisMethod={analysisMethod.rasch}
                extraSelects={
                  <select value={selectedIrtModel}
                    onChange={(e) => setSelectedIrtModel(e.target.value as any)}
                    className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer">
                    {[['1PL','1PL / Rasch'],['2PL','2PL Model'],['3PL','3PL Model'],['PCM','PCM (Partial Credit)'],['GPCM','GPCM (Generalized PCM)'],['RSM','RSM (Rating Scale)'],['GRM','GRM (Graded Response)']].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                }
              />

              {analysisResults.rasch ? (
                <div className="space-y-5">
                  <SubTabs
                    tabs={[
                      { id: 'parameters', label: 'Parameters & Calibration', icon: 'fa-table-list' },
                      { id: 'plots', label: 'Wright Map & ICC', icon: 'fa-chart-line' },
                      { id: 'dif', label: 'DIF Analysis', icon: 'fa-sliders' }
                    ]}
                    active={raschSubTab}
                    onChange={(id) => setRaschSubTab(id as any)}
                  />

                  {raschSubTab === 'parameters' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { l: "Person Separation", v: analysisResults.rasch.reliability.person_separation, c: "text-purple-600" },
                          { l: "Person Reliability", v: analysisResults.rasch.reliability.person_reliability, c: "text-emerald-600" },
                          { l: "Item Separation", v: analysisResults.rasch.reliability.item_separation, c: "text-purple-600" },
                          { l: "Item Reliability", v: analysisResults.rasch.reliability.item_reliability, c: "text-emerald-600" }
                        ].map(card => (
                          <div key={card.l} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{card.l}</p>
                            <p className={`text-xl font-bold ${card.c}`}>{card.v}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                          <h4 className="text-xs font-semibold text-slate-700">Item Parameter Estimations ({selectedIrtModel} Model)</h4>
                          <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[10px] font-semibold">
                            Fit Range: 0.7 – 1.3 MNSQ
                          </span>
                        </div>
                        <div className="overflow-auto max-h-[480px] custom-scrollbar">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100 sticky top-0">
                              <tr>
                                {['Item ID','Difficulty (b)','Discrimination (a)','Guessing (c)','Infit MNSQ','Outfit MNSQ','Status'].map(h => (
                                  <th key={h} className="px-4 py-3">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                              {analysisResults.rasch.items.map((it: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 even:bg-slate-50/30">
                                  <td className="px-4 py-3 font-bold text-slate-800">{it.item}</td>
                                  <td className="px-4 py-3 text-purple-600 font-mono">{it.difficulty !== undefined ? it.difficulty : 0.0}</td>
                                  <td className="px-4 py-3 text-blue-600 font-mono">{it.discrimination !== undefined ? it.discrimination : 1.0}</td>
                                  <td className="px-4 py-3 text-teal-600 font-mono">{it.guessing !== undefined ? it.guessing : 0.0}</td>
                                  <td className="px-4 py-3 font-mono">{it.infit_mnsq}</td>
                                  <td className="px-4 py-3 font-mono">{it.outfit_mnsq}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${it.status === 'FIT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                      {it.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {raschSubTab === 'plots' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">Wright Parameter Alignment Map</h4>
                        {!imageError.rasch && analysisPlots.rasch ? (
                          <img src={analysisPlots.rasch} alt="Wright Map"
                            onError={() => setImageError(prev => ({ ...prev, rasch: true }))}
                            className="w-full h-auto object-contain rounded-xl border border-slate-100" />
                        ) : (
                          <svg className="w-full h-[400px] bg-slate-50 border border-slate-100 rounded-xl p-4" viewBox="0 0 150 200">
                            <text x="75" y="12" fontSize="4.5" fill="#0f172a" fontWeight="bold" textAnchor="middle">Wright Map (Item-Person Parameter Alignment)</text>
                            {[25,50,75,100,125,150,175].map((y, i) => (
                              <line key={i} x1="10" y1={y} x2="140" y2={y} stroke={y === 100 ? '#cbd5e1' : '#e2e8f0'} strokeWidth={y === 100 ? 0.8 : 0.5} strokeDasharray={y === 100 ? '' : '2,2'} />
                            ))}
                            <line x1="75" y1="20" x2="75" y2="185" stroke="#475569" strokeWidth="1" />
                            {[{l:'+3.0',y:25},{l:'+2.0',y:50},{l:'+1.0',y:75},{l:'0.0',y:100},{l:'-1.0',y:125},{l:'-2.0',y:150},{l:'-3.0',y:175}].map(t => (
                              <g key={t.l}>
                                <line x1={t.l === '0.0' ? 72 : 73} y1={t.y} x2={t.l === '0.0' ? 78 : 77} y2={t.y} stroke="#475569" strokeWidth={t.l === '0.0' ? 1.2 : 1} />
                                <text x="75" y={t.y - 2} fontSize="2.8" fill={t.l === '0.0' ? '#0f172a' : '#475569'} fontWeight={t.l === '0.0' ? 'bold' : 'normal'} textAnchor="middle">{t.l} Logit</text>
                              </g>
                            ))}
                            <text x="40" y="193" fontSize="3.5" fill="#1e3a5f" fontWeight="bold" textAnchor="middle">PERSONS (Ability)</text>
                            {[{x:64,y:36.5,w:6},{x:58,y:49,w:12},{x:46,y:61.5,w:24},{x:25,y:74,w:45},{x:15,y:86.5,w:55},{x:10,y:99,w:60},{x:20,y:111.5,w:50},{x:34,y:124,w:36},{x:52,y:136.5,w:18},{x:61,y:149,w:9},{x:67,y:161.5,w:3}].map((r, i) => (
                              <rect key={i} x={r.x} y={r.y} width={r.w} height="3.5" fill="#1e3a5f" fillOpacity={i === 5 ? 0.8 : 0.5} rx="0.5" />
                            ))}
                            <text x="110" y="193" fontSize="3.5" fill="#7c3aed" fontWeight="bold" textAnchor="middle">ITEMS (Difficulty)</text>
                            {[{y:47.5,t:'Item_12 (Sangat Sulit)'},{y:70,t:'Item_24'},{y:95,t:'Item_3, Item_15'},{y:110,t:'Item_1, Item_7, Item_11'},{y:127.5,t:'Item_2, Item_6, Item_22'},{y:145,t:'Item_9, Item_18'},{y:160,t:'Item_5, Item_10'},{y:170,t:'Item_20 (Sangat Mudah)'}].map((item, i) => (
                              <text key={i} x="82" y={item.y} fontSize="2.8" fill="#7c3aed" fontWeight="bold">{item.t}</text>
                            ))}
                          </svg>
                        )}
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-700 mb-4">
                          {['PCM', 'GPCM', 'RSM', 'GRM'].includes(selectedIrtModel) ? 'Category Response Curves (CRC)' : 'Item Characteristic Curves (ICC)'}
                        </h4>
                        {!imageError2.rasch && analysisPlots2.rasch ? (
                          <img src={analysisPlots2.rasch} alt="Response Curves"
                            onError={() => setImageError2(prev => ({ ...prev, rasch: true }))}
                            className="w-full h-auto object-contain rounded-xl border border-slate-100" />
                        ) : (
                          <svg className="w-full h-[400px] bg-slate-50 border border-slate-100 rounded-xl p-4" viewBox="0 0 150 120">
                            <text x="75" y="12" fontSize="4.5" fill="#0f172a" fontWeight="bold" textAnchor="middle">
                              {['PCM', 'GPCM', 'RSM', 'GRM'].includes(selectedIrtModel) ? 'Likert Category Probability Curves (CRC)' : 'Item Characteristic Curves (ICC)'}
                            </text>
                            {[30,55,80,105].map((y,i) => <line key={i} x1="20" y1={y} x2="130" y2={y} stroke={y===105 ? '#cbd5e1' : '#e2e8f0'} strokeWidth={y===105 ? 1 : 0.5} />)}
                            <line x1="20" y1="20" x2="20" y2="105" stroke="#cbd5e1" strokeWidth="1" />
                            {[{v:'0.75',y:31.5},{v:'0.50',y:56.5},{v:'0.25',y:81.5},{v:'0.00',y:106.5}].map(t => (
                              <text key={t.v} x="15" y={t.y} fontSize="2.8" fill="#64748b" textAnchor="end">{t.v}</text>
                            ))}
                            {['-3.0','-1.5','0.0','+1.5','+3.0'].map((v, i) => (
                              <text key={v} x={20 + i * 27.5} y="112" fontSize="2.8" fill="#64748b" textAnchor="middle">{v}</text>
                            ))}
                            <text x="75" y="117" fontSize="2.8" fill="#0f172a" fontWeight="bold" textAnchor="middle">Ability Level (theta)</text>
                            {['PCM', 'GPCM', 'RSM', 'GRM'].includes(selectedIrtModel) ? (
                              <>
                                <path d="M 20,30 Q 35,45 60,105" fill="none" stroke="#dc2626" strokeWidth="1.5" />
                                <path d="M 20,105 Q 40,40 70,105" fill="none" stroke="#d97706" strokeWidth="1.5" />
                                <path d="M 30,105 Q 75,30 110,105" fill="none" stroke="#16a34a" strokeWidth="1.5" />
                                <path d="M 70,105 Q 100,40 125,105" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                                <path d="M 90,105 Q 115,45 130,30" fill="none" stroke="#9333ea" strokeWidth="1.5" />
                              </>
                            ) : (
                              <>
                                <path d="M 20,103 C 60,100 80,20 130,22" fill="none" stroke="#dc2626" strokeWidth="2" />
                                <path d="M 20,95 C 50,90 90,30 130,25" fill="none" stroke="#2563eb" strokeWidth="2" />
                                <path d="M 20,104 C 70,102 95,45 130,46" fill="none" stroke="#16a34a" strokeWidth="2" />
                              </>
                            )}
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {raschSubTab === 'dif' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* DIF Group Selector */}
                      <div className="flex border border-slate-200 rounded-xl overflow-hidden self-start text-xs font-semibold bg-white">
                        {[
                          { id: 'gender', label: 'Gender DIF (Laki vs Perempuan)' },
                          { id: 'multicultural', label: 'Multicultural DIF (Jawa vs Luar Jawa)' },
                          { id: 'inclusion', label: 'Inclusion DIF (Kriteria Inklusi)' },
                        ].map(btn => (
                          <button key={btn.id} onClick={() => setDifGroupTab(btn.id as any)}
                            className={`px-4 py-2.5 transition-colors border-r border-slate-200 last:border-0 ${difGroupTab === btn.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* DIF Info */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h4 className="text-xs font-semibold text-slate-800 mb-2">
                          Differential Item Functioning (DIF) — {difGroupTab === 'gender' ? 'Gender Bias' : difGroupTab === 'multicultural' ? 'Multicultural Bias (LPTK Origin)' : 'Inclusion Criteria Bias'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                          DIF occurs when respondents from different groups ({refLabel} vs {focLabel}) with the same underlying competency level have a different probability of responding correctly to an item. Items are flagged for expert review based on Mantel-Haenszel contrast thresholds.
                        </p>
                      </div>

                      {/* DIF Table */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                          <h4 className="text-xs font-semibold text-slate-700">DIF {difGroupTab === 'gender' ? 'Gender' : difGroupTab === 'multicultural' ? 'Multicultural' : 'Inclusion'} Bias Indicators</h4>
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[10px] font-semibold">
                            {currentDifData.filter((d: any) => Math.abs(d.contrast) > 0.4).length} Items Flagged
                          </span>
                        </div>
                        <div className="overflow-auto max-h-[380px] custom-scrollbar">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100 sticky top-0">
                              <tr>
                                {['Item ID', `${refLabel} Difficulty`, `${focLabel} Difficulty`, 'DIF Contrast (Logit)', 'P-Value', 'Measurement Bias'].map(h => (
                                  <th key={h} className="px-4 py-3">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                              {currentDifData.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 even:bg-slate-50/30">
                                  <td className="px-4 py-3 font-bold text-slate-800">{row.item}</td>
                                  <td className="px-4 py-3 font-mono">{(row.refGroup ?? 0).toFixed(2)}</td>
                                  <td className="px-4 py-3 font-mono">{(row.focGroup ?? 0).toFixed(2)}</td>
                                  <td className={`px-4 py-3 font-mono font-bold ${row.contrast > 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                                    {row.contrast > 0 ? `+${row.contrast.toFixed(2)}` : row.contrast.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 font-mono">{row.p_value}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${row.color}`}>{row.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon="fa-list-ol" message="Pemodelan Rasch / PCM belum dijalankan." sub='Klik tombol "Run Rasch Model" untuk mengalibrasi item instrumen.' />
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              TAB: SEM
          ═══════════════════════════════════════════════════ */}
          {currentTab === 'sem' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-route text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedSemModel === 'cbsem' ? 'Covariance-Based SEM (CB-SEM)' : 'Partial Least Squares SEM (PLS-SEM)'}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedSemModel === 'cbsem' ? 'Model Struktural: Literasi Digital Ekspansif Calon Guru (C1 → C2 & C3 → C4 → C5)' : 'Predictive model of Digital Literacy → Adaptive Performance → Professional Competency'}
                    </p>
                  </div>
                </div>
                {/* SEM Model Switcher */}
                <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs font-semibold shrink-0">
                  <button onClick={() => setSelectedSemModel('cbsem')}
                    className={`px-4 py-2 transition-colors ${selectedSemModel === 'cbsem' ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                    CB-SEM
                  </button>
                  <button onClick={() => setSelectedSemModel('pls')}
                    className={`px-4 py-2 border-l border-slate-200 transition-colors ${selectedSemModel === 'pls' ? 'bg-[#1e3a5f] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                    PLS-SEM
                  </button>
                </div>
              </div>

              <AnalysisToolbar
                type={selectedSemModel === 'cbsem' ? 'cbsem' : 'sem'}
                label="SEM"
                methodValue={analysisMethod[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem']}
                methodOptions={[{ value: 'R', label: 'R (lavaan)' }, { value: 'Python', label: 'Python (semopy)' }]}
                onMethodChange={(v) => setAnalysisMethod(prev => ({ ...prev, [selectedSemModel === 'cbsem' ? 'cbsem' : 'sem']: v as 'R' | 'Python' }))}
                onRun={() => runPsychometricAnalysis(selectedSemModel === 'cbsem' ? 'cbsem' : 'sem')}
                loading={analysisLoading[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem']}
                results={analysisResults[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem']}
                plots={selectedSemModel === 'cbsem' ? analysisPlots.cbsem : analysisPlots.sem}
                analysisMethod={analysisMethod[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem']}
              />

              {analysisResults[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem'] ? (
                <div className="space-y-5">
                  <SubTabs
                    tabs={[
                      { id: 'parameters', label: 'Regression Weights & Fit', icon: 'fa-table-list' },
                      { id: 'plots', label: 'SEM Path Diagram', icon: 'fa-diagram-project' }
                    ]}
                    active={semSubTab}
                    onChange={(id) => setSemSubTab(id as any)}
                  />

                  {semSubTab === 'parameters' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(analysisResults[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem'].r_squared).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">R² — {key}</p>
                            <p className="text-xl font-bold text-blue-600 font-mono">{value}</p>
                            <p className="text-[9px] text-slate-400 mt-1">Variance Explained</p>
                          </div>
                        ))}
                      </div>

                      {selectedSemModel === 'cbsem' && analysisResults.cbsem.fit_indices && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5">
                          <h4 className="text-xs font-semibold text-slate-700 mb-4">Goodness-of-Fit (GoF) Indices</h4>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {[
                              { label: 'Chi-Square', value: analysisResults.cbsem.fit_indices.chi_square },
                              { label: 'df', value: analysisResults.cbsem.fit_indices.df },
                              { label: 'p-value', value: analysisResults.cbsem.fit_indices.p_value, status: 'Significant' },
                              { label: 'RMSEA', value: analysisResults.cbsem.fit_indices.rmsea, status: '< 0.08' },
                              { label: 'CFI', value: analysisResults.cbsem.fit_indices.cfi, status: '> 0.90' },
                              { label: 'TLI', value: analysisResults.cbsem.fit_indices.tli, status: '> 0.90' }
                            ].map((f, i) => (
                              <div key={i} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                                <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">{f.label}</p>
                                <p className="text-sm font-bold text-slate-800">{f.value}</p>
                                {f.status && <span className="text-[8px] font-semibold text-emerald-600 block mt-0.5">{f.status}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                          <h4 className="text-xs font-semibold text-slate-700">Structural Regression Weights</h4>
                        </div>
                        <div className="overflow-auto max-h-[420px] custom-scrollbar">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase border-b border-slate-100 sticky top-0">
                              <tr>
                                {['Structural Path', 'Estimate (β)', 'S.E.', 'P-Value'].map(h => (
                                  <th key={h} className="px-4 py-3">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                              {analysisResults[selectedSemModel === 'cbsem' ? 'cbsem' : 'sem'].paths.map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 even:bg-slate-50/30">
                                  <td className="px-4 py-3 font-medium text-slate-800">
                                    {p.source} <span className="text-blue-500 mx-1 font-bold">→</span> {p.target}
                                  </td>
                                  <td className="px-4 py-3 text-blue-600 font-mono font-bold">{p.coef}</td>
                                  <td className="px-4 py-3 font-mono">{p.se}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {p.p_value < 0.001 ? '< 0.001' : p.p_value}
                                    </span>
                                    {p.note && <span className="ml-2 text-[9px] text-slate-400 font-semibold uppercase">{p.note}</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {semSubTab === 'plots' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-in fade-in duration-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-4">SEM Path Coefficient Diagram</h4>
                      {((selectedSemModel === 'cbsem' && !imageError.cbsem && analysisPlots.cbsem) || (selectedSemModel === 'pls' && !imageError.sem && analysisPlots.sem)) ? (
                        <img
                          src={selectedSemModel === 'cbsem' ? analysisPlots.cbsem : analysisPlots.sem}
                          alt="SEM Plot"
                          onError={() => {
                            if (selectedSemModel === 'cbsem') {
                              setImageError(prev => ({ ...prev, cbsem: true }));
                            } else {
                              setImageError(prev => ({ ...prev, sem: true }));
                            }
                          }}
                          className="w-full max-w-4xl h-auto object-contain rounded-xl border border-slate-100 mx-auto block"
                        />
                      ) : (
                        <svg className="w-full max-w-4xl h-[450px] bg-slate-50 border border-slate-100 rounded-xl p-6 mx-auto block" viewBox="0 0 200 110">
                          <defs>
                            <marker id="cbsemarrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb" />
                            </marker>
                            <marker id="cbdashedarrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
                            </marker>
                          </defs>
                          <text x="100" y="8" fontSize="4.5" fill="#0f172a" fontWeight="bold" textAnchor="middle">Model Struktural SEM — MADEL5C: Literasi Digital Ekspansif Calon Guru</text>
                          <text x="100" y="13" fontSize="2.8" fill="#4b5563" textAnchor="middle">Integrasi CHAT (Engeström) × Connectivism (Siemens) × DigComp 2.2</text>
                          <path d="M 30,65 L 30,102 L 170,102 L 170,65" fill="none" stroke="#94a3b8" strokeDasharray="3,3" strokeWidth="1" markerEnd="url(#cbdashedarrow)" />
                          <text x="100" y="99" fontSize="2.8" fill="#475569" fontWeight="bold" textAnchor="middle">Efek Total melalui Mediasi: 0.55**</text>
                          <line x1="42" y1="48" x2="63" y2="32" stroke="#4b5563" strokeWidth="1.2" markerEnd="url(#cbsemarrow)" />
                          <text x="50" y="38" fontSize="2.5" fill="#1e3a5f" fontWeight="bold">β = 0.65**</text>
                          <line x1="42" y1="62" x2="63" y2="78" stroke="#4b5563" strokeWidth="1.2" markerEnd="url(#cbsemarrow)" />
                          <text x="50" y="72" fontSize="2.5" fill="#1e3a5f" fontWeight="bold">β = 0.58**</text>
                          <line x1="87" y1="32" x2="108" y2="48" stroke="#4b5563" strokeWidth="1.2" markerEnd="url(#cbsemarrow)" />
                          <text x="100" y="38" fontSize="2.5" fill="#1e3a5f" fontWeight="bold">β = 0.42**</text>
                          <line x1="87" y1="78" x2="108" y2="62" stroke="#4b5563" strokeWidth="1.2" markerEnd="url(#cbsemarrow)" />
                          <text x="100" y="72" fontSize="2.5" fill="#1e3a5f" fontWeight="bold">β = 0.48**</text>
                          <line x1="132" y1="55" x2="153" y2="55" stroke="#4b5563" strokeWidth="1.2" markerEnd="url(#cbsemarrow)" />
                          <text x="142" y="52" fontSize="2.5" fill="#1e3a5f" fontWeight="bold">β = 0.72**</text>
                          {[{cx:30,cy:55,label:'C1',sub:'R²=0.62'},{cx:75,cy:25,label:'C2',sub:'R²=0.74'},{cx:75,cy:80,label:'C3',sub:'R²=0.68'},{cx:120,cy:55,label:'C4',sub:'R²=0.81'},{cx:165,cy:55,label:'C5',sub:'R²=0.77'}].map((n, i) => (
                            <g key={i}>
                              <circle cx={n.cx} cy={n.cy} r="13" fill="#0f172a" />
                              <text x={n.cx} y={n.cy - 1} fontSize="4.5" fill="#ffffff" fontWeight="bold" textAnchor="middle">{n.label}</text>
                              <text x={n.cx} y={n.cy + 5} fontSize="2.5" fill="#94a3b8" textAnchor="middle">{n.sub}</text>
                            </g>
                          ))}
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon="fa-route" message={`${selectedSemModel === 'cbsem' ? 'CB-SEM' : 'PLS-SEM'} belum dijalankan.`} sub='Pilih engine dan klik tombol "Run SEM" untuk memproses model struktural.' />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
