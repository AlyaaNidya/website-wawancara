import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, BarChart2, UserPlus, 
  Settings, LogOut, Bell, Activity, Users, Clock, 
  CheckCircle2, ChevronLeft, ChevronRight, Download, 
  Calendar, Video, Star, AlertTriangle, Sparkles, 
  Save, Printer, Lock, X, Filter, FileText, Check, Link
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from 'recharts';

const initialCandidates = [
  { id: 1, name: 'Kartika Sari', email: 'kartika@example.com', phone: '0812-3456-7890', role: 'Admin Pabrik', date: '2026-05-24', status: 'DONE', score: 86, zoomLink: 'https://zoom.us/j/123456', traits: { adaptability: 85, creativity: 70, curiosity: 80, eq: 85, initiative: 90, resilience: 80, integrity: 100, motivation: 85, resolution: 75 } },
  { id: 2, name: 'Damai Sejahtera', email: 'damai@example.com', phone: '0812-9876-5432', role: 'Pelaksana Operator', date: '2026-05-25', status: 'WAITING', score: null, zoomLink: 'https://zoom.us/j/654321', traits: null }
];

const initialStandardTraits = { adaptability: 80, creativity: 75, curiosity: 75, eq: 80, initiative: 80, resilience: 85, integrity: 95, motivation: 80, resolution: 80 };
const initialAspectWeights = { adaptability: 3, creativity: 2, curiosity: 2, eq: 4, initiative: 3, resilience: 4, integrity: 5, motivation: 3, resolution: 3 };
const criteriaList = ['Adaptability', 'Creativity', 'Curiosity', 'Emotional Intelligence', 'Initiative', 'Resilience', 'Integrity', 'Motivation', 'Resolution'];
const ITEMS_PER_PAGE = 15;

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
    const [pdfCandidate, setPdfCandidate] = useState(null);

    const [hubFilterScore, setHubFilterScore] = useState('All');
    const [hubFilterRole, setHubFilterRole] = useState('All');
    const [hubFilterDate, setHubFilterDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [dashFilterRole, setDashFilterRole] = useState('All');
    const [dashFilterStatus, setDashFilterStatus] = useState('All');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // MENGAMBIL PERTANYAAN DARI NETLIFY FUNCTION (BACKEND)
    const handleGenerateAIQuestion = async () => {
      showToast(`AI sedang mengambil pertanyaan ${activeInterviewAspect}...`); 
      try {
        // Fetch ke backend serverless generate-question.js
        const res = await fetch('/api/generate-question', {
            method: 'POST',
            body: JSON.stringify({ aspect: activeInterviewAspect, role: selectedCandidate.role })
        });
        const data = await res.json();
        setAiQuestions(prev => ({ ...prev, [activeInterviewAspect]: data.question })); 
        setSelectedQuestions(prev => ({ ...prev, [activeInterviewAspect]: data.question })); 
      } catch (error) {
        showToast("Gagal terhubung ke AI serverless.");
      }
    };

    const handleExportPDF = () => { if (selectedCandidate) setPdfCandidate(selectedCandidate); };

    const getFilteredDoneCandidates = () => {
      return candidates.filter(c => c.status === 'DONE').filter(c => {
        let matchScore = true;
        if (hubFilterScore === '>75') matchScore = c.score > 75;
        else if (hubFilterScore === '50-75') matchScore = c.score >= 50 && c.score <= 75;
        else if (hubFilterScore === '<50') matchScore = c.score < 50;
        const baseRole = c.role.split('(')[0].trim();
        let matchRole = hubFilterRole === 'All' || baseRole === hubFilterRole;
        let matchDate = hubFilterDate === '' || c.date === hubFilterDate;
        return matchScore && matchRole && matchDate;
      }).sort((a, b) => b.id - a.id); 
    };

    const handleDownloadCSV = () => {
      const filteredData = getFilteredDoneCandidates();
      if (filteredData.length === 0) { showToast('Tidak ada data kandidat yang cocok dengan filter untuk diunduh.'); return; }
      const headers = ['ID', 'Nama', 'Email', 'Posisi', 'Tanggal Wawancara', 'Total Skor Rata-rata (%)', ...criteriaList];
      const rows = filteredData.map(c => {
        const traits = criteriaList.map(criteria => c.traits[criteria === 'Emotional Intelligence' ? 'eq' : criteria.toLowerCase().replace(' ', '')] || 0);
        return [c.id, `"${c.name}"`, `"${c.email}"`, `"${c.role}"`, c.date, `"${c.score}%"`, ...traits].join(',');
      });
      const csvString = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Laporan_Kandidat_IntegritAS_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Berhasil mengunduh Data CSV!');
    };

    const handleAddCandidate = (newCandidate) => {
        setCandidates([{...newCandidate, id: Date.now(), status: 'WAITING', score: null}, ...candidates]);
        setRecruiterSubView('dashboard');
        showToast('Kandidat Ditambahkan');
    };

    // MENGHITUNG SKOR MELALUI NETLIFY FUNCTION (BACKEND)
    const handleSubmitEvaluation = async () => {
      if(Object.keys(interviewAnswers).filter(k=>interviewAnswers[k]?.trim()!=="").length < 9) { 
          showToast('Harap selesaikan seluruh 9 aspek untuk menjalankan AI.');
          return;
      }
      
      showToast('Serverless sedang menghitung skor tertimbang...');
      
      try {
          // Fetch ke backend serverless analyze-score.js
          const response = await fetch('/api/analyze-score', {
              method: 'POST',
              body: JSON.stringify({ aspectWeights: aspectWeights })
          });
          const data = await response.json();
          
          setCandidates(candidates.map(c => c.id === selectedCandidate.id ? {...c, status: 'DONE', score: data.score, traits: data.traits} : c)); 
          showToast('Analisis Berhasil Disimpan!'); 
          setTimeout(()=>setRecruiterSubView('dashboard'), 1500); 
      } catch (err) {
          showToast('Gagal menghubungi backend serverless.');
      }
    };

    const handleLogout = () => { setIsLoggedIn(false); setAuthRole(null); setCurrentView('landing'); };

    useEffect(() => {
      if (pdfCandidate) {
        showToast(`Menyiapkan laporan PDF untuk ${pdfCandidate.name}...`);
        setTimeout(() => {
          const element = document.getElementById('hidden-pdf-content');
          if (element) {
            const opt = { 
              margin: 0, 
              filename: `Laporan_IntegritAS_${pdfCandidate.name.replace(/\s+/g, '_')}.pdf`, 
              image: { type: 'jpeg', quality: 1.0 }, 
              html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0, windowWidth: 800 }, 
              jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' } 
            };
            window.html2pdf().set(opt).from(element).save().then(() => {
              showToast('Dokumen PDF 1-Halaman Kompak berhasil diunduh!');
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
          <button onClick={() => { setAuthRole('candidate'); setCurrentView('login'); }} className="flex-1 bg-[#1e293b] hover:bg-[#27354f] transition-all p-6 md:p-8 rounded-3xl border border-slate-700/50 text-left group cursor-pointer">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><UserPlus className="text-emerald-400" /></div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Portal Kandidat</h2>
            <p className="text-slate-400 leading-relaxed text-sm">Isi detail biodata diri, verifikasi kecocokan posisi, dan ikuti agenda wawancara terintegrasi.</p>
          </button>
        </div>
      </div>
    );

    const LoginView = () => (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-white text-slate-800 p-8 rounded-[32px] max-w-md w-full shadow-2xl border border-slate-100">
          <button onClick={() => setCurrentView('landing')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 mb-6 uppercase"><ChevronLeft size={16}/> Kembali</button>
          <div className="flex items-center gap-3 mb-6"><div className={`w-10 h-10 ${authRole === 'recruiter' ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-xl flex items-center justify-center text-white shadow-md`}><Lock size={20}/></div><div><h3 className="text-xl font-black text-slate-800">Sign In Portal</h3><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{authRole === 'recruiter' ? 'Internal HR / Admin' : 'Kandidat Wawancara'}</p></div></div>
          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setCurrentView(authRole); setRecruiterSubView('dashboard'); showToast(`Login berhasil sebagai ${authRole === 'recruiter' ? 'Rekruter' : 'Kandidat'}`); }} className="space-y-4">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label><input type="email" defaultValue={authRole === 'recruiter' ? 'admin@integritas.com' : 'candidate@integritas.com'} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" /></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label><input type="password" defaultValue="123456" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" /></div>
            <button type="submit" className={`w-full text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-4 cursor-pointer ${authRole === 'recruiter' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>MASUK</button>
          </form>
        </div>
      </div>
    );

    const RecruiterView = () => {
      const uniqueRoles = [...new Set(candidates.map(c => c.role.split('(')[0].trim()))];
      const dashFilteredCandidates = candidates.filter(cand => {
        const baseRole = cand.role.split('(')[0].trim();
        return (dashFilterRole === 'All' || baseRole === dashFilterRole) && (dashFilterStatus === 'All' || cand.status === dashFilterStatus);
      });

      const renderAnalysisReport = (candidateData, isPDF = false) => {
         if (!candidateData) return null;
         const isRoleAdmin = candidateData.role.toLowerCase().includes('admin');
         
         const aspectData = criteriaList.map(a => {
              const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ', '');
              const candScore = candidateData.traits[key] || 0;
              const gap = candScore - (standardTraits[key] || 0);
              let status = gap >= 5 ? 'Exceeds' : (gap < 0 ? 'Needs Attention' : 'Meets Standard');
              let statusColor = gap >= 5 ? 'text-emerald-700 bg-emerald-50' : (gap < 0 ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50');
              return { aspect: a, candScore, targetScore: standardTraits[key]||0, gap, status, statusColor };
          }).sort((a, b) => b.gap - a.gap); 

         return (
           <div id={isPDF ? "hidden-pdf-content" : "pdf-content"} className={isPDF ? 'w-[794px] h-[1123px] bg-white p-10 flex flex-col justify-between font-sans box-border text-slate-800' : 'max-w-4xl mx-auto space-y-6 md:space-y-8 pb-20 bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-100'}>
              <div className={`flex justify-between items-center ${isPDF ? 'border-b border-slate-200 pb-3' : 'border-b border-slate-100 pb-6'}`}>
                <div className="flex items-center gap-4">
                  <div className={`bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg ${isPDF ? 'w-16 h-16 rounded-[18px] text-2xl' : 'w-20 h-20 rounded-[22px] text-3xl'}`}>{candidateData.score}%</div>
                  <div><h3 className={`font-black text-slate-800 leading-tight ${isPDF ? 'text-2xl' : 'text-2xl'}`}>{candidateData.name}</h3><p className="text-slate-500 font-semibold">{candidateData.role}</p></div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className={`border rounded-xl flex items-center gap-2 px-4 py-2 ${candidateData.score >= 80 ? 'bg-emerald-50 border-emerald-200' : (candidateData.score >= 65 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200')}`}>
                        <div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 ${candidateData.score >= 80 ? 'text-emerald-600' : (candidateData.score >= 65 ? 'text-amber-600' : 'text-red-600')}`}>REKOMENDASI AI</div>
                            <div className={`font-black leading-none ${candidateData.score >= 80 ? 'text-emerald-700' : (candidateData.score >= 65 ? 'text-amber-700' : 'text-red-700')}`}>{candidateData.score >= 80 ? 'HIRE' : (candidateData.score >= 65 ? 'CONSIDER' : 'REJECT')}</div>
                        </div>
                    </div>
                    {!isPDF && <button onClick={handleExportPDF} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 text-sm shadow-md"><Printer size={16}/> Cetak PDF</button>}
                </div>
              </div>
              
              <div className={`bg-indigo-50/50 rounded-2xl border border-indigo-100/50 ${isPDF ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2 text-sm"><Activity size={16} /> Ringkasan Psikologis AI</div>
                <p className={`text-slate-600 font-medium leading-relaxed ${isPDF ? 'text-xs' : 'text-sm'}`}>{isRoleAdmin ? "Kandidat memiliki ketelitian sangat baik untuk data operasional." : "Kandidat memiliki ketahanan fisik dan kepatuhan instruksi kerja solid."}</p>
              </div>

              <div className={isPDF ? 'flex-1 flex flex-col justify-center py-2' : ''}>
                  <h4 className={`font-black text-slate-800 uppercase tracking-wider mb-3 ${isPDF ? 'text-xs' : 'text-sm mb-4'}`}>KINERJA ASPEK & ANALISIS KESENJANGAN (GAP)</h4>
                  <div className={`flex ${isPDF ? 'flex-row gap-5 items-stretch h-[320px]' : 'flex-col lg:flex-row gap-6'}`}>
                      <div className={`flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white ${isPDF ? '' : 'shadow-sm'}`}>
                          <table className="w-full text-left">
                              <thead><tr className={`bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase ${isPDF ? 'text-[10px]' : 'text-xs'}`}><th className={isPDF?'p-3':'p-4'}>ASPEK</th><th className={`${isPDF?'p-3':'p-4'} text-center`}>SKOR</th><th className={`${isPDF?'p-3':'p-4'} text-center`}>GAP</th><th className={isPDF?'p-3':'p-4'}>STATUS</th></tr></thead>
                              <tbody className="divide-y divide-slate-100">
                                  {aspectData.map((d, i) => (
                                      <tr key={i}><td className={`${isPDF?'px-3 py-2 text-[11px]':'p-4 text-sm'} font-bold text-slate-800`}>{d.aspect}</td><td className={`${isPDF?'px-3 py-2 text-xs':'p-4'} text-center font-black ${d.gap>=0?'text-teal-600':'text-amber-600'}`}>{d.candScore}</td><td className={`${isPDF?'px-3 py-2 text-xs':'p-4'} text-center font-bold ${d.gap>0?'text-teal-500':(d.gap<0?'text-amber-500':'text-slate-400')}`}>{d.gap>0?`+${d.gap}`:d.gap}</td><td className={isPDF?'px-3 py-2':'p-4'}><span className={`inline-flex rounded-full font-bold ${d.statusColor} ${isPDF?'text-[10px] px-2 py-0.5':'text-xs px-2.5 py-1'}`}>{d.status}</span></td></tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                      <div className={`bg-white border border-slate-200 rounded-2xl flex items-center justify-center ${isPDF ? 'w-[280px] p-2' : 'w-full lg:w-1/3 min-h-[300px] p-4 hidden lg:flex'}`}>
                          <ResponsiveContainer width="100%" height={isPDF ? 260 : 300}>
                            <RadarChart outerRadius={isPDF ? 85 : 90} data={aspectData.map(d => ({ aspect: d.aspect, Kandidat: d.candScore/10, Standar: d.targetScore/10 }))}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="aspect" tick={{ fill: '#475569', fontSize: 9, fontWeight: 600 }} />
                              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                              <Radar name="Kandidat" dataKey="Kandidat" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} isAnimationActive={!isPDF} />
                              <Radar name="Standar" dataKey="Standar" stroke="#10b981" strokeWidth={1.5} fill="#10b981" fillOpacity={0.1} isAnimationActive={!isPDF} />
                              <Legend verticalAlign="bottom" height={15} wrapperStyle={{ fontSize: '10px' }}/>
                            </RadarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              <div className={`grid grid-cols-2 ${isPDF ? 'gap-5' : 'gap-4 md:gap-6'}`}>
                <div className={`bg-emerald-50/40 border border-emerald-100 rounded-2xl ${isPDF ? 'p-4' : 'p-6'}`}><div className="text-emerald-700 font-bold mb-3 text-[10px] uppercase tracking-wider">NILAI PLUS UTAMA</div><ul className="space-y-2.5 text-slate-700 font-medium text-xs md:text-sm"><li>Akurasi Data / Disiplin Tinggi</li><li>Manajemen Waktu Efektif</li></ul></div>
                <div className={`bg-amber-50/40 border border-amber-100 rounded-2xl ${isPDF ? 'p-4' : 'p-6'}`}><div className="text-amber-700 font-bold mb-3 text-[10px] uppercase tracking-wider">AREA PENGEMBANGAN</div><ul className="space-y-2.5 text-slate-700 font-medium text-xs md:text-sm"><li>Inisiatif Pengambilan Keputusan</li><li>Adaptasi Sistem Baru</li></ul></div>
              </div>
           </div>
         );
      };

      const AnalyticsHubView = () => {
        const filteredDone = getFilteredDoneCandidates();
        const totalPages = Math.ceil(filteredDone.length / ITEMS_PER_PAGE) || 1;
        const paginatedCandidates = filteredDone.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        const aggregateData = criteriaList.map(a => {
            const key = a === 'Emotional Intelligence' ? 'eq' : a.toLowerCase().replace(' ', '');
            let sum = 0;
            filteredDone.forEach(c => sum += (c.traits[key] || 0));
            const avg = filteredDone.length > 0 ? (sum / filteredDone.length) / 10 : 0;
            return { aspect: a, 'Rata-rata Kandidat': avg, 'Standar Posisi': (standardTraits[key] || 0) / 10 };
        });

        return (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div><h3 className="text-xl md:text-2xl font-bold text-slate-800">Analytics Hub</h3><p className="text-slate-500 text-sm">Analisis agregat dan perbandingan profil kandidat.</p></div>
              <button onClick={handleDownloadCSV} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm"><Download size={18} /> Export Filtered CSV</button>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-4 shadow-sm">
              <div className="flex items-center gap-2"><Filter size={16} className="text-slate-400"/> <span className="text-xs font-bold text-slate-500 uppercase">Filter by:</span></div>
              <select value={hubFilterScore} onChange={e => {setHubFilterScore(e.target.value); setCurrentPage(1);}} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none"><option value="All">Semua Skor</option><option value=">75">Skor &gt; 75%</option><option value="50-75">Skor 50% - 75%</option><option value="<50">Skor &lt; 50%</option></select>
              <select value={hubFilterRole} onChange={e => {setHubFilterRole(e.target.value); setCurrentPage(1);}} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none"><option value="All">Semua Posisi</option>{uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}</select>
              <input type="date" value={hubFilterDate} onChange={e => {setHubFilterDate(e.target.value); setCurrentPage(1);}} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none" />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center">
              <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider text-center">Rata-rata Kinerja Aspek (Berdasarkan Filter: {filteredDone.length} Kandidat)</h4>
              <div className="w-full h-[300px] max-w-2xl">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={aggregateData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="aspect" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar name="Rata-rata Kandidat" dataKey="Rata-rata Kandidat" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.4} />
                    <Radar name="Standar Posisi" dataKey="Standar Posisi" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} strokeDasharray="3 3"/>
                    <RechartsTooltip wrapperStyle={{fontSize: '12px'}}/>
                    <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {paginatedCandidates.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCandidates.map(cand => (
                    <div key={cand.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black mb-4 ${cand.score >= 80 ? 'bg-emerald-100 text-emerald-600' : (cand.score >= 65 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600')}`}>{cand.score}%</div>
                      <h4 className="text-lg font-bold text-slate-800 text-center">{cand.name}</h4><p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6 text-center">{cand.role}</p>
                      <button onClick={() => { setSelectedCandidate(cand); setRecruiterSubView('analyticsDetail'); }} className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-colors text-sm">Lihat Analisis PDF</button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}><ChevronLeft size={16}/> Prev</button>
                  <span className="text-sm font-bold text-slate-500">Halaman {currentPage} dari {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}>Next <ChevronRight size={16}/></button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500 font-medium">Tidak ada kandidat.</div>
            )}
          </div>
        );
      };

      return (
        <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-slate-800 font-sans">
          <div className="w-full md:w-64 bg-[#0f172a] text-slate-300 flex flex-col md:h-full shrink-0">
            <div className="p-4 md:p-6 flex items-center justify-center md:justify-start gap-3 cursor-pointer" onClick={handleLogout}><div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center"><ShieldCheck size={20} className="text-white" /></div><span className="text-xl font-bold text-white">IntegritAS</span></div>
            <div className="flex-row md:flex-col flex overflow-x-auto md:overflow-visible flex-1 px-4 py-2 md:py-6 gap-2 border-b md:border-none border-slate-800">
              <button onClick={() => setRecruiterSubView('dashboard')} className={`min-w-max flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard size={20} /><span className="font-medium text-sm md:text-base">Dashboard</span></button>
              <button onClick={() => {setRecruiterSubView('analyticsList'); setCurrentPage(1);}} className={`min-w-max flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView.includes('analytics') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><BarChart2 size={20} /><span className="font-medium text-sm md:text-base">Analytics Hub</span></button>
              <button onClick={() => setRecruiterSubView('add')} className={`min-w-max flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView === 'add' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><UserPlus size={20} /><span className="font-medium text-sm md:text-base">Add Candidate</span></button>
            </div>
            <div className="hidden md:block p-4"><button onClick={() => setRecruiterSubView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${recruiterSubView === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}><Settings size={20} /><span className="font-medium">Settings</span></button></div>
          </div>
          
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 shrink-0">
              <h2 className="text-lg md:text-2xl font-extrabold text-slate-800 flex items-center">
                {recruiterSubView === 'dashboard' && 'Overview Dashboard'}
                {recruiterSubView === 'add' && 'Add Candidate'}
                {recruiterSubView === 'settings' && 'Pengaturan Sistem'}
                {recruiterSubView === 'analyticsList' && 'Analytics Hub'}
                {recruiterSubView === 'analyticsDetail' && (<><button onClick={() => setRecruiterSubView('analyticsList')} className="mr-2"><ChevronLeft size={24} /></button>Detail Analisis</>)}
                {recruiterSubView === 'interview' && (<><button onClick={() => setRecruiterSubView('dashboard')} className="mr-2"><ChevronLeft size={24} /></button>Sesi Interview AI</>)}
              </h2>
            </header>
            
            <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 relative print:p-0 print:bg-white print:overflow-visible">
              {toast && <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50"><CheckCircle2 className="text-emerald-400" size={24} /><span className="font-medium text-sm">{toast}</span></div>}
              
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
                        <select value={dashFilterRole} onChange={e=>setDashFilterRole(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-lg px-2"><option value="All">Semua Posisi</option>{uniqueRoles.map(r=><option key={r} value={r}>{r}</option>)}</select>
                        <select value={dashFilterStatus} onChange={e=>setDashFilterStatus(e.target.value)} className="text-sm bg-white border border-slate-200 rounded-lg px-2"><option value="All">Semua Status</option><option value="WAITING">Waiting</option><option value="DONE">Done</option></select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                        <thead><tr className="text-[10px] font-bold text-slate-400 border-b bg-white"><th className="p-4">KANDIDAT</th><th className="p-4">POSISI</th><th className="p-4">ZOOM LINK</th><th className="p-4">STATUS</th><th className="p-4 text-center">AKSI</th></tr></thead>
                        <tbody>
                          {dashFilteredCandidates.map(cand => (
                            <tr key={cand.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                              <td className="p-4"><div className="font-bold text-slate-800">{cand.name}</div><div className="text-xs text-slate-500">{cand.email}</div></td>
                              <td className="p-4 text-sm font-medium text-slate-600">{cand.role}</td>
                              <td className="p-4"><a href={cand.zoomLink || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 text-xs font-bold bg-indigo-50 px-2 py-1 rounded w-max"><Link size={12}/> Join Zoom</a></td>
                              <td className="p-4">{cand.status === 'WAITING' ? <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Waiting</span> : <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Done</span>}</td>
                              <td className="p-4 flex justify-center gap-2">
                                {cand.status === 'WAITING' ? 
                                  <button onClick={() => { setSelectedCandidate(cand); setRecruiterSubView('interview'); }} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center gap-2"><Activity size={14} /> Analyze</button> :
                                  <button onClick={() => { setSelectedCandidate(cand); setRecruiterSubView('analyticsDetail'); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">Lihat Hasil</button>}
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
                      <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-2">LINK ZOOM MEETING</label><input name="zoomLink" required type="url" placeholder="https://zoom.us/j/..." className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm" /></div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-6 text-sm">SIMPAN & JADWALKAN</button>
                  </form>
                </div>
              )}

              {recruiterSubView === 'settings' && (
                 <div className="max-w-3xl mx-auto bg-white rounded-3xl border shadow-sm p-6 text-center text-slate-500 font-medium">Halaman Pengaturan Bobot.</div>
              )}

              {recruiterSubView === 'analyticsList' && <AnalyticsHubView />}
              {recruiterSubView === 'analyticsDetail' && renderAnalysisReport(selectedCandidate, false)}

              {recruiterSubView === 'interview' && selectedCandidate && (
                <div className="max-w-7xl mx-auto flex gap-6 pb-20">
                  <div className="w-1/4 bg-white rounded-3xl border shadow-sm p-4 h-fit">
                    {criteriaList.map(c => <button key={c} onClick={() => setActiveInterviewAspect(c)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm mb-2 ${ activeInterviewAspect === c ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100' }`}>{c}</button>)}
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="bg-slate-900 rounded-[32px] p-6 text-white">
                      <div className="flex justify-between text-sm font-bold mb-3 text-slate-400"><span>Progress</span><span className="text-indigo-400">{Object.keys(interviewAnswers).filter(k=>interviewAnswers[k]?.trim()!=="").length} / 9</span></div>
                      <button onClick={handleSubmitEvaluation} className={`w-full py-3 rounded-xl font-bold text-sm ${Object.keys(interviewAnswers).filter(k=>interviewAnswers[k]?.trim()!=="").length === 9 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>JALANKAN ANALISIS AI & SIMPAN</button>
                    </div>
                    <div className="bg-white rounded-3xl border p-6">
                      <div className="flex justify-between items-start mb-6"><div><h2 className="text-3xl font-black text-slate-800">{activeInterviewAspect}</h2></div><button onClick={handleGenerateAIQuestion} className="bg-purple-50 text-purple-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs"><Sparkles size={16}/> Generate AI</button></div>
                      <textarea className="w-full p-4 bg-slate-50 border rounded-2xl min-h-[200px] outline-none text-sm" placeholder="Catat jawaban di sini atau tekan Generate AI..." value={interviewAnswers[activeInterviewAspect]||''} onChange={e=>setInterviewAnswers({...interviewAnswers, [activeInterviewAspect]:e.target.value})} />
                    </div>
                  </div>
                </div>
              )}
            </main>
            <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -10 }}>{pdfCandidate && renderAnalysisReport(pdfCandidate, true)}</div>
          </div>
        </div>
      );
    };

    return (
      <>
        {currentView === 'landing' && <LandingView />}
        {currentView === 'login' && <LoginView />}
        {isLoggedIn && currentView === 'recruiter' && <RecruiterView />}
        {isLoggedIn && currentView === 'candidate' && <div className="p-10 font-bold text-center">Tampilan Kandidat</div>}
      </>
    );
}