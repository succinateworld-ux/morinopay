
import { useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, Blocks,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, Command,
  ExternalLink, Fingerprint, Gauge, LayoutDashboard, LoaderCircle,
  LockKeyhole, Menu, Search, Shield, ShieldAlert, ShieldCheck,
  Sparkles, Wallet, X, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import "./App.css";

const EXPLORER = "https://testnet.monadexplorer.com";

function StatCard({ icon: Icon, label, value, detail, tone = "violet" }) {
  return (
    <motion.article
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <p className="muted stat-label">{label}</p>
      <div className="stat-value">{value}</div>
      <p className="stat-detail">{detail}</p>
    </motion.article>
  );
}

function App() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("Overview");

  async function analyze(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!/^0x[a-fA-F0-9]{64}$/.test(hash.trim())) {
      setError("Enter a valid transaction hash containing 66 characters, beginning with 0x.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: hash.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to analyze transaction.");
      setResult(data);
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "The analysis service is not connected yet. We will connect the Monad backend next."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  const hasHighRisk = result?.risks?.some(r => r.level === "high");
  const transactionFailed = result?.status === "Failed";
  const transactionPending = result?.status === "Pending or not yet confirmed";

  const riskLevel = !result
    ? "Awaiting transaction"
    : hasHighRisk
      ? "Review required"
      : transactionFailed
        ? "Execution failed"
        : transactionPending
          ? "Pending confirmation"
          : "No high-risk indicator detected";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Shield size={22} strokeWidth={2.5} /></div>
          <div><span className="brand-name">morino<span>pay</span></span>
            <span className="brand-caption">RISK INTELLIGENCE</span></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)}><X size={18} /></button>
        </div>

        <div className="workspace">
          <div className="workspace-avatar"><Blocks size={18} /></div>
          <div className="workspace-copy"><strong>Monad Workspace</strong><span>Testnet environment</span></div>
          <ChevronDown size={15} className="muted" />
        </div>

        <div className="nav-label">WORKSPACE</div>
        {[
          [LayoutDashboard, "Overview"],
          [ShieldCheck, "Risk analysis"],
          [Activity, "Transaction history"],
          [Fingerprint, "Address intelligence"]
        ].map(([Icon, label]) => (
          <button key={label} className={`nav-item ${active === label ? "active" : ""}`}
            onClick={() => { setActive(label); setMenuOpen(false); if (label === "Risk analysis") document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" }); }}>
            <Icon size={18} /><span>{label}</span>
            {label === "Risk analysis" && <span className="nav-new">LIVE</span>}
          </button>
        ))}

        <div className="nav-label nav-label-lower">PREFERENCES</div>
        <button className="nav-item" onClick={() => alert("Morinopay settings are planned for a future version.")}><LockKeyhole size={18} /><span>Security settings</span></button>
        <button className="nav-item" onClick={() => alert("Help documentation is coming soon.")}><CircleHelp size={18} /><span>Help & documentation</span></button>

        <div className="sidebar-bottom">
          <div className="pro-card">
            <div className="pro-icon"><Sparkles size={18} /></div>
            <strong>Intelligence, with evidence.</strong>
            <p>Understand onchain signals before making a decision.</p>
          </div>
          <div className="profile">
            <div className="profile-avatar">M</div>
            <div className="profile-copy"><strong>Morinopay</strong><span>Early access</span></div>
            <button className="icon-button" title="Notifications"><Bell size={17} /></button>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)}><Menu size={20} /></button><span>Workspace</span><span className="crumb-slash">/</span><strong>{active}</strong></div>
          <div className="topbar-right"><div className="network-pill"><span className="pulse-dot" /> Monad Testnet</div><div className="topbar-divider" /><button className="icon-button" title="Search"><Search size={18} /></button><button className="help-button"><CircleHelp size={16} /> <span>Support</span></button></div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> ONCHAIN FINANCE & SECURITY</div>
              <h1>See the risk <span>before you sign.</span></h1>
              <p className="page-description">Transaction intelligence that turns onchain data into clearer decisions.</p>
            </div>
            <div className="date-chip"><Clock3 size={15} /> Live network data</div>
          </section>

          <section className="stats-grid">
            <StatCard icon={Gauge} label="NETWORK" value="Monad Testnet" detail={<><span className="status-dot" /> Network environment</>} />
            <StatCard icon={ShieldCheck} label="ANALYSIS ENGINE" value="Evidence-first" detail="Rules-based assessment" tone="blue" />
            <StatCard icon={Activity} label="SESSION ANALYSES" value={result ? "01" : "00"} detail={result ? "1 result in this session" : "No analyses yet"} tone="green" />
            <StatCard icon={Zap} label="RESPONSE STATUS" value={loading ? "Analyzing…" : result ? "Complete" : "Ready"} detail={loading ? "Retrieving onchain data" : "Ready to inspect a hash"} tone="amber" />
          </section>

          <section className="content-grid">
            <article className="panel analyzer-panel" id="analyzer">
              <div className="panel-heading">
                <div className="heading-icon"><ShieldAlert size={20} /></div>
                <div><h2>Transaction analysis</h2><p>Inspect verifiable data on Monad Testnet.</p></div>
                <span className="live-badge"><span className="pulse-dot" /> LIVE</span>
              </div>

              <form onSubmit={analyze} className="analyze-form">
                <label htmlFor="txhash">TRANSACTION HASH</label>
                <div className="input-wrap"><Search size={18} /><input id="txhash" value={hash} onChange={e => setHash(e.target.value)} placeholder="0x… paste transaction hash" autoComplete="off" spellCheck="false" /><kbd>TX</kbd></div>
                <p className="input-help">Paste a transaction hash to retrieve its onchain receipt and available signals.</p>
                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? <LoaderCircle className="spin" size={18} /> : <ShieldCheck size={18} />}
                  {loading ? "Inspecting transaction…" : "Analyze transaction"}
                  {!loading && <ArrowUpRight size={17} />}
                </button>
                {error && <div className="error-box" role="alert">{error}</div>}
              </form>

              {result && <div className="result-box">
                <div className="result-title"><CheckCircle2 size={19} /><strong>Analysis retrieved</strong><span>{result.status}</span></div>
                <div className="result-fields">
                  <div><small>TRANSACTION VALUE</small><strong>{result.valueMON} MON</strong></div>
                  <div><small>EXECUTION STATUS</small><strong>{result.status}</strong></div>
                  <div><small>BLOCK NUMBER</small><strong>{result.blockNumber ?? "Pending / unavailable"}</strong></div>
                </div>
                <div className="address-field"><small>SENDER</small><code>{result.from}</code></div>
                <div className="address-field"><small>RECIPIENT</small><code>{result.to || "Contract creation"}</code></div>
                <a className="explorer-link" href={result.explorerUrl || `${EXPLORER}/tx/${result.hash}`} target="_blank" rel="noreferrer">View on Monad Explorer <ExternalLink size={15} /></a>
                <h3 className="signals-heading">Observed signals</h3>
                {result.risks?.map((risk, index) => <div className={`signal ${risk.level}`} key={index}><strong>{risk.title}</strong><p>{risk.detail}</p></div>)}
                {result.notes?.map((note, index) => <p className="note-line" key={index}>{note}</p>)}
                <p className="fine-print">{result.disclaimer}</p>
              </div>}

              {!result && <div className="analysis-empty">
                <div className="empty-orbit"><div className="orbit-ring" /><div className="empty-shield"><ShieldCheck size={27} /></div><span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /></div>
                <strong>Your next transaction, understood.</strong>
                <p>Enter a hash to reveal transaction details and the signals available for review.</p>
              </div>}
            </article>

            <div className="right-column">
              <article className="panel risk-panel">
                <div className="panel-heading compact-heading"><div><h2>Risk overview</h2><p>Current analysis state</p></div><div className="mini-icon"><Gauge size={18} /></div></div>
                <div className="risk-visual">
                  <svg viewBox="0 0 220 132" className="gauge-svg" role="img" aria-label={result ? `Transaction assessment: ${riskLevel}` : "Risk assessment awaiting transaction"}>
                    <path d="M 27 111 A 83 83 0 0 1 193 111" fill="none" stroke="#252F46" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 27 111 A 83 83 0 0 1 193 111" fill="none" stroke="url(#gaugeGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="0 261" />
                    <defs><linearGradient id="gaugeGradient"><stop offset="0%" stopColor="#6D7CFF" /><stop offset="100%" stopColor="#A98CFF" /></linearGradient></defs>
                  </svg>
                  <div className="gauge-center"><span className="gauge-number">{result ? (hasHighRisk ? "!" : transactionFailed ? "×" : result ? "?" : "—") : "—"}</span><span className="gauge-caption">{result ? riskLevel : "AWAITING DATA"}</span></div>
                </div>
                <div className="risk-footnote"><ShieldCheck size={16} /><span>{result ? "Review the observed signals below." : "No score until a transaction is inspected."}</span></div>
                <div className="risk-legend"><span><i className="legend-dot purple" /> Observed data</span><span><i className="legend-dot grey" /> Unknown signals</span></div>
              </article>

              <article className="panel signal-panel">
                <div className="panel-heading compact-heading"><div><h2>What we examine</h2><p>Evidence, not assumptions</p></div></div>
                {[
                  [CheckCircle2, "Execution outcome", "Receipt status, when available", "green"],
                  [Blocks, "Recipient context", "Wallet address or contract bytecode", "blue"],
                  [Activity, "Value movement", "Native token amount and transaction state", "violet"],
                ].map(([Icon, title, description, tone]) => <div className="check-row" key={title}><div className={`check-icon ${tone}`}><Icon size={17} /></div><div><strong>{title}</strong><p>{description}</p></div></div>)}
                <div className="scope-note"><LockKeyhole size={16} /><p>These checks do not prove that a wallet or contract is safe. More advanced threat intelligence is a future capability.</p></div>
              </article>
            </div>
          </section>

          <section className="bottom-banner"><div className="banner-symbol"><Command size={21} /></div><div><strong>Clarity for every onchain decision.</strong><p>Understand the evidence. Investigate the unknowns. Stay in control.</p></div><div className="banner-right"><span className="status-dot" /> <span>Monad Testnet</span></div></section>
          <footer className="page-footer"><span>© 2026 Morinopay · Early access</span><span>Built for clearer onchain decisions <span className="footer-star">✳</span></span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
