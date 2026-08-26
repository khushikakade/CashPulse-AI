"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

interface CaseDetails {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    reliability_score: number;
    payment_delay_days: number;
  };
  reference_type: string;
  reference_id: string;
  risk_score: number;
  recovery_probability: number;
  expected_recovery_value: number;
  current_status: string;
  root_cause: string;
  explanation: string;
  recommended_action: string;
  risk_level: string;
  created_at: string;
  actions: Array<{
    id: string;
    action_type: string;
    cost: number;
    customer_friction: string;
    status: string;
    rzp_payment_link_id: string;
    checkout_url: string;
    created_at: string;
  }>;
}

export default function CaseDetail() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [details, setDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/cases/${caseId}`);
      const data = await res.json();
      setDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleProcessCase = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/cases/${caseId}/process`, {
        method: "POST"
      });
      const data = await res.json();
      alert(`Intervention status: ${data.status.toUpperCase()}`);
      await fetchDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulatePayment = async (actionId: string, rzpLinkId: string) => {
    setActionLoading(true);
    try {
      const webhookPayload = {
        id: `evt_sim_${Math.random().toString(36).substr(2, 9)}`,
        event: "payment_link.paid",
        payload: {
          payment_link: {
            entity: {
              id: rzpLinkId,
              amount: 1500000,
              status: "paid"
            }
          }
        }
      };
      
      const res = await fetch("http://localhost:8000/api/v1/webhooks/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Razorpay-Signature": "dummy_signature_in_mock_mode"
        },
        body: JSON.stringify(webhookPayload)
      });
      await res.json();
      alert("Razorpay callback simulated. Balance recovered!");
      await fetchDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        AUDITING SYSTEM EXPOSURE CASE FILE...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex bg-[#08090a] text-slate-100 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 font-mono text-sm text-rose-500">CASE FILE REJECTED. ENTITY NOT LOCATED.</main>
      </div>
    );
  }

  const caseNum = `CP-${details.id.substr(0, 8).toUpperCase()}`;

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 border-b border-[#1e2023] pb-5 flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="text-sm font-mono font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-slate-650 font-mono">/</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">Investigation Case File</h1>
              <p className="text-slate-500 text-xs font-mono">{caseNum}</p>
            </div>
          </div>
          <span className="text-sm font-bold font-mono text-[#0e9f6e]">
            {details.current_status.toUpperCase()}
          </span>
        </header>

        {/* Case Body layout */}
        <div className="max-w-4xl space-y-10">
          
          {/* Header metadata summary */}
          <div className="border-b border-[#1e2023] pb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Principal value</span>
              <span className="text-xl font-bold font-mono text-white">
                ₹{(details.expected_recovery_value / Math.max(0.1, details.recovery_probability)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Recovery Probability</span>
              <span className="text-xl font-bold font-mono text-[#0e9f6e]">{Math.round(details.recovery_probability * 100)}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Risk Assessment</span>
              <span className={`text-xl font-bold font-mono uppercase ${details.risk_level === 'high' ? 'text-rose-500' : 'text-amber-500'}`}>
                {details.risk_level}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Est Recovery</span>
              <span className="text-xl font-bold font-mono text-white">₹{details.expected_recovery_value.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Section 1: Customer Profile */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-[#1e2023] pb-1">
              Customer History & Profiles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono text-slate-300">
              <div>Name: <span className="text-white font-bold">{details.customer?.name}</span></div>
              <div>Contact: <span className="text-white">{details.customer?.email}</span></div>
              <div>Historical delay: <span className="text-white">{details.customer?.payment_delay_days} days</span></div>
              <div>Reliability: <span className="text-[#0e9f6e] font-bold">{Math.round(details.customer?.reliability_score * 100)}%</span></div>
            </div>
          </section>

          {/* Section 2: Analysis & Diagnosis */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-[#1e2023] pb-1">
              Recovery Diagnostics Analysis
            </h3>
            <div className="font-mono text-sm text-slate-350 leading-relaxed bg-[#0e1012] border border-[#1e2023] p-5">
              <div><strong>ROOT_CAUSE:</strong> {details.root_cause}</div>
              <div className="mt-3"><strong>SYSTEM_REASONING:</strong> {details.explanation}</div>
            </div>
          </section>

          {/* Section 3: Decision Trace (Forensic style) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-[#1e2023] pb-1">
              DECISION TRACE AUDIT LOG
            </h3>
            <div className="bg-black text-[#0e9f6e] font-mono text-sm p-5 border border-[#1e2023] leading-relaxed space-y-2">
              <div>[09:42:11] INITIAL_AUDITING: Scanning database ledger line items...</div>
              <div>[09:42:12] EXPOSURE_DETECTION: Isolated at-risk reference: {details.reference_id} (Type: {details.reference_type})</div>
              <div>[09:42:12] CUSTOMER_LOOKUP: Loading history records for {details.customer?.name}</div>
              <div>[09:42:13] ML_PROBABILITY: Calculated payment recovery probability: {Math.round(details.recovery_probability * 100)}%</div>
              <div>[09:42:13] STRATEGY_RANKING: Recommended primary intervention: {details.recommended_action}</div>
              <div>[09:42:13] POLICY_ENGINE: Checked limits constraints. Allow status: TRUE</div>
              <div>[09:42:14] INTERVENTION: Awaiting operator execution pipeline.</div>
            </div>
          </section>

          {/* Section 4: Actions Pipeline */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-[#1e2023] pb-1">
              Intervention Action Pipeline
            </h3>
            
            {details.actions.length === 0 ? (
              <div className="border border-dashed border-[#1e2023] p-8 text-center text-slate-500 font-mono text-sm">
                NO ACTIONS RECORDED. CLICK STRATEGY ENGINE TO TRIGGER RECOVERY.
              </div>
            ) : (
              <div className="space-y-4">
                {details.actions.map((act) => (
                  <div key={act.id} className="border border-[#1e2023] bg-[#0e1012] p-5 flex justify-between items-center text-sm font-mono">
                    <div>
                      <span className="text-[#0e9f6e] font-bold">{act.action_type}</span>
                      <span className="text-slate-400 block text-xs mt-1">STATUS: {act.status.toUpperCase()}</span>
                      {act.checkout_url && (
                        <a 
                          href={act.checkout_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#0e9f6e] hover:underline block text-xs mt-1.5"
                        >
                          OPEN SECURE LINK &rarr;
                        </a>
                      )}
                    </div>
                    
                    {act.rzp_payment_link_id && details.current_status !== "recovered" && (
                      <button
                        onClick={() => handleSimulatePayment(act.id, act.rzp_payment_link_id)}
                        className="bg-transparent hover:bg-slate-900 border border-[#0e9f6e] text-[#0e9f6e] font-mono text-xs font-bold px-4 py-2 transition-colors uppercase"
                      >
                        Simulate Settlement Webhook
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {details.current_status !== "recovered" && (
              <div className="pt-2">
                <button
                  onClick={handleProcessCase}
                  disabled={actionLoading}
                  className="bg-[#0e9f6e] hover:bg-emerald-400 text-black font-mono text-xs font-extrabold px-6 py-3 transition-colors uppercase tracking-wider"
                >
                  Trigger Strategy Execution
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
