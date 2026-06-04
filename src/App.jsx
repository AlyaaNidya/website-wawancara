import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, BarChart2, UserPlus, 
  Settings, LogOut, Search, Bell, Activity, 
  Users, Clock, CheckCircle2, ChevronLeft, ChevronRight, Download, 
  Calendar, Video, Star, AlertTriangle, Sparkles, Save, Printer, Lock, X, Filter, FileText, Check, Link as LinkIcon
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from 'recharts';

// --- MOCK DATA ---
const initialCandidates = [
  { id: 1, name: 'Kartika Sari', email: 'kartika@example.com', phone: '0812-3456-7890', role: 'Admin Pabrik', date: '2026-05-24', status: 'DONE', score: 86, zoomLink: 'https://zoom.us/j/111222333',
    traits: { adaptability: 85, creativity: 70, curiosity: 80, eq: 85, initiative: 90, resilience: 80, integrity: 100, motivation: 85, resolution: 75 }
  },
  { id: 2, name: 'Damai Sejahtera', email: 'damai@example.com', phone: '0812-9876-5432', role: 'Pelaksana Operator', date: '2026-05-25', status: 'WAITING', score: null, zoomLink: 'https://zoom.us/j/444555666',
    traits: null
  },
  { id: 3, name: 'Budi Santoso', email: 'budi@example.com', phone: '0812-1111-2222', role: 'Pelaksana Operator', date: '2026-05-24', status: 'DONE', score: 65, zoomLink: 'https://zoom.us/j/777888999', 
    traits: { adaptability: 65, creativity: 60, curiosity: 70, eq: 65, initiative: 60, resilience: 75, integrity: 80, motivation: 70, resolution: 65 }
  },
  { id: 4, name: 'Siti Aminah', email: 'siti@example.com', phone: '0812-3333-4444', role: 'Admin Pabrik', date: '2026-05-23', status: 'DONE', score: 45, zoomLink: 'https://zoom.us/j/123123123', 
    traits: { adaptability: 45, creativity: 50, curiosity: 45, eq: 50, initiative: 40, resilience: 50, integrity: 60, motivation: 45, resolution: 40 }
  },
  { id: 5, name: 'Ahmad Faisal', email: 'ahmad@example.com', phone: '0812-5555-6666', role: 'Supervisor Produksi', date: '2026-05-24', status: 'DONE', score: 92, zoomLink: 'https://zoom.us/j/321321321', 
    traits: { adaptability: 90, creativity: 85, curiosity: 90, eq: 95, initiative: 95, resilience: 90, integrity: 100, motivation: 95, resolution: 90 }
  }
];

const initialStandardTraits = { adaptability: 80, creativity: 75, curiosity: 75, eq: 80, initiative: 80, resilience: 85, integrity: 95, motivation: 80, resolution: 80 };
const initialAspectWeights = { adaptability: 3, creativity: 2, curiosity: 2, eq: 4, initiative: 3, resilience: 4, integrity: 5, motivation: 3, resolution: 3 };
const criteriaList = ['Adaptability', 'Creativity', 'Curiosity', 'Emotional Intelligence', 'Initiative', 'Resilience', 'Integrity', 'Motivation', 'Resolution'];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState(null); 
  const [currentView, setCurrentView] = useState('landing');
  const [recruiterSubView, setRecruiterSubView] = useState('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [standardTraits, setStandardTraits] = useState(initialStandardTraits);
  const [aspectWeights, setAspectWeights] = useState(initialAspectWeights);
  const [toast, setToast] = useState(null);

  const [activeInterviewAspect, setActiveInterviewAspect] = useState('Adaptability');
  const [interviewAnswers, setInterviewAnswers] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [aiQuestions, setAiQuestions] = useState({});
  
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [pdfCandidate, setPdfCandidate] = useState(null);

  // State Filter & Paginasi Khusus Analytics Hub
  const [analyticsScoreFilter, setAnalyticsScoreFilter] = useState('All');
  const [analyticsRoleFilter, setAnalyticsRoleFilter] = useState('All');
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState('');
  const [analyticsPage, setAnalyticsPage] = useState(1);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // --- FETCH KE NETLIFY FUNCTION: GENERATE QUESTION ---
  const handleGenerateAIQuestion = async () => {
    showToast(`AI sedang membuat pertanyaan ${activeInterviewAspect}...`); 
    try {
      const response = await fetch('/.netlify/functions/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aspect: activeInterviewAspect,
          role: selectedCandidate.role
        })
      });
      const data = await response.json();
      
      setAiQuestions(prev => ({ ...prev, [activeInterviewAspect]: data.question })); 
      setSelectedQuestions(prev => ({ ...prev, [activeInterviewAspect]: data.question })); 
    } catch (error) {
      showToast("Gagal terhubung ke Netlify Function.");
    }
  };

  // --- FETCH KE NETLIFY FUNCTION: CALCULATE SCORE ---
  const handleSubmitEvaluation = async () => {
    if(Object.keys(interviewAnswers).filter(k => interviewAnswers[k]?.trim() !== "").length < 9) { 
        showToast('Harap selesaikan seluruh 9 aspek untuk menjalankan AI.');
        return;
    }
    
    showToast('AI Serverless sedang menghitung skor tertimbang...');
    
    try {
        const response = await fetch('/.netlify/functions/analyze-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aspectWeights: aspectWeights })
        });
        const data = await response.json();
        
        setCandidates(candidates.map(c => c.id === selectedCandidate.id ? { ...c, status: 'DONE', score: data.score, traits: data.traits } : c )); 
        showToast('Analisis Berhasil Disimpan!'); 
        setTimeout(() => setRecruiterSubView('dashboard'), 1500); 
    } catch (error) {
        showToast('Gagal menghubungi backend serverless.');
    }
  };

  const handleExportPDF = () => { if (selectedCandidate) setPdfCandidate(selectedCandidate); };

  const handleAddCandidate = (newCandidate) => {
    setCandidates([{ ...newCandidate, id: Date.now(), status: 'WAITING', score: null }, ...candidates]);
    setRecruiterSubView('dashboard');
    showToast('Kandidat Berhasil Ditambahkan');
  };

  const handleLogout = () => { setIsLoggedIn(false); setAuthRole(null); setCurrentView('landing'); };

  useEffect(() => {
    if (pdfCandidate) {
      showToast(`Menyiapkan laporan PDF ringkas untuk ${pdfCandidate.name}...`);
      setTimeout(() => {
        const element = document.getElementById('hidden-pdf-content');
        if (element) {
          const opt = { 
            margin: 0, 
            filename: `Laporan_IntegritAS_${pdfCandidate.name.replace(/\s+/g, '_')}.pdf`, 
            image: { type: 'jpeg', quality: 1.0 }, 
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 }, 
            jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' } 
          };
          window.html2pdf().set(opt).from(element).save().then(() => {
            showToast('Dokumen PDF Ringkas berhasil diunduh!');
            setPdfCandidate(null);
          });
        }
      }, 1000); 
    }
  }, [pdfCandidate]);

  const LandingView = () => (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 z-10"><ShieldCheck size={32} className="text-white" /></div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 z-10 text-center">Integrit<span className="text-white">AS</span><span className="text-indigo-500">.</span></h1>
      <p className="text-slate-400 max-w-2xl text-center mb-12 md:mb-16 text-base md:text-lg z-10 px-4">Platform Evaluasi Psikologis & Kepatuhan SOP Karyawan Berbasis AI Terintegrasi.</p>
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl z-10 px-4">
        <button onClick={() => { setAuthRole('recruiter'); setCurrentView('login'); }} className="flex-1 bg-[#1e293b] hover:bg-[#27354f] transition-all p-6 md:p-8 rounded-3xl border border-slate-700/50 text-left group cursor-pointer">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><LayoutDashboard className="text-indigo-400" /></div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Portal Rekruter</h2>
          <p className="text-slate-400 leading-relaxed text-sm">Kelola instrumen penilaian, jalankan wawancara tertimbang AI, dan bandingkan rekap nilai.</p>
        </button>
      </div>
    </div>
  );

  const LoginView = () => {
    const handleSubmit = (e) => { e.preventDefault(); setIsLoggedIn(true); setCurrentView(authRole); setRecruiterSubView('dashboard'); showToast(`Login berhasil`); };
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white text-slate-800 p-8 rounded-[32px] max-w-md w-full shadow-2xl border border-slate-100">
          <button onClick={() => setCurrentView('landing')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 mb-6 uppercase"><ChevronLeft size={16}/> Kembali</button>
          <div className="flex items-center gap-3 mb-6"><div className={`w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md`}><Lock size={20}/></div><div><h3 className="text-xl font-black text-slate-800">Sign In Portal</h3></div></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label><input type="email" defaultValue="admin@integritas.com" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label><input type="password" defaultValue="123456" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" /></div>
            <button type="submit" className="w-full text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-4 bg-indigo-600 hover:bg-indigo-700">MASUK</button>
          </form>
        </div>
      </div>
    );
  };

  const RecruiterView = () => {
    const uniqueRoles = [...new Set(candidates.map(c => c.role.split('(')[0].trim()))];

    const filteredCandidates = candidates.filter(cand => {
      const candBaseRole = cand.role.split('(')[0].trim();
      const matchRole = filterRole === 'All' || candBaseRole === filterRole;
      const matchStatus = filterStatus === 'All' || cand.status === filterStatus;
      return matchRole && matchStatus;
    });

    const renderAnalysisReport = (candidateData, isPDF = false) => {
       if (!candidateData) return null;
       const isRoleAdmin = candidateData.role.toLowerCase().includes('admin');
       const kesimpulanText = isRoleAdmin
          ? `"Kandidat teliti dan teratur. Profil psikologisnya cocok menangani data operasional atau pembukuan yang butuh akurasi."`
          : `"Kandidat disiplin dan patuh instruksi. Profilnya siap menghadapi ritme kerja lapangan dan shift pabrik yang dinamis."`;
       const nilaiPlus = isRoleAdmin ? ["Akurasi Data Tinggi", "Manajemen Prioritas", "Tenang Saat Komplain"] : ["Kepatuhan (K3) Baik", "Daya Tahan Fisik", "Disiplin Kehadiran"];
       const areaPengembangan = isRoleAdmin ? ["Adaptasi Software Baru", "Inisiatif Mandiri"] : ["Adaptasi Mesin Baru", "Analisis Kendala Cepat"];
       const panduanQ1 = isRoleAdmin ? `"Jika format laporan diganti mendadak, bagaimana Anda mengejar ketertinggalan?"` : `"Jika mesin rusak dan target tinggi, apa langkah konkrit Anda?"`;
       const panduanQ2 = isRoleAdmin ? `"Ceritakan momen menemukan data tak sinkron. Bagaimana menelusurinya?"` : `"Ceritakan pengalaman bekerja dengan rekan yang sering langgar aturan K3."`;

        const aspectData = criteriaList.map(a => {
            const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ', '');
            const candScore = candidateData.traits[key] || 0;
            const targetScore = standardTraits[key] || 0;
            const gap = candScore - targetScore;
            let status = 'Sesuai'; let statusColor = 'text-blue-700 bg-blue-50'; let icon = <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>;

            if (gap >= 5) { status = 'Unggul'; statusColor = 'text-emerald-700 bg-emerald-50'; icon = <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>; } 
            else if (gap < 0) { status = 'Kurang'; statusColor = 'text-amber-700 bg-amber-50'; icon = <AlertTriangle size={10} className="text-amber-600 stroke-[3] shrink-0" />; }
            return { aspect: a, candScore, targetScore, gap, status, statusColor, icon };
        }).sort((a, b) => b.gap - a.gap);

       return (
         <div id={isPDF ? "hidden-pdf-content" : "pdf-content"} className={isPDF ? 'w-[794px] h-[1123px] bg-white p-8 font-sans box-border text-slate-800' : 'max-w-4xl mx-auto space-y-4 pb-10 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100'}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 rounded-xl p-3 gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="bg-indigo-600 flex flex-col items-center justify-center text-white rounded-lg w-12 h-12 shrink-0"><span className="text-sm font-black leading-none">{candidateData.score}</span><span className="text-[8px] font-bold uppercase opacity-80 mt-0.5">Score</span></div>
                <div className="flex-1"><h3 className="font-bold text-slate-800 text-lg leading-tight">{candidateData.name}</h3><p className="text-slate-500 text-xs font-medium">{candidateData.role} • {candidateData.date}</p></div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {candidateData.score >= 80 ? (<div className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm"><Check size={12} strokeWidth={3}/> <span className="text-xs font-bold uppercase tracking-wide">Hire</span></div>) 
                  : candidateData.score >= 65 ? (<div className="bg-amber-100 text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm"><AlertTriangle size={12} strokeWidth={3}/> <span className="text-xs font-bold uppercase tracking-wide">Consider</span></div>) 
                  : (<div className="bg-red-100 text-red-800 border border-red-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shadow-sm"><X size={12} strokeWidth={3}/> <span className="text-xs font-bold uppercase tracking-wide">Reject</span></div>)}
                  {!isPDF && (<button onClick={handleExportPDF} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg shadow-sm transition-colors print:hidden" title="Download PDF"><Printer size={16}/></button>)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-1 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                    {isPDF ? (
                        <RadarChart width={220} height={200} outerRadius={65} data={criteriaList.map(a => { const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ', ''); return { aspect: a, Kandidat: (candidateData.traits[key] || 0) / 10, Target: (standardTraits[key] || 0) / 10 }; })}>
                            <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="aspect" tick={{ fill: '#475569', fontSize: 7, fontWeight: 600 }} /><PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name="Kandidat" dataKey="Kandidat" stroke="#6366f1" strokeWidth={1.5} fill="#6366f1" fillOpacity={0.4} isAnimationActive={false} />
                            <Radar name="Target" dataKey="Target" stroke="#10b981" strokeWidth={1} fill="#10b981" fillOpacity={0.1} isAnimationActive={false} />
                        </RadarChart>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart outerRadius={65} data={criteriaList.map(a => { const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ', ''); return { aspect: a, Kandidat: (candidateData.traits[key] || 0) / 10, Target: (standardTraits[key] || 0) / 10 }; })}>
                            <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="aspect" tick={{ fill: '#475569', fontSize: 8, fontWeight: 600 }} /><PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name="Kandidat" dataKey="Kandidat" stroke="#6366f1" strokeWidth={1.5} fill="#6366f1" fillOpacity={0.4} />
                            <Radar name="Target" dataKey="Target" stroke="#10b981" strokeWidth={1} fill="#10b981" fillOpacity={0.1} />
                            <RechartsTooltip wrapperStyle={{fontSize: '10px'}}/>
                          </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="col-span-1 lg:col-span-2 flex flex-col gap-3">
                    <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3"><div className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Ringkasan Evaluasi AI</div><p className="text-slate-700 text-xs italic">"{kesimpulanText}"</p></div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3"><div className="text-[10px] font-bold text-emerald-700 uppercase mb-2">Nilai Plus</div><ul className="space-y-1.5">{nilaiPlus.map((item, i) => (<li key={i} className="flex items-start gap-1.5 text-xs text-slate-700"><Check size={12} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={3}/> <span>{item}</span></li>))}</ul></div>
                        <div className="bg-amber-50 rounded-xl border border-amber-100 p-3"><div className="text-[10px] font-bold text-amber-700 uppercase mb-2">Area Pengembangan</div><ul className="space-y-1.5">{areaPengembangan.map((item, i) => (<li key={i} className="flex items-start gap-1.5 text-xs text-slate-700"><span className="text-amber-500 font-black shrink-0 w-3 text-center">!</span> <span>{item}</span></li>))}</ul></div>
                    </div>
                </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs"><thead className="bg-slate-100 text-[10px] uppercase text-slate-500"><tr><th className="px-3 py-2 font-bold">Aspek</th><th className="px-3 py-2 font-bold text-center">Kandidat</th><th className="px-3 py-2 font-bold text-center hidden sm:table-cell">Target</th><th className="px-3 py-2 font-bold text-center">Gap</th><th className="px-3 py-2 font-bold hidden sm:table-cell">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {aspectData.map((data, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 font-semibold text-slate-800">{data.aspect}</td><td className={`px-3 py-1.5 text-center font-bold ${data.gap >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{data.candScore}</td><td className="px-3 py-1.5 text-center text-slate-400 hidden sm:table-cell">{data.targetScore}</td>
                                <td className={`px-3 py-1.5 text-center font-bold ${data.gap > 0 ? 'text-emerald-500' : data.gap < 0 ? 'text-amber-500' : 'text-slate-400'}`}>{data.gap > 0 ? `+${data.gap}` : data.gap}</td><td className="px-3 py-1.5 hidden sm:table-cell"><span className={`inline-flex items-center gap-1 rounded-md font-bold ${data.statusColor} text-[10px] px-1.5 py-0.5`}>{data.icon} {data.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 mt-4">
              <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Star size={12}/> Panduan Wawancara Validasi</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border-l-2 border-indigo-500 pl-2"><div className="text-xs font-bold text-white mb-0.5">Q1: Skenario Adaptasi</div><div className="text-[11px] text-slate-300 leading-tight">{panduanQ1}</div></div>
                <div className="border-l-2 border-indigo-500 pl-2"><div className="text-xs font-bold text-white mb-0.5">Q2: Resolusi Konflik/Error</div><div className="text-[11px] text-slate-300 leading-tight">{panduanQ2}</div></div>
              </div>
            </div>
         </div>
       );
    };

    return (
      <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-800 font-sans">
        <div className="w-full md:w-64 bg-[#0f172a] text-slate-300 flex flex-col md:h-full shrink-0">
          <div className="p-4 md:p-6 flex items-center justify-center md:justify-start gap-3 cursor-pointer" onClick={handleLogout}><div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center"><ShieldCheck size={20} className="text-white" /></div><span className="text-xl font-bold text-white tracking-tight">IntegritAS</span></div>
          <div className="flex-row md:flex-col flex overflow-x-auto md:overflow-visible flex-1 px-4 py-2 md:py-6 gap-2 border-b md:border-none border-slate-800">
            <button onClick={() => setRecruiterSubView('dashboard')} className={`min-w-max flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard size={20} /><span className="font-medium">Dashboard</span></button>
            <button onClick={() => {setRecruiterSubView('analyticsList'); setAnalyticsPage(1);}} className={`min-w-max flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView.includes('analytics') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><BarChart2 size={20} /><span className="font-medium">Analytics Hub</span></button>
            <button onClick={() => setRecruiterSubView('add')} className={`min-w-max flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView === 'add' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><UserPlus size={20} /><span className="font-medium">Add Candidate</span></button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 shrink-0">
            <h2 className="text-lg md:text-2xl font-extrabold text-slate-800 flex items-center">
              {recruiterSubView === 'dashboard' && 'Overview Dashboard'}
              {recruiterSubView === 'add' && 'Add Candidate'}
              {recruiterSubView === 'analyticsList' && 'Analytics Hub'}
              {recruiterSubView === 'analyticsDetail' && (<><button onClick={() => setRecruiterSubView('analyticsList')} className="p-1 hover:bg-slate-100 rounded-full mr-2 -ml-2"><ChevronLeft size={24} /></button>Detail Analisis</>)}
              {recruiterSubView === 'interview' && (<><button onClick={() => setRecruiterSubView('dashboard')} className="p-1 hover:bg-slate-100 rounded-full mr-2 -ml-2"><ChevronLeft size={24} /></button>Sesi Interview AI</>)}
            </h2>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 relative print:p-0 print:bg-white print:overflow-visible">
            {toast && (<div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50"><CheckCircle2 className="text-emerald-400 shrink-0" size={24} /><span className="font-medium">{toast}</span></div>)}
            
            {recruiterSubView === 'dashboard' && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-center justify-center text-center"><div className="text-[10px] font-bold text-slate-400 mb-1">TOTAL KANDIDAT</div><div className="text-3xl font-black text-slate-800">{candidates.length}</div></div>
                  <div className="bg-white p-5 rounded-3xl border shadow-sm flex flex-col items-center justify-center text-center"><div className="text-[10px] font-bold text-slate-400 mb-1">SIAP REVIEW</div><div className="text-3xl font-black text-slate-800">{candidates.filter(c=>c.status==='DONE').length}</div></div>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
                  <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Antrean Wawancara</h3>
                    <div className="flex gap-2">
                      <select value={filterRole} onChange={e=>setFilterRole(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-lg px-2"><option value="All">Semua Posisi</option>{uniqueRoles.map(r=><option key={r} value={r}>{r}</option>)}</select>
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-lg px-2"><option value="All">Semua Status</option><option value="WAITING">Waiting</option><option value="DONE">Done</option></select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead><tr className="text-[10px] font-bold text-slate-400 border-b bg-white"><th className="p-4">KANDIDAT</th><th className="p-4">POSISI</th><th className="p-4">ZOOM LINK</th><th className="p-4">STATUS</th><th className="p-4 text-center">AKSI</th></tr></thead>
                      <tbody>
                        {filteredCandidates.map(cand => (
                          <tr key={cand.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                            <td className="p-4"><div className="font-bold text-slate-800">{cand.name}</div><div className="text-xs text-slate-500">{cand.email}</div></td>
                            <td className="p-4 text-sm font-medium text-slate-600">{cand.role}</td>
                            <td className="p-4"><div className="flex flex-col gap-1"><div className="text-xs text-slate-500">{cand.date}</div>{cand.zoomLink ? <a href={cand.zoomLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 text-xs font-bold"><LinkIcon size={12}/> Link Zoom</a> : <span className="text-[10px] text-slate-400">Tidak ada link</span>}</div></td>
                            <td className="p-4">{cand.status === 'WAITING' ? <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Waiting</span> : <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Done</span>}</td>
                            <td className="p-4 flex justify-center gap-2">
                              {cand.status === 'WAITING' ? 
                                <button onClick={() => { setSelectedCandidate(cand); setRecruiterSubView('interview'); setInterviewAnswers({}); setSelectedQuestions({}); setAiQuestions({}); setActiveInterviewAspect('Adaptability'); }} className="bg-white border text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2"><Activity size={14} /> Analyze</button> :
                                <button onClick={() => { setSelectedCandidate(cand); setRecruiterSubView('analyticsDetail'); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Lihat Hasil</button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {recruiterSubView === 'add' && (
              <div className="max-w-3xl mx-auto bg-white rounded-3xl border shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Tambah Kandidat & Jadwal</h3>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleAddCandidate({ name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), role: fd.get('role'), date: fd.get('date'), zoomLink: fd.get('zoomLink') }); }}>
                  <div><label className="block text-xs font-bold text-slate-500 mb-2">NAMA LENGKAP</label><input name="name" required type="text" className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-indigo-500 text-sm" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">EMAIL</label><input name="email" required type="email" className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">NO TELEPON</label><input name="phone" required type="text" className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">POSISI</label><select name="role" className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm"><option>Pelaksana Operator</option><option>Admin Pabrik</option></select></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">TANGGAL WAWANCARA</label><input name="date" required type="date" className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm" /></div>
                    <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-2">LINK ZOOM MEETING</label><input name="zoomLink" type="url" placeholder="https://zoom.us/j/..." className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm" /></div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-6 text-sm">SIMPAN & JADWALKAN</button>
                </form>
              </div>
            )}

            {recruiterSubView === 'analyticsList' && (() => {
                let filteredAnalyticCands = candidates.filter(c => c.status === 'DONE');
                if (analyticsRoleFilter !== 'All') filteredAnalyticCands = filteredAnalyticCands.filter(c => c.role.split('(')[0].trim() === analyticsRoleFilter);
                if (analyticsDateFilter) filteredAnalyticCands = filteredAnalyticCands.filter(c => c.date === analyticsDateFilter);
                if (analyticsScoreFilter !== 'All') {
                    filteredAnalyticCands = filteredAnalyticCands.filter(c => {
                        if (analyticsScoreFilter === '<50') return c.score < 50;
                        if (analyticsScoreFilter === '50-75') return c.score >= 50 && c.score <= 75;
                        if (analyticsScoreFilter === '>75') return c.score > 75;
                        return true;
                    });
                }
                filteredAnalyticCands.sort((a, b) => { if (a.date !== b.date) return new Date(b.date) - new Date(a.date); return b.id - a.id; });

                const itemsPerPage = 15;
                const totalPages = Math.ceil(filteredAnalyticCands.length / itemsPerPage) || 1;
                if (analyticsPage > totalPages) setAnalyticsPage(totalPages);
                const currentAnalytics = filteredAnalyticCands.slice((analyticsPage - 1) * itemsPerPage, analyticsPage * itemsPerPage);

                const avgTraits = {};
                criteriaList.forEach(c => {
                    const key = c === 'Emotional Intelligence' ? 'eq' : c.toLowerCase().replace(' ', '');
                    if (filteredAnalyticCands.length === 0) avgTraits[key] = 0;
                    else avgTraits[key] = Math.round(filteredAnalyticCands.reduce((acc, cand) => acc + (cand.traits[key] || 0), 0) / filteredAnalyticCands.length);
                });
                const avgScore = filteredAnalyticCands.length > 0 ? Math.round(filteredAnalyticCands.reduce((acc, cand) => acc + cand.score, 0) / filteredAnalyticCands.length) : 0;

                const handleDownloadFilteredCSV = () => {
                    if (filteredAnalyticCands.length === 0) return showToast('Tidak ada data kandidat untuk diunduh.');
                    const headers = ['ID', 'Nama', 'Email', 'Posisi', 'Tanggal Wawancara', 'Total Skor Rata-rata (%)', ...criteriaList];
                    const rows = filteredAnalyticCands.map(c => {
                        const traits = criteriaList.map(criteria => c.traits[criteria === 'Emotional Intelligence' ? 'eq' : criteria.toLowerCase().replace(' ', '')] || 0);
                        return [c.id, `"${c.name}"`, `"${c.email}"`, `"${c.role}"`, c.date, `"${c.score}%"`, ...traits].join(',');
                    });
                    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `Laporan_Analisis_Kandidat.csv`;
                    link.click();
                    showToast('Berhasil mengunduh Data CSV Terfilter!');
                };

                return (
                    <div className="max-w-6xl mx-auto space-y-6 pb-20">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-5">
                            <div className="flex justify-between items-center gap-4">
                                <div><h3 className="text-xl font-bold text-slate-800">Analytics Hub</h3></div>
                                <button onClick={handleDownloadFilteredCSV} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex gap-2 text-sm"><Download size={18} /> Unduh CSV</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border">
                                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Kategori Skor</label><select value={analyticsScoreFilter} onChange={e => {setAnalyticsScoreFilter(e.target.value); setAnalyticsPage(1);}} className="bg-white border rounded-xl px-3 py-2 text-sm"><option value="All">Semua Skor</option><option value=">75">Skor Diatas 75%</option><option value="50-75">Skor 50% - 75%</option><option value="<50">Skor Dibawah 50%</option></select></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Posisi</label><select value={analyticsRoleFilter} onChange={e => {setAnalyticsRoleFilter(e.target.value); setAnalyticsPage(1);}} className="bg-white border rounded-xl px-3 py-2 text-sm"><option value="All">Semua Posisi</option>{uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label><input type="date" value={analyticsDateFilter} onChange={e => {setAnalyticsDateFilter(e.target.value); setAnalyticsPage(1);}} className="bg-white border rounded-xl px-3 py-2 text-sm"/></div>
                                <div className="flex flex-col justify-end"><button onClick={() => {setAnalyticsScoreFilter('All'); setAnalyticsRoleFilter('All'); setAnalyticsDateFilter(''); setAnalyticsPage(1);}} className="h-[38px] bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Filter size={14}/> Reset Filter</button></div>
                            </div>
                        </div>

                        {filteredAnalyticCands.length > 0 && (
                          <div className="bg-white rounded-3xl border shadow-sm p-6 flex flex-col lg:flex-row items-center gap-6">
                              <div className="flex-1 text-center lg:text-left">
                                  <div className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase mb-4">Rata-rata Terfilter: {filteredAnalyticCands.length} Kandidat</div>
                                  <h4 className="text-2xl font-black text-slate-800 mb-3">Profil Agregat Kolektif</h4>
                                  <div className="flex justify-center lg:justify-start gap-4 mt-6">
                                      <div className="bg-slate-50 border rounded-2xl p-4 min-w-[120px] text-center"><div className="text-[10px] font-bold uppercase mb-1">Avg Score</div><div className="text-3xl font-black text-indigo-600">{avgScore}%</div></div>
                                  </div>
                              </div>
                              <div className="w-full lg:w-[450px] h-[300px] bg-slate-50/50 rounded-3xl border p-2">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <RadarChart outerRadius={100} data={criteriaList.map(a => { const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ', ''); return { aspect: a, 'Rata-rata Terfilter': avgTraits[key] / 10, 'Standar Target': (standardTraits[key] || 0) / 10 }; })}>
                                          <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="aspect" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} /><PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                                          <Radar name="Rata-rata Terfilter" dataKey="Rata-rata Terfilter" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                                          <Radar name="Standar Target" dataKey="Standar Target" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fill="#10b981" fillOpacity={0} />
                                          <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}}/>
                                      </RadarChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>
                        )}

                        {filteredAnalyticCands.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {currentAnalytics.map(cand => (
                                    <div key={cand.id} className="bg-white rounded-3xl border shadow-sm p-5 flex flex-col items-center">
                                      <div className="w-16 h-16 bg-indigo-50 border rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black mb-3">{cand.score}%</div>
                                      <h4 className="text-lg font-bold text-slate-800 text-center mb-1">{cand.name}</h4><p className="text-slate-400 text-[10px] font-bold uppercase mb-4">{cand.role}</p>
                                      <button onClick={() => { setSelectedCandidate(cand); setRecruiterSubView('analyticsDetail'); }} className="w-full border hover:bg-indigo-50 text-indigo-600 font-bold py-2.5 rounded-xl text-sm">Lihat Rincian</button>
                                    </div>
                                  ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-8 pb-4">
                                        <button disabled={analyticsPage === 1} onClick={() => setAnalyticsPage(p => Math.max(1, p - 1))} className="w-10 h-10 rounded-xl border bg-white disabled:opacity-40"><ChevronLeft size={20} className="mx-auto"/></button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                            <button key={pageNum} onClick={() => setAnalyticsPage(pageNum)} className={`w-10 h-10 rounded-xl font-bold ${analyticsPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'}`}>{pageNum}</button>
                                        ))}
                                        <button disabled={analyticsPage === totalPages} onClick={() => setAnalyticsPage(p => Math.min(totalPages, p + 1))} className="w-10 h-10 rounded-xl border bg-white disabled:opacity-40"><ChevronLeft size={20} className="rotate-180 mx-auto"/></button>
                                    </div>
                                )}
                            </>
                        ) : (<div className="bg-white rounded-3xl border p-12 text-center">Data Tidak Ditemukan.</div>)}
                    </div>
                );
            })()}

            {recruiterSubView === 'analyticsDetail' && renderAnalysisReport(selectedCandidate, false)}

            {recruiterSubView === 'interview' && selectedCandidate && (
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 pb-20">
                <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-3xl border p-6 shrink-0 h-fit">
                  <div className="flex flex-col gap-2">
                    {criteriaList.map((criteria) => (
                      <button key={criteria} onClick={() => setActiveInterviewAspect(criteria)} className={`text-left px-4 py-3 rounded-2xl font-bold text-sm ${ activeInterviewAspect === criteria ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-600' }`}>{criteria}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="bg-slate-900 rounded-[32px] p-6 text-white">
                    <div className="flex justify-between text-sm font-bold mb-3 text-slate-400"><span>Progress</span><span className="text-indigo-400">{Object.keys(interviewAnswers).filter(k => interviewAnswers[k]?.trim() !== "").length} / 9</span></div>
                    <button onClick={handleSubmitEvaluation} className={`w-full py-3 rounded-xl font-bold text-sm ${ Object.keys(interviewAnswers).filter(k => interviewAnswers[k]?.trim() !== "").length === 9 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400' }`}>JALANKAN ANALISIS AI (TERTIMBANG)</button>
                  </div>
                  <div className="bg-white rounded-3xl border p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div><h2 className="text-2xl font-black text-slate-800">{activeInterviewAspect}</h2></div>
                      <button onClick={handleGenerateAIQuestion} className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs"><Sparkles size={16} /> Generate AI Question</button>
                    </div>
                    {aiQuestions[activeInterviewAspect] && (
                        <div className="mb-4 bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-2xl text-sm font-medium">
                            <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-[10px] uppercase"><Sparkles size={12} /> Pertanyaan AI Tersimpan</div>
                            {aiQuestions[activeInterviewAspect]}
                        </div>
                    )}
                    <textarea className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[32px] min-h-[220px] outline-none text-sm" placeholder="Masukkan poin jawaban wawancara..." value={interviewAnswers[activeInterviewAspect] || ''} onChange={(e) => setInterviewAnswers({...interviewAnswers, [activeInterviewAspect]: e.target.value})} />
                  </div>
                </div>
              </div>
            )}
          </main>

          <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -10 }}>
            {pdfCandidate && renderAnalysisReport(pdfCandidate, true)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {currentView === 'landing' && <LandingView />}
      {currentView === 'login' && <LoginView />}
      {isLoggedIn && currentView === 'recruiter' && <RecruiterView />}
    </>
  );
}