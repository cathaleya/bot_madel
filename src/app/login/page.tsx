"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Menghindari timeout saat build di VPS
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [campus, setCampus] = useState("");
  const [loginType, setLoginType] = useState<"student" | "admin">("student");
  const [gender, setGender] = useState<string>("");
  const [origin, setOrigin] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState<string>("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      if (loginType === "student") {
        if (!name || !gender || !campus || !origin || !specialNeeds) {
           setError("Mohon lengkapi semua data identitas!");
           setIsLoading(false);
           return;
        }
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, campus, gender, origin, specialNeeds })
        });
        if (res.ok) {
           const data = await res.json();
           localStorage.setItem("userId", data.userId);
           localStorage.setItem("userName", name);
           localStorage.setItem("userGender", gender);
           localStorage.setItem("userCampus", campus);
           localStorage.setItem("userOrigin", origin);
           localStorage.setItem("userSpecialNeeds", specialNeeds);
           router.push("/dashboard");
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || "Gagal terhubung.");
          setIsLoading(false);
        }
      } else {
        if (!adminUsername || !adminPassword) {
          setError("Masukkan username dan password.");
          setIsLoading(false);
          return;
        }
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: adminUsername, password: adminPassword })
        });
        if (res.ok) {
          localStorage.setItem("userName", "Administrator");
          localStorage.setItem("isAdmin", "true");
          router.push("/admin");
        } else {
          setError("Akses ditolak.");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error(error);
      setError("Kesalahan jaringan.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative"
         style={{ backgroundImage: "url('/unj_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      <div className="w-full max-w-sm md:max-w-md px-4 relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-xl border border-slate-200">
            <i className="fa-solid fa-graduation-cap text-[#4B5320] text-3xl md:text-4xl"></i>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase italic">HDAP Portal</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200">
          <div className="flex bg-slate-50 p-1 rounded-xl mb-6 border">
            <button onClick={() => setLoginType("student")} 
                    className={`flex-1 py-2 md:py-2.5 text-[9px] md:text-xs font-black uppercase rounded-lg transition-all ${loginType === "student" ? "bg-[#4B5320] text-white shadow-md" : "text-slate-400"}`}>
              RESPONDEN
            </button>
            <button onClick={() => setLoginType("admin")} 
                    className={`flex-1 py-2 md:py-2.5 text-[9px] md:text-xs font-black uppercase rounded-lg transition-all ${loginType === "admin" ? "bg-[#4B5320] text-white shadow-md" : "text-slate-400"}`}>
              ADMIN
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginType === "student" ? (
              <div className="space-y-3">
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Lengkap" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 md:py-3.5 px-4 text-xs md:text-sm text-slate-900 font-bold focus:border-[#4B5320] outline-none transition-all" />
                <input type="text" required value={campus} onChange={e => setCampus(e.target.value)} placeholder="Nama Kampus" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 md:py-3.5 px-4 text-xs md:text-sm text-slate-900 font-bold focus:border-[#4B5320] outline-none transition-all" />
                <input type="text" required value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Asal LPTK / Daerah (e.g. Jawa, Bali, Sumatera)" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 md:py-3.5 px-4 text-xs md:text-sm text-slate-900 font-bold focus:border-[#4B5320] outline-none transition-all" />
                <div className="space-y-1">
                  <label className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-wider block ml-1">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setGender("male")} className={`py-3 md:py-3.5 rounded-lg border-2 text-[9px] md:text-xs font-black transition-all ${gender === "male" ? "bg-[#4B5320] text-white" : "bg-white text-slate-400"}`}>LAKI-LAKI</button>
                    <button type="button" onClick={() => setGender("female")} className={`py-3 md:py-3.5 rounded-lg border-2 text-[9px] md:text-xs font-black transition-all ${gender === "female" ? "bg-[#4B5320] text-white" : "bg-white text-slate-400"}`}>PEREMPUAN</button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-wider block ml-1">Berkebutuhan Khusus?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setSpecialNeeds("ya")} className={`py-3 md:py-3.5 rounded-lg border-2 text-[9px] md:text-xs font-black transition-all ${specialNeeds === "ya" ? "bg-[#4B5320] text-white" : "bg-white text-slate-400"}`}>YA</button>
                    <button type="button" onClick={() => setSpecialNeeds("tidak")} className={`py-3 md:py-3.5 rounded-lg border-2 text-[9px] md:text-xs font-black transition-all ${specialNeeds === "tidak" ? "bg-[#4B5320] text-white" : "bg-white text-slate-400"}`}>TIDAK</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" required value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="Username" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 md:py-3.5 px-4 text-xs md:text-sm text-slate-900 font-bold focus:border-[#4B5320] outline-none transition-all" />
                <input type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 md:py-3.5 px-4 text-xs md:text-sm text-slate-900 font-bold focus:border-[#4B5320] outline-none transition-all" />
              </div>
            )}
            {error && <div className="p-2 text-rose-500 text-[10px] md:text-xs font-black text-center">{error}</div>}
            <button type="submit" disabled={isLoading} className="w-full font-black py-4 md:py-4.5 rounded-xl bg-[#4B5320] text-white shadow-lg uppercase text-[10px] md:text-xs tracking-widest mt-4">
              {isLoading ? "PROSES..." : "MASUK"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
