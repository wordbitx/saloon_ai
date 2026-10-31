"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Save, Plus, Trash2, Send, Sparkles, ArrowRight, Info, Store, Clock3, Scissors, Users2, Star } from "lucide-react";
import {RippleButton, Switch, cn} from "@/components/ui";
import { useAdmin } from "@/components/dash/admin";
import { WEEKDAYS } from "@/lib/utils";

interface ServiceRow {
  name: string;
  pricePkr: number;
  durationMins: number;
  category: string;
}
interface StaffRow {
  name: string;
  specialty: string;
}

interface FormState {
  name: string;
  area: string;
  greeting: string;
  openTime: string;
  closeTime: string;
  closedDays: string[];
  repeatEnabled: boolean;
  reviewUrl: string;
  branches: string;
  services: ServiceRow[];
  staff: StaffRow[];
}

const EMPTY: FormState = {
  name: "",
  area: "",
  greeting: "",
  openTime: "11:00",
  closeTime: "20:00",
  closedDays: [],
  repeatEnabled: true,
  reviewUrl: "",
  branches: "",
  services: [],
  staff: [],
};

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [testLog, setTestLog] = useState<{ q: string; a: string }[]>([]);
  const { admin } = useAdmin();

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setForm({
        name: d.salon.name,
        area: d.salon.area,
        greeting: d.salon.greeting,
        openTime: d.salon.openTime,
        closeTime: d.salon.closeTime,
        closedDays: d.salon.closedDays ?? [],
        repeatEnabled: d.salon.repeatEnabled,
        reviewUrl: d.salon.reviewUrl ?? "",
        branches: (d.salon.branches ?? []).join(", "),
        services: d.services.map((s: ServiceRow) => ({ name: s.name, pricePkr: s.pricePkr, durationMins: s.durationMins, category: s.category })),
        staff: d.staff.map((s: StaffRow) => ({ name: s.name, specialty: s.specialty })),
      });
      setLoaded(true);
    })();
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    if (!admin) {
      showToast("View mode — changes salon ke staff console se hote hain.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          reviewUrl: form.reviewUrl.trim() || null,
          branches: form.branches.split(",").map((b) => b.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setDirty(false);
        showToast("Settings save ✓ — chat aur dashboard ab naye jawab denge");
      } else {
        showToast("Save nahi hua — dobara koshish karein");
      }
    } finally {
      setSaving(false);
    }
  };

  const runTest = useCallback(
    async (q: string) => {
      const question = q.trim();
      if (!question || testBusy) return;
      setTestInput("");
      setTestBusy(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question, state: { step: "idle" } }),
        });
        if (res.ok) {
          const d = await res.json();
          const answer = (d.messages as { text: string }[]).map((m) => m.text).join("\n");
          setTestLog((prev) => [{ q: question, a: answer }, ...prev].slice(0, 4));
        }
      } finally {
        setTestBusy(false);
      }
    },
    [testBusy],
  );

  const toggleDay = (day: string) => {
    set("closedDays", form.closedDays.includes(day) ? form.closedDays.filter((d) => d !== day) : [...form.closedDays, day]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold sm:text-3xl">Salon Settings</h1>
          </div>
          <p className="mt-1 text-[13px] text-mut">
            Jo yahan badlenga, chat aur dashboard <b className="text-ink">usi waqt</b> wohi bolega.
          </p>
        </div>
        <RippleButton onClick={save} disabled={!loaded || saving || !dirty}>
          <Save size={15} /> {saving ? "Save ho raha hai…" : dirty ? "Settings save karein" : "Sab save hai ✓"}
        </RippleButton>
      </div>


      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-5">
          {/* Salon info */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold"><Store size={15} className="text-accent" /> Salon info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="s-name">Salon ka naam</label>
                <input id="s-name" className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Elan Beauty" />
              </div>
              <div>
                <label className="label" htmlFor="s-area">Area / Location</label>
                <input id="s-area" className="input" value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="DHA Phase 5, Lahore" />
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="s-greet">Greeting message (chat ka pehla jawab)</label>
              <textarea id="s-greet" className="input min-h-[80px]" value={form.greeting} onChange={(e) => set("greeting", e.target.value)} />
            </div>
          </section>

          {/* Timings */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold"><Clock3 size={15} className="text-accent" /> Timing aur band din</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="s-open">Khulne ka waqt</label>
                <input id="s-open" type="time" className="input" value={form.openTime} onChange={(e) => set("openTime", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="s-close">Band hone ka waqt</label>
                <input id="s-close" type="time" className="input" value={form.closeTime} onChange={(e) => set("closeTime", e.target.value)} />
              </div>
            </div>
            <p className="label mt-4">Band din (slots in din offer nahi honge)</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={form.closedDays.includes(d)}
                  onClick={() => toggleDay(d)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11.5px] font-bold transition-colors",
                    form.closedDays.includes(d) ? "border-brand bg-brand text-white" : "border-line bg-raised text-mut hover:text-ink",
                  )}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </section>

          {/* Services */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[13px] font-extrabold"><Scissors size={15} className="text-accent" /> Services + prices (PKR)</h2>
              <button
                type="button"
                onClick={() => set("services", [...form.services, { name: "", pricePkr: 1000, durationMins: 45, category: "regular" }])}
                className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2.5 py-1.5 text-[11px] font-extrabold text-accent hover:bg-brand hover:text-white"
              >
                <Plus size={12} /> Nayi service
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              <div className="hidden grid-cols-[1.4fr_0.7fr_0.6fr_0.8fr_36px] gap-2 px-1 text-[9.5px] font-extrabold uppercase tracking-wider text-mut sm:grid">
                <span>Naam</span><span>Price (Rs)</span><span>Min</span><span>Type</span><span />
              </div>
              {form.services.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-raised p-2 sm:grid-cols-[1.4fr_0.7fr_0.6fr_0.8fr_36px] sm:border-0 sm:bg-transparent sm:p-0">
                  <input className="input col-span-2 sm:col-span-1" value={s.name} placeholder="Service naam" onChange={(e) => set("services", form.services.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input className="input" type="number" min={0} value={s.pricePkr} onChange={(e) => set("services", form.services.map((x, j) => (j === i ? { ...x, pricePkr: Number(e.target.value) } : x)))} />
                  <input className="input" type="number" min={10} value={s.durationMins} onChange={(e) => set("services", form.services.map((x, j) => (j === i ? { ...x, durationMins: Number(e.target.value) } : x)))} />
                  <select className="input" value={s.category} onChange={(e) => set("services", form.services.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}>
                    <option value="regular">Regular</option>
                    <option value="bridal">Bridal</option>
                    <option value="addon">Add-on / Upsell</option>
                  </select>
                  <button
                    type="button"
                    aria-label={`${s.name || "Service"} delete karein`}
                    onClick={() => set("services", form.services.filter((_, j) => j !== i))}
                    className="grid h-9 w-9 place-items-center self-center rounded-lg border border-line text-mut transition-colors hover:border-red-400 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {loaded && form.services.length === 0 && <p className="text-[12px] text-mut">Koi service nahi — chat rates nahi bata sakega. Kam az kam aik add karein.</p>}
            </div>
          </section>

          {/* Staff */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[13px] font-extrabold"><Users2 size={15} className="text-accent" /> Staff (staff-wise booking)</h2>
              <button
                type="button"
                onClick={() => set("staff", [...form.staff, { name: "", specialty: "Stylist" }])}
                className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2.5 py-1.5 text-[11px] font-extrabold text-accent hover:bg-brand hover:text-white"
              >
                <Plus size={12} /> Naya staff
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {form.staff.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2">
                  <input className="input" value={s.name} placeholder="Naam (e.g. Hina)" onChange={(e) => set("staff", form.staff.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input className="input" value={s.specialty} placeholder="Specialty" onChange={(e) => set("staff", form.staff.map((x, j) => (j === i ? { ...x, specialty: e.target.value } : x)))} />
                  <button
                    type="button"
                    aria-label={`${s.name || "Staff"} delete karein`}
                    onClick={() => set("staff", form.staff.filter((_, j) => j !== i))}
                    className="grid h-9 w-9 place-items-center self-center rounded-lg border border-line text-mut transition-colors hover:border-red-400 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Extras */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold"><Star size={15} className="text-accent" /> Reviews, repeat customers, branches</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="label" htmlFor="s-review">Google review URL</label>
                <input id="s-review" className="input" value={form.reviewUrl} onChange={(e) => set("reviewUrl", e.target.value)} placeholder="TODO (owner decision): apna Google review link paste karein" />
                <p className="mt-1 text-[10.5px] text-mut">Khali chhorne par demo placeholder jata hai — koi jhoota link invent nahi hota.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-line bg-raised px-3.5 py-3">
                <div>
                  <p className="text-[12.5px] font-bold">Repeat customer pehchan</p>
                  <p className="text-[11px] text-mut">&ldquo;Last time aap ne Balayage karwaya tha…&rdquo;</p>
                </div>
                <Switch checked={form.repeatEnabled} onChange={(v) => set("repeatEnabled", v)} label="Repeat customer pehchan" />
              </div>
              <div>
                <label className="label" htmlFor="s-branches">Branches (comma se alag — Business plan)</label>
                <input id="s-branches" className="input" value={form.branches} onChange={(e) => set("branches", e.target.value)} placeholder="DHA Phase 5, Johar Town" />
              </div>
            </div>
          </section>
        </div>

        {/* Quick test */}
        <div className="grid content-start gap-4 lg:sticky lg:top-24 lg:self-start">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold">
              <Sparkles size={15} className="text-accent" /> Quick test — live asar dekhein
            </h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-mut">
              Save karein, phir yahan poochein — jawab <b className="text-ink">DB se, isi waqt</b> banta hai.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[`${form.services[0]?.name ?? "Facial"} ka rate?`, "Timing kya hai?", "Salam"].map((q) => (
                <button key={q} type="button" onClick={() => runTest(q)} disabled={testBusy} className="rounded-full border border-brand/50 bg-brand-soft px-2.5 py-1 text-[10.5px] font-bold text-accent hover:bg-brand hover:text-white disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="input !rounded-full"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runTest(testInput)}
                placeholder='e.g. "balayage kitne ka hai?"'
                aria-label="Quick test message"
              />
              <button type="button" onClick={() => runTest(testInput)} disabled={testBusy || !testInput.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white disabled:opacity-50" aria-label="Test bhejein">
                <Send size={14} />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {testLog.map((t, i) => (
                <div key={i} className="rounded-lg border border-line bg-raised p-3">
                  <p className="text-[11px] font-bold text-mut">Aap: {t.q}</p>
                  <p className="mt-1.5 whitespace-pre-line text-[12px] leading-relaxed">{testBusy && i === 0 ? "…" : t.a}</p>
                </div>
              ))}
              {testLog.length === 0 && <p className="text-[11px] text-mut">Abhi koi test nahi — chip dabayein ya likhein.</p>}
            </div>
          </section>

          <section className="card p-5">
            <p className="flex items-center gap-2 text-[12px] font-extrabold"><Info size={14} className="text-accent" /> Kya-kya badalta hai</p>
            <ul className="mt-3 grid gap-2 text-[11.5px] leading-relaxed text-mut">
              <li>• Greeting → chat ka pehla jawab</li>
              <li>• Services/prices → rate jawab + booking options</li>
              <li>• Timing/band din → slot options + timing jawab</li>
              <li>• Staff → &ldquo;Hina se booking&rdquo; ka jawab</li>
              <li>• Review URL → review request ka link</li>
              <li>• Branches → subah ki brief (dashboard)</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link href="/demo" className="btn-brand flex-1 !py-2 text-xs">Demo chat <ArrowRight size={12} /></Link>
              <Link href="/dashboard" className="btn-ghost flex-1 !py-2 text-xs">Dashboard <ArrowRight size={12} /></Link>
            </div>
          </section>
        </div>
      </div>

      {toast && (
        <div className="toast-in fixed bottom-5 left-1/2 z-[90] w-max max-w-[90vw] -translate-x-1/2 rounded-lg border border-brand bg-card px-4 py-2.5 text-[12.5px] font-bold">
          {toast}
        </div>
      )}
    </div>
  );
}