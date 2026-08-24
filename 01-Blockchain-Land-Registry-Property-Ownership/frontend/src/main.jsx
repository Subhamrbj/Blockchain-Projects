import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserProvider, Contract, JsonRpcProvider, sha256, toUtf8Bytes, isAddress } from "ethers";
import { LAND_REGISTRY_ABI, STATUS } from "./abi";
import { CONFIG, DEMO_ACCOUNTS } from "./config";
import "./style.css";

const short = (value = "") => value ? `${value.slice(0, 8)}…${value.slice(-6)}` : "—";
const date = (seconds) => seconds && Number(seconds) ? new Date(Number(seconds) * 1000).toLocaleString() : "—";
const statusName = (n) => STATUS[Number(n)] ?? "UNKNOWN";
const walletName = (address = "") => { const match = DEMO_ACCOUNTS.find((a) => a.address.toLowerCase() === String(address).toLowerCase()); return match?.role || (address ? "External wallet" : "—"); };
const walletLabel = (address = "") => address ? `${walletName(address)} • ${short(address)}` : "—";
const friendlyError = (error) => {
  const text = error?.shortMessage || error?.reason || error?.message || "Transaction failed";
  if (text.includes("user rejected")) return "Transaction rejected in wallet.";
  const match = text.match(/reverted with reason string '([^']+)'/);
  return match?.[1] || text.split("\n")[0];
};

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [mode, setMode] = useState("demo");
  const [role, setRole] = useState(3);
  const [networkOk, setNetworkOk] = useState(false);
  const [propertyId, setPropertyId] = useState("1");
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [ownerProperties, setOwnerProperties] = useState([]);
  const [newOwner, setNewOwner] = useState(DEMO_ACCOUNTS[4].address);
  const [registerForm, setRegisterForm] = useState({ id: "2", number: "P002", location: "Kalyani Demo Zone", area: "1500", type: "Residential", owner: DEMO_ACCOUNTS[3].address, document: "property-002" });
  const [hashInput, setHashInput] = useState("property-001");
  const [hashResult, setHashResult] = useState("");
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  const readContract = useMemo(() => provider ? new Contract(CONFIG.contractAddress, LAND_REGISTRY_ABI, provider) : null, [provider]);
  const writeContract = useMemo(() => signer ? new Contract(CONFIG.contractAddress, LAND_REGISTRY_ABI, signer) : null, [signer]);

  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  async function setupDemo() {
    try {
      const p = new JsonRpcProvider(CONFIG.rpcUrl);
      const network = await p.getNetwork();
      if (Number(network.chainId) !== CONFIG.chainId) throw new Error(`Expected local chain 31337, got ${network.chainId}`);
      const s = await p.getSigner(role);
      const address = await s.getAddress();
      setProvider(p); setSigner(s); setAccount(address); setMode("demo"); setNetworkOk(true);
      notify("success", `Demo wallet connected as ${DEMO_ACCOUNTS[role].role}.`);
    } catch (e) {
      setNetworkOk(false); notify("error", `Start the Hardhat node first. ${friendlyError(e)}`);
    }
  }

  async function connectMetaMask() {
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      const p = new BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts", []);
      const network = await p.getNetwork();
      if (Number(network.chainId) !== CONFIG.chainId) {
        throw new Error("MetaMask must be connected to Hardhat Local (chain 31337).");
      }
      const s = await p.getSigner();
      setProvider(p); setSigner(s); setAccount(await s.getAddress()); setMode("metamask"); setNetworkOk(true);
      notify("success", "MetaMask connected to the local blockchain.");
    } catch (e) { notify("error", friendlyError(e)); }
  }

  async function loadProperty(id = propertyId) {
    try {
      if (!readContract) throw new Error("Connect a wallet / local node first.");
      const p = await readContract.getProperty(id);
      const h = await readContract.getOwnershipHistory(id);
      setProperty(p); setHistory(h);
      const ids = await readContract.getPropertiesByOwner(p.currentOwner);
      setOwnerProperties(ids.map(Number));
      notify("success", `Property ${p.propertyNumber} loaded from the blockchain.`);
    } catch (e) { setProperty(null); setHistory([]); notify("error", friendlyError(e)); }
  }

  async function verify() {
    if (!writeContract) return notify("error", "Connect as the Surveyor role first.");
    try {
      setBusy(true); const tx = await writeContract.verifyProperty(propertyId); notify("info", `Verification submitted: ${short(tx.hash)}`); await tx.wait();
      notify("success", "Property verified on-chain."); await loadProperty();
    } catch (e) { notify("error", friendlyError(e)); } finally { setBusy(false); }
  }

  async function transfer() {
    if (!writeContract) return notify("error", "Connect as the current owner first.");
    if (!isAddress(newOwner)) return notify("error", "Enter a valid Ethereum wallet address.");
    try {
      setBusy(true); const tx = await writeContract.transferOwnership(propertyId, newOwner); notify("info", `Transfer submitted: ${short(tx.hash)}`); await tx.wait();
      notify("success", "Ownership transferred successfully."); await loadProperty();
    } catch (e) { notify("error", friendlyError(e)); } finally { setBusy(false); }
  }

  async function register() {
    if (!writeContract) return notify("error", "Connect as the Registrar role first.");
    if (!isAddress(registerForm.owner)) return notify("error", "Initial owner address is invalid.");
    try {
      setBusy(true);
      const hash = sha256(toUtf8Bytes(registerForm.document));
      const tx = await writeContract.registerProperty(Number(registerForm.id), registerForm.number, registerForm.location, Number(registerForm.area), registerForm.type, registerForm.owner, hash);
      notify("info", `Registration submitted: ${short(tx.hash)}`); await tx.wait();
      notify("success", `Property ${registerForm.number} registered.`); setPropertyId(registerForm.id); await loadProperty(registerForm.id);
    } catch (e) { notify("error", friendlyError(e)); } finally { setBusy(false); }
  }

  async function refreshEvents() {
    try {
      if (!readContract) return;
      const latest = await provider.getBlockNumber();
      const from = Math.max(0, latest - 5000);
      const filters = [
        readContract.filters.PropertyRegistered(), readContract.filters.PropertyVerified(), readContract.filters.OwnershipTransferred(), readContract.filters.PropertyStatusUpdated()
      ];
      const all = [];
      for (const filter of filters) {
        const logs = await readContract.queryFilter(filter, from, latest);
        logs.forEach((log) => all.push({ block: log.blockNumber, tx: log.transactionHash, name: log.fragment?.name || "Event", args: log.args }));
      }
      all.sort((a,b) => b.block - a.block);
      setEvents(all.slice(0, 12));
    } catch (e) { notify("error", `Could not load event history: ${friendlyError(e)}`); }
  }

  useEffect(() => { setupDemo(); }, [role]);
  useEffect(() => { if (provider) { loadProperty(propertyId); refreshEvents(); } }, [provider]);
  useEffect(() => { if (activeView === "activity") refreshEvents(); }, [activeView]);

  const connectedRole = DEMO_ACCOUNTS.find(a => a.address.toLowerCase() === account.toLowerCase())?.role || (mode === "metamask" ? "MetaMask Account" : "Unknown");
  const verified = property?.[8];
  const status = property ? statusName(property[9]) : "—";
  const stats = [
    ["Registry", networkOk ? "LOCAL • 31337" : "OFFLINE", "Blockchain connection"],
    ["Property", property ? property[1] : "P001", property ? `${property[3].toString()} sq ft` : "Sample record"],
    ["Verification", verified ? "VERIFIED" : "PENDING", "On-chain status"],
    ["Ownership", property ? walletName(property[5]) : "—", property ? short(property[5]) : "Current owner"],
  ];

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">LR</div><div><strong>LandChain Registry</strong><span>Blockchain Property Records</span></div></div>
      <div className="top-actions"><span className={`network-pill ${networkOk ? "online" : "offline"}`}><i/> {networkOk ? "Local blockchain online" : "Node offline"}</span><button className="ghost" onClick={connectMetaMask}>Connect MetaMask</button></div>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <div className="demo-card"><div className="eyebrow">DEMO ENVIRONMENT</div><select value={role} onChange={e => setRole(Number(e.target.value))}>{DEMO_ACCOUNTS.map(a => <option key={a.index} value={a.index}>{a.role}</option>)}</select><button className="primary full" onClick={setupDemo}>Connect Demo Wallet</button><div className="account-line">{short(account)}</div></div>
        <nav>
          {[['dashboard','Overview'],['registration','Property Registration'],['verification','Property Verification'],['activity','Blockchain Activity'],['security','Security & Integrity']].map(([key,label]) => <button key={key} className={activeView===key?'nav active':'nav'} onClick={()=>setActiveView(key)}><span>{key==='dashboard'?'◈':key==='verification'?'✓':key==='registration'?'+':key==='activity'?'◷':'◌'}</span>{label}</button>)}
        </nav>
        <div className="sidebar-note"><b>Educational prototype</b><p>All property records are synthetic. This demo does not establish legal ownership.</p></div>
      </aside>

      <main className="content">
        <section className="hero"><div><div className="eyebrow">TRUSTED DIGITAL REGISTRY • WEB3 DEMO</div><h1>Property ownership,<br/><em>made auditable.</em></h1><p>Register, verify and transfer synthetic property records with Solidity smart contracts and an on-chain audit trail.</p></div><div className="hero-badge"><span>Smart Contract</span><b>{short(CONFIG.contractAddress)}</b><small>Hardhat Local • Chain 31337</small></div></section>

        <div className="stats">{stats.map(([a,b,c])=><div className="stat" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div>

        {activeView === 'dashboard' && <>
          <section className="grid-2">
            <div className="panel"><div className="panel-head"><div><div className="eyebrow">LIVE RECORD</div><h2>Property P001</h2></div><span className={`status ${verified?'good':''}`}>{status}</span></div><div className="property-grid">
              <Info label="Property Number" value={property?.[1] || 'P001'} /><Info label="Location" value={property?.[2] || 'Bardhaman Demo Zone'} /><Info label="Area" value={property ? `${property[3]} sq ft` : '1200 sq ft'} /><Info label="Type" value={property?.[4] || 'Residential'} /><Info label="Registered" value={date(property?.[10])} /><Info label="Last Transfer" value={date(property?.[11])} />
            </div><button className="secondary" onClick={()=>{setActiveView('verification');loadProperty('1')}}>Open full record →</button></div>
            <div className="panel"><div className="panel-head"><div><div className="eyebrow">LIFECYCLE</div><h2>Ownership journey</h2></div></div><Timeline verified={verified} transferred={Number(property?.[9])===3} history={history}/></div>
          </section>
          <section className="panel"><div className="panel-head"><div><div className="eyebrow">QUICK ACTIONS</div><h2>Run the workflow</h2></div></div><div className="actions-grid"><Action title="1. Look up" text="Read property state directly from the blockchain." onClick={()=>{setActiveView('verification');loadProperty('1')}}/><Action title="2. Verify" text="Use the Surveyor demo wallet to verify P001." onClick={()=>{setRole(2);setActiveView('verification')}}/><Action title="3. Transfer" text="Use Owner A to transfer the verified title to Buyer B." onClick={()=>{setRole(3);setActiveView('verification')}}/><Action title="4. Audit" text="Inspect emitted events and transaction hashes." onClick={()=>setActiveView('activity')}/></div></section>
        </>}

        {activeView === 'verification' && <>
          <section className="panel"><div className="panel-head"><div><div className="eyebrow">PROPERTY SEARCH</div><h2>Verify a property record</h2></div></div><div className="search-row"><input value={propertyId} onChange={e=>setPropertyId(e.target.value)} /><button className="primary" onClick={()=>loadProperty()}>Lookup Property</button></div></section>
          {property && <section className="grid-2"><div className="panel"><div className="panel-head"><div><div className="eyebrow">ON-CHAIN DATA</div><h2>{property[1]}</h2></div><span className={`status ${verified?'good':''}`}>{status}</span></div><div className="property-grid detailed"><Info label="Property ID" value={property[0].toString()}/><Info label="Location" value={property[2]}/><Info label="Area" value={`${property[3]} sq ft`}/><Info label="Property Type" value={property[4]}/><Info label="Current Owner" value={walletLabel(property[5])} mono/><Info label="Previous Owner" value={property[6] ? walletLabel(property[6]) : "None — initial owner"} mono/><Info label="Document SHA-256" value={property[7]} mono/><Info label="Verified" value={property[8]?'Yes':'No'}/></div><div className="button-row"><button className="primary" disabled={busy || connectedRole !== 'Surveyor'} onClick={verify}>✓ Verify Property</button><span className="role-hint">Current role: <b>{connectedRole}</b></span></div></div><div className="panel"><div className="panel-head"><div><div className="eyebrow">OWNERSHIP</div><h2>Transfer title</h2></div></div><p className="muted">Only the current owner can transfer a verified property.</p><label>New owner wallet</label><input value={newOwner} onChange={e=>setNewOwner(e.target.value)} placeholder="0x…"/><button className="primary full" disabled={busy || connectedRole !== 'Owner A' && account.toLowerCase() !== String(property[5]).toLowerCase()} onClick={transfer}>Transfer Ownership</button><div className="security-callout">🔐 Contract check: owner + verified + non-disputed</div></div></section>}
          {property && <section className="panel"><div className="panel-head"><div><div className="eyebrow">AUDIT TRAIL</div><h2>Ownership history</h2></div></div><div className="history">{history.map((addr,i)=><div className="history-item" key={addr+i}><span className="history-dot">{i+1}</span><div><b>{i===0?'Initial owner':'New owner'}</b><p className="owner-name">{walletName(addr)}</p><p>{addr}</p></div><span>{i===history.length-1?'Current':'Previous'}</span></div>)}</div></section>}
        </>}

        {activeView === 'registration' && <section className="panel"><div className="panel-head"><div><div className="eyebrow">REGISTRAR WORKFLOW</div><h2>Register synthetic property</h2><p className="muted">Connect with the Registrar demo wallet. A document hash is generated automatically.</p></div></div><div className="form-grid">{[['id','Property ID'],['number','Property Number'],['location','Location'],['area','Area (sq ft)'],['type','Property Type'],['owner','Initial Owner']].map(([k,l])=><div key={k}><label>{l}</label><input value={registerForm[k]} onChange={e=>setRegisterForm({...registerForm,[k]:e.target.value})}/></div>)}</div><div className="hash-preview"><span>Document hash preview</span><code>{sha256(toUtf8Bytes(registerForm.document))}</code></div><button className="primary" disabled={busy || connectedRole !== 'Registrar'} onClick={register}>Register Property On-Chain</button><span className="role-hint">Current role: <b>{connectedRole}</b></span></section>}

        {activeView === 'activity' && <section className="panel"><div className="panel-head"><div><div className="eyebrow">EVENT INDEX</div><h2>Blockchain activity</h2><p className="muted">Recent smart-contract events from the local Hardhat chain.</p></div><button className="secondary" onClick={refreshEvents}>Refresh</button></div><div className="event-list">{events.length ? events.map((e,i)=><div className="event" key={i}><div className="event-icon">{e.name==='OwnershipTransferred'?'↔':e.name==='PropertyVerified'?'✓':e.name==='PropertyRegistered'?'＋':'◈'}</div><div><b>{e.name}</b><p>Block {e.block} • TX {short(e.tx)}</p></div><span className="event-chip">ON-CHAIN</span></div>) : <Empty text="No recent events found. Run the deployment/simulation first."/>}</div></section>}

        {activeView === 'security' && <section className="grid-2"><div className="panel"><div className="eyebrow">INTEGRITY DEMO</div><h2>Document hash verifier</h2><p className="muted">Change even one character and the cryptographic fingerprint changes completely.</p><input value={hashInput} onChange={e=>setHashInput(e.target.value)}/><button className="primary" onClick={()=>setHashResult(sha256(toUtf8Bytes(hashInput)))}>Generate Hash</button>{hashResult && <div className="hash-box"><span>SHA-256</span><code>{hashResult}</code></div>}</div><div className="panel"><div className="eyebrow">SECURITY PROOF</div><h2>Old-owner protection</h2><p className="muted">The contract checks <code>msg.sender</code> against the current owner before every transfer.</p><div className="proof-list"><div>✓ Unauthorized registration blocked</div><div>✓ Unverified transfer blocked</div><div>✓ Non-owner transfer blocked</div><div>✓ Zero-address owner blocked</div><div>✓ Disputed property transfer blocked</div><div>✓ Duplicate property ID blocked</div></div></div></section>}

        <footer><span>LandChain Registry • Educational blockchain prototype</span><span>Solidity • Hardhat • Ethers.js • React/Vite</span></footer>
      </main>
    </div>
    {toast && <div className={`toast ${toast.type}`}>{toast.type==='success'?'✓':toast.type==='error'?'!':'↗'} {toast.message}</div>}
  </div>;
}

function Info({label,value,mono}) { return <div className="info"><span>{label}</span><strong className={mono?'mono':''}>{value || '—'}</strong></div>; }
function Action({title,text,onClick}) { return <button className="action" onClick={onClick}><b>{title}</b><span>{text}</span><i>→</i></button>; }
function Timeline({verified,transferred,history}) { return <div className="timeline"><Step done title="Registered" text="Property created on-chain"/><Step done={verified} title="Verified" text={verified?'Surveyor verification recorded':'Awaiting surveyor verification'}/><Step done={transferred} title="Transferred" text={transferred?`${history.length} owners recorded`:'Ownership remains with current owner'}/></div>; }
function Step({done,title,text}) { return <div className={`step ${done?'done':''}`}><div className="step-dot">{done?'✓':'·'}</div><div><b>{title}</b><span>{text}</span></div></div>; }
function Empty({text}) { return <div className="empty">{text}</div>; }

createRoot(document.getElementById("root")).render(<App />);
