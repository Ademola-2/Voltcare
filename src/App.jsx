import { useEffect, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase.js";
import { addDoc, collection, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, setDoc, getDoc } from "firebase/firestore";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Globe2,
  Menu,
  Moon,
  PlugZap,
  Sun,
  X,
  Zap,
  UserRound,
  LogOut,
  ShieldCheck,
  Settings,
} from "lucide-react";

const tools = [
  {
    icon: PlugZap,
    number: "01",
    title: "Electrical calculator",
    description: "Work out voltage, current, resistance, or power using Ohm’s law and core electrical formulas.",
    tag: "OHM’S LAW",
    color: "lavender",
  },
  {
    icon: Zap,
    number: "02",
    title: "Load calculator",
    description: "Add appliances and estimate connected load to better understand your power requirements.",
    tag: "LOAD PLANNING",
    color: "peach",
  },
  {
    icon: BatteryCharging,
    number: "03",
    title: "Energy calculator",
    description: "Estimate electricity use in watt-hours and kilowatt-hours over a chosen period.",
    tag: "ENERGY USE",
    color: "mint",
  },
  {
    icon: Sun,
    number: "04",
    title: "Solar planner",
    description: "Explore a preliminary solar and battery estimate based on your daily energy needs.",
    tag: "SOLAR ENERGY",
    color: "yellow",
  },
];

const services = [
  { icon: Compass, title: "Plan with clarity", text: "Turn everyday electrical questions into understandable estimates." },
  { icon: BookOpen, title: "Learn as you go", text: "Explore plain-language guides, formulas, and worked examples." },
  { icon: Globe2, title: "Built for everywhere", text: "A global-first experience with clear units and regional context." },
];

function Brand() {
  return (
    <a className="brand" href="#home" aria-label="VoltCare home">
      <span className="brand-mark"><Zap size={20} fill="currentColor" strokeWidth={2.5} /></span>
      <span>volt<span>care</span><small>ENGINEERING, MADE CLEAR</small></span>
    </a>
  );
}


const quantityOptions = [
  { value: "voltage", label: "Voltage (V)", unit: "V" },
  { value: "current", label: "Current (I)", unit: "A" },
  { value: "resistance", label: "Resistance (R)", unit: "Ω" },
  { value: "power", label: "Power (P)", unit: "W" },
];

function solveElectrical(first, a, second, b) {
  const values = {};
  values[first] = a;
  values[second] = b;
  const has = (key) => Number.isFinite(values[key]) && values[key] > 0;
  if (first === second) return { error: "Choose two different electrical quantities." };

  if (has("voltage") && has("current")) {
    values.resistance = values.voltage / values.current;
    values.power = values.voltage * values.current;
  } else if (has("voltage") && has("resistance")) {
    values.current = values.voltage / values.resistance;
    values.power = (values.voltage * values.voltage) / values.resistance;
  } else if (has("current") && has("resistance")) {
    values.voltage = values.current * values.resistance;
    values.power = values.current * values.current * values.resistance;
  } else if (has("voltage") && has("power")) {
    values.current = values.power / values.voltage;
    values.resistance = (values.voltage * values.voltage) / values.power;
  } else if (has("current") && has("power")) {
    values.voltage = values.power / values.current;
    values.resistance = values.power / (values.current * values.current);
  } else if (has("resistance") && has("power")) {
    values.voltage = Math.sqrt(values.power * values.resistance);
    values.current = Math.sqrt(values.power / values.resistance);
  } else {
    return { error: "Enter positive values for both quantities." };
  }
  return { values };
}

function ElectricalCalculator({ user, onSave }) {
  const [first, setFirst] = useState("voltage");
  const [second, setSecond] = useState("current");
  const [firstValue, setFirstValue] = useState("12");
  const [secondValue, setSecondValue] = useState("2");
  const [result, setResult] = useState(null);

  const calculate = (event) => {
    event.preventDefault();
    const a = Number(firstValue);
    const b = Number(secondValue);
    if (!firstValue.trim() || !secondValue.trim() || !Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
      setResult({ error: "Enter a positive number in both fields." });
      return;
    }
    setResult(solveElectrical(first, a, second, b));
  };

  const format = (number) => Number.isFinite(number) ? Number(number.toPrecision(6)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";

  return (
    <section className="calculator-section section-wrap" id="electrical-calculator">
      <div className="section-heading">
        <div><span className="section-kicker">TOOL 01 · OHM’S LAW</span><h2>Your electrical<br className="desktop-break" /> calculator is ready.</h2></div>
        <p>Enter any two different positive values. VoltCare calculates the other electrical quantities using basic DC circuit relationships.</p>
      </div>
      <div className="calculator-panel">
        <form className="calculator-form" onSubmit={calculate}>
          <label>First known quantity
            <select value={first} onChange={(event) => { setFirst(event.target.value); setResult(null); }}>
              {quantityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>Value
            <input type="number" min="0" step="any" value={firstValue} onChange={(event) => setFirstValue(event.target.value)} placeholder="Enter a value" />
          </label>
          <label>Second known quantity
            <select value={second} onChange={(event) => { setSecond(event.target.value); setResult(null); }}>
              {quantityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>Value
            <input type="number" min="0" step="any" value={secondValue} onChange={(event) => setSecondValue(event.target.value)} placeholder="Enter a value" />
          </label>
          <button className="button button-primary calculate-button" type="submit">Calculate values <ArrowRight size={17} /></button>
        </form>
        <div className="calculator-results" aria-live="polite">
          <div className="results-heading"><span className="section-kicker">CALCULATION RESULTS</span><span className="results-badge"><Check size={13} /> Instant estimate</span></div>
          {result?.error ? <p className="calculator-error">{result.error}</p> : result?.values ? (
            <div className="result-grid">
              {quantityOptions.map((item) => <div className="result-item" key={item.value}><span>{item.label}</span><strong>{format(result.values[item.value])} <small>{item.unit}</small></strong></div>)}
            </div>
          ) : <div className="result-placeholder"><Zap size={25} /><p>Enter two known values and tap <strong>Calculate values</strong> to see all four results here.</p></div>}
          {result?.values && <button className="button button-secondary save-calculation-button" type="button" onClick={() => onSave("Electrical Calculator", { inputs: { first, firstValue: Number(firstValue), second, secondValue: Number(secondValue) }, results: result.values })} disabled={!user}>Save calculation <Check size={16} /></button>}
          <p className="formula-note">Uses V = I × R and P = V × I, with equivalent formulas as needed. Intended for basic DC/resistive circuit learning.</p>
        </div>
      </div>
      <p className="calculator-disclaimer">Educational estimate only. AC circuits, power factor, component limits, and local installation requirements may need additional analysis by a qualified professional.</p>
    </section>
  );
}


function LoadCalculator({ user, onSave }) {
  const [appliances, setAppliances] = useState([
    { id: 1, name: "LED bulbs", quantity: "4", watts: "10", hours: "6" },
    { id: 2, name: "Fan", quantity: "1", watts: "75", hours: "8" },
  ]);
  const [nextId, setNextId] = useState(3);
  const [calculated, setCalculated] = useState(true);

  const updateAppliance = (id, field, value) => {
    setAppliances((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setCalculated(false);
  };
  const addAppliance = () => {
    setAppliances((items) => [...items, { id: nextId, name: "", quantity: "1", watts: "", hours: "1" }]);
    setNextId((id) => id + 1);
    setCalculated(false);
  };
  const removeAppliance = (id) => {
    setAppliances((items) => items.filter((item) => item.id !== id));
    setCalculated(false);
  };
  const valid = appliances.length > 0 && appliances.every((item) =>
    item.name.trim() && item.quantity.trim() && item.watts.trim() && item.hours.trim() &&
    Number(item.quantity) > 0 && Number(item.watts) >= 0 && Number(item.hours) >= 0 &&
    Number(item.hours) <= 24 && Number.isFinite(Number(item.quantity)) &&
    Number.isFinite(Number(item.watts)) && Number.isFinite(Number(item.hours))
  );
  const totalWatts = appliances.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.watts || 0), 0);
  const dailyWh = appliances.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.watts || 0) * Number(item.hours || 0), 0);
  const fmt = (value) => Number(value.toPrecision(6)).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <section className="calculator-section section-wrap" id="load-calculator">
      <div className="section-heading">
        <div><span className="section-kicker">TOOL 02 · LOAD PLANNING</span><h2>Know what your<br className="desktop-break" /> appliances need.</h2></div>
        <p>List your appliances, their quantity, rated power, and estimated daily use to calculate connected load and daily energy consumption.</p>
      </div>
      <div className="load-panel">
        <div className="load-panel-heading"><div><h3>Appliance list</h3><p>Enter the values from the appliance label where possible.</p></div><button className="button button-secondary add-appliance" type="button" onClick={addAppliance}><span>＋</span> Add appliance</button></div>
        <div className="appliance-list">
          {appliances.map((item) => (
            <div className="appliance-row" key={item.id}>
              <label className="appliance-name">Appliance name<input value={item.name} onChange={(e) => updateAppliance(item.id, "name", e.target.value)} placeholder="e.g. Television" /></label>
              <label>Qty<input type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateAppliance(item.id, "quantity", e.target.value)} /></label>
              <label>Power (W)<input type="number" min="0" step="any" value={item.watts} onChange={(e) => updateAppliance(item.id, "watts", e.target.value)} placeholder="Watts" /></label>
              <label>Hours/day<input type="number" min="0" max="24" step="any" value={item.hours} onChange={(e) => updateAppliance(item.id, "hours", e.target.value)} /></label>
              <button className="remove-appliance" type="button" onClick={() => removeAppliance(item.id)} aria-label={`Remove ${item.name || "appliance"}`}>×</button>
            </div>
          ))}
        </div>
        <button className="button button-primary calculate-button load-calculate" type="button" onClick={() => setCalculated(true)}>Calculate total load <ArrowRight size={17} /></button>
        {calculated && valid ? (
          <div className="load-results" aria-live="polite">
            <div className="load-result"><span>Total connected load</span><strong>{fmt(totalWatts)} <small>W</small></strong><p>Sum of appliance quantity × rated power.</p></div>
            <div className="load-result"><span>Estimated daily energy</span><strong>{fmt(dailyWh / 1000)} <small>kWh/day</small></strong><p>Sum of power × quantity × hours used.</p></div>
            <div className="load-result"><span>Estimated 30-day energy</span><strong>{fmt((dailyWh * 30) / 1000)} <small>kWh/month</small></strong><p>Assumes similar usage every day.</p></div>
          </div>
        ) : calculated ? <p className="calculator-error">Please enter a name, positive quantity, non-negative power, and daily hours from 0 to 24 for every appliance.</p> : <p className="load-hint">Update your appliance list, then tap “Calculate total load” to refresh the estimates.</p>}
      </div>
      {calculated && valid && <button className="button button-secondary save-calculation-button" type="button" onClick={() => onSave("Load Calculator", { appliances, results: { totalConnectedLoadW: totalWatts, dailyEnergyKwh: dailyWh / 1000, monthlyEnergyKwh: dailyWh * 30 / 1000 } })} disabled={!user}>Save calculation <Check size={16} /></button>}
      <p className="calculator-disclaimer">Estimates use rated watts and user-entered hours. Actual consumption varies with operating conditions. Connected load is not the same as peak demand; motor starting current and suitable safety margins need separate assessment.</p>
    </section>
  );
}


function EnergyCalculator({ user, onSave }) {
  const [power, setPower] = useState("100");
  const [hours, setHours] = useState("5");
  const [quantity, setQuantity] = useState("1");
  const [days, setDays] = useState("30");
  const [calculated, setCalculated] = useState(false);

  const valuesValid = [power, hours, quantity, days].every((v) => v.trim() !== "" && Number.isFinite(Number(v))) &&
    Number(power) >= 0 && Number(hours) >= 0 && Number(hours) <= 24 &&
    Number(quantity) > 0 && Number(days) > 0 && Number(days) <= 366;

  const dailyWh = Math.max(0, Number(power) || 0) * Math.max(0, Number(hours) || 0) * Math.max(0, Number(quantity) || 0);
  const fmt = (value) => Number(value.toPrecision(6)).toLocaleString(undefined, { maximumFractionDigits: 3 });

  return (
    <section className="calculator-section section-wrap" id="energy-calculator">
      <div className="section-heading">
        <div><span className="section-kicker">TOOL 03 · ENERGY USE</span><h2>Understand your<br className="desktop-break" /> energy consumption.</h2></div>
        <p>Estimate energy use from an appliance’s rated power, daily operating time, quantity, and the number of days in your period.</p>
      </div>
      <div className="calculator-panel energy-calculator-panel">
        <form className="calculator-form energy-form" onSubmit={(event) => { event.preventDefault(); setCalculated(true); }}>
          <label>Appliance power (W)<input type="number" min="0" step="any" value={power} onChange={(e) => { setPower(e.target.value); setCalculated(false); }} /></label>
          <label>Hours used per day<input type="number" min="0" max="24" step="any" value={hours} onChange={(e) => { setHours(e.target.value); setCalculated(false); }} /></label>
          <label>Number of appliances<input type="number" min="1" step="1" value={quantity} onChange={(e) => { setQuantity(e.target.value); setCalculated(false); }} /></label>
          <label>Period (days)<input type="number" min="1" max="366" step="1" value={days} onChange={(e) => { setDays(e.target.value); setCalculated(false); }} /></label>
          <button className="button button-primary calculate-button" type="submit">Calculate energy <ArrowRight size={17} /></button>
        </form>
        <div className="calculator-results" aria-live="polite">
          <div className="results-heading"><span className="section-kicker">ENERGY ESTIMATE</span><span className="results-badge"><Check size={13} /> Watt-hours & kWh</span></div>
          {calculated && !valuesValid ? <p className="calculator-error">Enter valid values: power must be non-negative, daily hours 0–24, quantity at least 1, and period 1–366 days.</p> : calculated ? (
            <div className="result-grid">
              <div className="result-item"><span>Daily energy</span><strong>{fmt(dailyWh / 1000)} <small>kWh/day</small></strong></div>
              <div className="result-item"><span>Total for selected period</span><strong>{fmt((dailyWh * Number(days)) / 1000)} <small>kWh</small></strong></div>
              <div className="result-item"><span>Daily energy in Wh</span><strong>{fmt(dailyWh)} <small>Wh/day</small></strong></div>
              <div className="result-item"><span>Average power while operating</span><strong>{fmt(Number(power) * Number(quantity))} <small>W</small></strong></div>
            </div>
          ) : <div className="result-placeholder"><BatteryCharging size={25} /><p>Enter the appliance details and tap <strong>Calculate energy</strong> to estimate daily and period consumption.</p></div>}
          {calculated && valuesValid && <button className="button button-secondary save-calculation-button" type="button" onClick={() => onSave("Energy Calculator", { inputs: { powerW: Number(power), hoursPerDay: Number(hours), quantity: Number(quantity), periodDays: Number(days) }, results: { dailyEnergyWh: dailyWh, dailyEnergyKwh: dailyWh / 1000, periodEnergyKwh: dailyWh * Number(days) / 1000, combinedPowerW: Number(power) * Number(quantity) } })} disabled={!user}>Save calculation <Check size={16} /></button>}
          <p className="formula-note">Energy (Wh) = power (W) × quantity × hours used. Divide Wh by 1,000 to convert to kWh.</p>
        </div>
      </div>
      <p className="calculator-disclaimer">This is an estimate based on rated power and the usage you enter. Appliances with thermostats, variable loads, or standby consumption may use a different amount in practice.</p>
    </section>
  );
}


function SolarPlanner({ user, onSave }) {
  const [dailyKwh, setDailyKwh] = useState("5");
  const [sunHours, setSunHours] = useState("4.5");
  const [derating, setDerating] = useState("0.75");
  const [autonomy, setAutonomy] = useState("1");
  const [depth, setDepth] = useState("0.8");
  const [inverterEfficiency, setInverterEfficiency] = useState("0.9");
  const [voltage, setVoltage] = useState("24");
  const [calculated, setCalculated] = useState(false);

  const values = [dailyKwh, sunHours, derating, autonomy, depth, inverterEfficiency, voltage].map(Number);
  const [energy, sun, lossFactor, days, dod, inverterEff, batteryVoltage] = values;
  const valid = [dailyKwh, sunHours, derating, autonomy, depth, inverterEfficiency, voltage].every((v) => v.trim() !== "" && Number.isFinite(Number(v))) &&
    energy > 0 && sun > 0 && lossFactor > 0 && lossFactor <= 1 && days > 0 &&
    dod > 0 && dod <= 1 && inverterEff > 0 && inverterEff <= 1 && batteryVoltage > 0;
  const panelWatts = energy * 1000 / (sun * lossFactor);
  const batteryWh = energy * 1000 * days / (dod * inverterEff);
  const batteryAh = batteryWh / batteryVoltage;
  const fmt = (value) => Number.isFinite(value) ? Number(value.toPrecision(5)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

  return (
    <section className="calculator-section section-wrap" id="solar-planner">
      <div className="section-heading">
        <div><span className="section-kicker">TOOL 04 · SOLAR ENERGY</span><h2>Start planning your<br className="desktop-break" /> solar system.</h2></div>
        <p>Estimate a starting point for solar panel capacity and battery storage using your daily energy demand and a few planning assumptions.</p>
      </div>
      <div className="calculator-panel solar-panel">
        <form className="calculator-form solar-form" onSubmit={(event) => { event.preventDefault(); setCalculated(true); }}>
          <label>Daily energy use (kWh/day)<input type="number" min="0.01" step="any" value={dailyKwh} onChange={(e) => { setDailyKwh(e.target.value); setCalculated(false); }} /></label>
          <label>Peak sun hours per day<input type="number" min="0.1" step="any" value={sunHours} onChange={(e) => { setSunHours(e.target.value); setCalculated(false); }} /></label>
          <label>Solar system derating factor<input type="number" min="0.01" max="1" step="any" value={derating} onChange={(e) => { setDerating(e.target.value); setCalculated(false); }} /></label>
          <label>Battery backup (days)<input type="number" min="0.1" step="any" value={autonomy} onChange={(e) => { setAutonomy(e.target.value); setCalculated(false); }} /></label>
          <label>Usable battery fraction (0–1)<input type="number" min="0.01" max="1" step="any" value={depth} onChange={(e) => { setDepth(e.target.value); setCalculated(false); }} /></label>
          <label>Inverter efficiency (0–1)<input type="number" min="0.01" max="1" step="any" value={inverterEfficiency} onChange={(e) => { setInverterEfficiency(e.target.value); setCalculated(false); }} /></label>
          <label>Nominal battery voltage (V)<input type="number" min="1" step="any" value={voltage} onChange={(e) => { setVoltage(e.target.value); setCalculated(false); }} /></label>
          <button className="button button-primary calculate-button" type="submit">Estimate solar system <ArrowRight size={17} /></button>
        </form>
        <div className="calculator-results solar-results" aria-live="polite">
          <div className="results-heading"><span className="section-kicker">PRELIMINARY ESTIMATE</span><span className="results-badge"><Sun size={13} /> Solar + storage</span></div>
          {calculated && !valid ? <p className="calculator-error">Check your entries. Energy, sun hours, backup days and voltage must be positive; derating, usable battery fraction and inverter efficiency must be greater than 0 and no more than 1.</p> : calculated ? (
            <div className="result-grid">
              <div className="result-item"><span>Estimated solar array</span><strong>{fmt(panelWatts)} <small>Wp</small></strong></div>
              <div className="result-item"><span>Estimated battery storage</span><strong>{fmt(batteryWh / 1000)} <small>kWh nominal</small></strong></div>
              <div className="result-item"><span>Approx. battery capacity</span><strong>{fmt(batteryAh)} <small>Ah at {fmt(batteryVoltage)} V</small></strong></div>
              <div className="result-item"><span>Daily energy entered</span><strong>{fmt(energy)} <small>kWh/day</small></strong></div>
            </div>
          ) : <div className="result-placeholder"><Sun size={25} /><p>Enter your energy needs and planning assumptions, then tap <strong>Estimate solar system</strong>.</p></div>}
          {calculated && valid && <button className="button button-secondary save-calculation-button" type="button" onClick={() => onSave("Solar Planner", { inputs: { dailyEnergyKwh: energy, peakSunHours: sun, deratingFactor: lossFactor, backupDays: days, usableBatteryFraction: dod, inverterEfficiency: inverterEff, batteryVoltageV: batteryVoltage }, results: { estimatedArrayWp: panelWatts, estimatedBatteryWh: batteryWh, estimatedBatteryAh: batteryAh } })} disabled={!user}>Save calculation <Check size={16} /></button>}
          <p className="formula-note">Array estimate = daily Wh ÷ (peak sun hours × derating factor). Battery estimate includes backup days, usable battery fraction, and inverter efficiency.</p>
        </div>
      </div>
      <div className="solar-assumptions"><strong>Important planning note</strong><p>Start with your Energy Calculator result where possible. Peak sun hours vary by location and season. This simplified estimate does not size an inverter, charge controller, cables, protection devices, or account fully for surge loads, shading, battery chemistry, temperature, or local electrical rules. Have a qualified solar professional verify the design before buying equipment or installing a system.</p></div>
    </section>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState("");
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLessons, setAdminLessons] = useState([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonCategory, setLessonCategory] = useState("Electrical basics");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonBody, setLessonBody] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  useEffect(() => onAuthStateChanged(auth, (currentUser) => setUser(currentUser)), []);
  useEffect(() => { let active = true; const check = async () => { setIsAdmin(false); setAdminOpen(false); if (!user) return; try { const snap = await getDoc(doc(db, "admins", user.uid)); if (active) setIsAdmin(snap.exists() && snap.data()?.role === "admin"); } catch (e) { console.error("Admin check failed", e); if (active) setIsAdmin(false); } }; check(); return () => { active = false; }; }, [user]);
  const openAdminWorkspace = async () => { if (!user || !isAdmin) return; setAdminOpen(true); setAdminMessage(""); setAdminBusy(true); try { const [us, ls] = await Promise.all([getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))), getDocs(query(collection(db, "lessons"), orderBy("createdAt", "desc")))]); setAdminUsers(us.docs.map(d => ({ id: d.id, ...d.data() }))); setAdminLessons(ls.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); setAdminMessage("Could not load data. Confirm Firestore rules are published."); } finally { setAdminBusy(false); } };
  const publishLesson = async (event) => { event.preventDefault(); if (!user || !isAdmin || !lessonTitle.trim() || !lessonSummary.trim() || !lessonBody.trim()) return; setAdminBusy(true); setAdminMessage(""); try { const ref = await addDoc(collection(db, "lessons"), { title: lessonTitle.trim(), category: lessonCategory, summary: lessonSummary.trim(), body: lessonBody.trim(), published: true, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setAdminLessons(items => [{ id: ref.id, title: lessonTitle.trim(), category: lessonCategory, summary: lessonSummary.trim(), body: lessonBody.trim(), published: true }, ...items]); setLessonTitle(""); setLessonSummary(""); setLessonBody(""); setAdminMessage("Lesson published successfully."); } catch (e) { console.error(e); setAdminMessage("Could not publish. Check Firestore rules and connection."); } finally { setAdminBusy(false); } };
  const removeLesson = async (id) => { if (!user || !isAdmin || !window.confirm("Delete this lesson permanently?")) return; try { await deleteDoc(doc(db, "lessons", id)); setAdminLessons(items => items.filter(item => item.id !== id)); setAdminMessage("Lesson deleted."); } catch (e) { console.error(e); setAdminMessage("Could not delete this lesson. Check Firestore rules."); } };
  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthMessage("");
    setAuthBusy(true);
    try {
      let credential;
      if (authMode === "register") {
        const cleanName = authName.trim();
        const cleanUsername = authUsername.trim().replace(/^@/, "").toLowerCase();
        if (cleanName.length < 2) throw Object.assign(new Error("Enter your full name (at least 2 characters)."), { code: "voltcare/invalid-name" });
        if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) throw Object.assign(new Error("Username must be 3–20 characters and use only letters, numbers, and underscores."), { code: "voltcare/invalid-username" });
        credential = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        await updateProfile(credential.user, { displayName: cleanName });
        await setDoc(doc(db, "users", credential.user.uid), { name: cleanName, username: cleanUsername, email: credential.user.email, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        setWelcomeToast("Welcome to VoltCare — Engineering, Made Clear.");
      } else {
        credential = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        const displayName = credential.user.displayName || credential.user.email?.split("@")[0] || "there";
        setWelcomeToast("Welcome back, " + displayName + "!");
      }
      setAuthOpen(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      const messages = {
        "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a password with at least 6 characters.",
        "auth/invalid-credential": "Email or password is incorrect. Please try again.",
        "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
        "voltcare/invalid-name": error.message,
        "voltcare/invalid-username": error.message
      };
      setAuthMessage(messages[error.code] || "We couldn't complete that request. Please check your connection and try again.");
    } finally {
      setAuthBusy(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setAuthMessage("");
    setAuthBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      const displayName = credential.user.displayName || credential.user.email?.split("@")[0] || "there";
      const isNewUser = getAdditionalUserInfo(credential)?.isNewUser;
      setWelcomeToast(isNewUser ? "Welcome to VoltCare — Engineering, Made Clear." : "Welcome back, " + displayName + "!");
      setAuthOpen(false);
      setAuthEmail("");
      setAuthPassword("");
    } catch (error) {
      const messages = {
        "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
        "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
        "auth/unauthorized-domain": "This website domain is not yet authorized in Firebase Authentication settings."
      };
      setAuthMessage(messages[error.code] || "Google sign-in failed. Please try again or use email and password.");
    } finally {
      setAuthBusy(false);
    }
  };
  const handleSignOut = async () => { try { await signOut(auth); setUserMenuOpen(false); setWelcomeToast("You have been signed out."); } catch { setAuthMessage("Unable to sign out. Please try again."); } };
  const openProfileSettings = async () => {
    setUserMenuOpen(false);
    setProfileMessage("");
    setProfileName(user?.displayName || "");
    setProfileUsername("");
    setProfileOpen(true);
    if (!user) return;
    try {
      const profileSnapshot = await getDoc(doc(db, "users", user.uid));
      if (profileSnapshot.exists()) {
        const profile = profileSnapshot.data();
        setProfileName(profile.name || user.displayName || "");
        setProfileUsername(profile.username || "");
      }
    } catch (error) {
      console.error("Profile load failed:", error);
      setProfileMessage("Profile details couldn't be loaded. Check your connection and Firestore rules.");
    }
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    if (!user) return;
    const cleanName = profileName.trim();
    const cleanUsername = profileUsername.trim().replace(/^@/, "").toLowerCase();
    if (cleanName.length < 2) { setProfileMessage("Name must be at least 2 characters."); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) { setProfileMessage("Username must be 3–20 characters and use only letters, numbers, and underscores."); return; }
    setProfileBusy(true);
    setProfileMessage("");
    try {
      await updateProfile(user, { displayName: cleanName });
      await setDoc(doc(db, "users", user.uid), { name: cleanName, username: cleanUsername, email: user.email, updatedAt: serverTimestamp() }, { merge: true });
      setUser({ ...auth.currentUser });
      setProfileOpen(false);
      setWelcomeToast("Your profile has been updated.");
    } catch (error) {
      console.error("Profile update failed:", error);
      setProfileMessage("Couldn't save your profile. Please check your Firestore rules and connection.");
    } finally { setProfileBusy(false); }
  };

  const saveCalculation = async (calculator, payload) => {
    if (!user) {
      setAuthMode("login");
      setAuthMessage("Please sign in to save your calculations.");
      setAuthOpen(true);
      return;
    }
    setSaveBusy(true);
    try {
      await addDoc(collection(db, "users", user.uid, "savedCalculations"), {
        calculator,
        payload,
        createdAt: serverTimestamp()
      });
      setWelcomeToast("Calculation saved successfully.");
      await loadSavedCalculations(user.uid);
    } catch (error) {
      console.error("Save calculation failed:", error);
      setWelcomeToast("Couldn't save this calculation. Please check your connection and Firestore rules.");
    } finally {
      setSaveBusy(false);
    }
  };
  const loadSavedCalculations = async (uid) => {
    try {
      const savedQuery = query(collection(db, "users", uid, "savedCalculations"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(savedQuery);
      setSavedCalculations(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      console.error("Loading saved calculations failed:", error);
    }
  };
  const deleteSavedCalculation = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "savedCalculations", id));
      setSavedCalculations((items) => items.filter((item) => item.id !== id));
      setWelcomeToast("Saved calculation deleted.");
    } catch (error) {
      setWelcomeToast("Couldn't delete this calculation. Please try again.");
    }
  };
  useEffect(() => {
    if (user) loadSavedCalculations(user.uid);
    else setSavedCalculations([]);
  }, [user]);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={darkMode ? "site-shell dark-mode" : "site-shell"} id="home">
      <div className="announcement">
        <span className="announcement-dot" />
        A smarter way to explore electrical and solar energy
        <ArrowUpRight size={14} aria-hidden="true" />
      </div>

      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#tools" onClick={closeMenu}>Tools</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#learn" onClick={closeMenu}>Learn</a>
            <a className="nav-cta" href="#contact" onClick={closeMenu}>Get started <ArrowRight size={16} /></a>
          </nav>
          <div className="nav-actions">
            <div className="nav-account">{user ? <div className="account-menu-wrap"><button className="account-identity" type="button" onClick={() => setUserMenuOpen((open) => !open)} aria-expanded={userMenuOpen} aria-haspopup="true" title={user.email || "Signed in"}><UserRound size={17} /><span className="account-label">{user.displayName || user.email?.split("@")[0] || "Account"}</span><ChevronDown size={14} className={userMenuOpen ? "account-chevron is-open" : "account-chevron"} /></button>{userMenuOpen && <div className="account-dropdown"><span className="dropdown-user-email">{user.email}</span><button type="button" onClick={() => { closeMenu(); setUserMenuOpen(false); document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" }); }}><UserRound size={16} /> My Dashboard</button>{isAdmin && <button type="button" onClick={() => { setUserMenuOpen(false); openAdminWorkspace(); }}><ShieldCheck size={16} /> Admin Workspace</button>}<button type="button" onClick={openProfileSettings}><Settings size={16} /> Settings / Profile</button><button type="button" onClick={handleSignOut}><LogOut size={16} /> Log out</button></div>}</div> : <button className="account-button" type="button" onClick={() => { setAuthMode("login"); setAuthMessage(""); setAuthOpen(true); }}><UserRound size={17} /><span className="account-label">Sign in</span></button>}</div>
            <button className="theme-toggle" type="button" onClick={() => setDarkMode((current) => !current)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}<span>{darkMode ? "Light" : "Dark"}</span></button>
            <button className="menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {adminOpen && isAdmin && <div className="admin-overlay"><section className="admin-workspace" role="dialog" aria-modal="true" aria-labelledby="admin-workspace-title"><header className="admin-workspace-header"><div><span className="section-kicker">VOLTCARE CONTROL ROOM</span><h2 id="admin-workspace-title">Admin workspace</h2><p>{user?.email}</p></div><button className="admin-close" type="button" onClick={() => setAdminOpen(false)} aria-label="Close"><X size={22}/></button></header>{adminMessage && <p className="admin-message" role="status">{adminMessage}</p>}{adminBusy && <p className="admin-message">Loading / saving…</p>}<div className="admin-stat-grid"><article><span>Registered profiles</span><strong>{adminUsers.length}</strong></article><article><span>Learning resources</span><strong>{adminLessons.length}</strong></article><article><span>Admin access</span><strong>Verified</strong></article></div><div className="admin-content-grid"><section className="admin-card"><span className="section-kicker">CONTENT MANAGEMENT</span><h3>Publish a lesson</h3><form className="admin-lesson-form" onSubmit={publishLesson}><label>Title<input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} required maxLength="100" placeholder="e.g. Circuit breakers"/></label><label>Category<select value={lessonCategory} onChange={e=>setLessonCategory(e.target.value)}><option>Electrical basics</option><option>Power systems</option><option>Solar energy</option><option>Electrical safety</option><option>Energy efficiency</option></select></label><label>Summary<textarea value={lessonSummary} onChange={e=>setLessonSummary(e.target.value)} required rows="2" maxLength="240"/></label><label>Lesson content<textarea value={lessonBody} onChange={e=>setLessonBody(e.target.value)} required rows="5" placeholder="Write the lesson…"/></label><button className="button button-primary" disabled={adminBusy} type="submit">Publish lesson <ArrowRight size={16}/></button></form></section><section className="admin-card"><span className="section-kicker">REGISTERED USERS</span><h3>User profiles</h3>{adminUsers.length ? <div className="admin-user-list">{adminUsers.map(p=><article key={p.id}><span className="admin-user-avatar"><UserRound size={17}/></span><div><strong>{p.name||"Name not provided"}</strong><small>@{p.username||"no-username"} · {p.email||"No email"}</small></div></article>)}</div> : <p className="admin-empty">No profiles found.</p>}</section></div><section className="admin-card admin-lessons-card"><span className="section-kicker">PUBLISHED CONTENT</span><h3>Learning resources ({adminLessons.length})</h3>{adminLessons.length ? <div className="admin-lesson-list">{adminLessons.map(l=><article key={l.id}><div><strong>{l.title}</strong><small>{l.category} · {l.summary}</small></div><button type="button" onClick={()=>removeLesson(l.id)} aria-label={"Delete "+l.title}><X size={17}/></button></article>)}</div> : <p className="admin-empty">No additional lessons published yet.</p>}</section><p className="admin-security-note"><ShieldCheck size={16}/> Admin access is controlled by a protected admins/{'{uid}'} document. Do not grant admin status through user profile fields.</p></section></div>}
      {welcomeToast && <div className="welcome-toast" role="status"><span className="welcome-toast-icon"><Check size={18} /></span><span>{welcomeToast}</span><button type="button" onClick={() => setWelcomeToast("")} aria-label="Dismiss message"><X size={16} /></button></div>}
      {profileOpen && <div className="auth-overlay" onClick={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}><section className="auth-dialog profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="auth-close" type="button" onClick={() => setProfileOpen(false)} aria-label="Close settings"><X size={20} /></button><span className="section-kicker">ACCOUNT SETTINGS</span><h2 id="profile-title">Edit your profile</h2><p className="auth-intro">Update the name and username shown on your VoltCare account.</p><form className="auth-form" onSubmit={saveProfile}><label htmlFor="profile-name">Full name</label><input id="profile-name" type="text" autoComplete="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required minLength="2" placeholder="Your name" /><label htmlFor="profile-username">Username</label><input id="profile-username" type="text" autoComplete="username" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" title="Use 3–20 letters, numbers, or underscores" placeholder="your_username" /><small className="auth-field-hint">3–20 characters; letters, numbers, and underscores only.</small><label>Email address</label><input type="email" value={user?.email || ""} readOnly /><small className="auth-field-hint">Email changes are not available here yet.</small>{profileMessage && <p className="auth-message" role="alert">{profileMessage}</p>}<button className="button button-primary auth-submit" type="submit" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save profile"} <Check size={16} /></button></form></section></div>}
      {authOpen && <div className="auth-overlay" onClick={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close dialog"><X size={20} /></button><span className="section-kicker">YOUR VOLTCARE ACCOUNT</span><h2 id="auth-title">{authMode === "register" ? "Create your account" : "Welcome back"}</h2><p className="auth-intro">{authMode === "register" ? "Create an account with your email address." : "Sign in to your VoltCare account."}</p><button className="google-auth-button" type="button" onClick={handleGoogleSignIn} disabled={authBusy}><span className="google-g" aria-hidden="true">G</span>Continue with Google</button><div className="auth-divider"><span>or continue with email</span></div><form className="auth-form" onSubmit={submitAuth}>{authMode === "register" && <><label htmlFor="auth-name">Full name</label><input id="auth-name" type="text" autoComplete="name" value={authName} onChange={(e) => setAuthName(e.target.value)} required minLength="2" placeholder="Enter your name" /><label htmlFor="auth-username">Username</label><input id="auth-username" type="text" autoComplete="username" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" title="Use 3–20 letters, numbers, or underscores" placeholder="e.g. ademola_coder" /><small className="auth-field-hint">3–20 characters; letters, numbers, and underscores only.</small></>}<label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required placeholder="you@example.com" /><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength="6" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required placeholder="At least 6 characters" />{authMessage && <p className="auth-message" role="alert">{authMessage}</p>}<button className="button button-primary auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"} <ArrowRight size={16} /></button></form><p className="auth-switch">{authMode === "register" ? "Already have an account?" : "New to VoltCare?"} <button type="button" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setAuthMessage(""); }}>{authMode === "register" ? "Sign in" : "Create account"}</button></p></section></div>}
      <main>
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-icon"><Zap size={14} fill="currentColor" /></span> YOUR ENERGY. BETTER UNDERSTOOD.</div>
            <h1>Make confident<br />energy decisions<span>.</span></h1>
            <p className="hero-text">Practical electrical calculators, clearer solar planning, and engineering knowledge — all in one place.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#tools">Explore free tools <ArrowRight size={17} /></a>
              <a className="button button-secondary" href="#how-it-works">Discover VoltCare <ArrowDownRight size={17} /></a>
            </div>
            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true"><span>E</span><span>⚡</span><span>S</span></div>
              <p><strong>For learners, homes & professionals</strong><br /><span>Made to make technical things clearer.</span></p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Illustration of a smart energy dashboard">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-glow" />
            <div className="energy-card">
              <div className="energy-card-top"><span className="mini-label"><span className="live-dot" /> ENERGY SNAPSHOT</span><span className="more-dots">•••</span></div>
              <div className="energy-heading"><div><span className="muted-label">Illustrative daily usage</span><strong>8.4 <small>kWh</small></strong></div><span className="trend"><ArrowUpRight size={15} /> Estimate</span></div>
              <div className="chart" aria-hidden="true">
                {[34, 50, 42, 70, 56, 84, 61, 48, 73, 58, 92, 66, 78, 52, 69, 44, 61, 80, 55, 71].map((height, i) => <span key={i} style={{ height: height + "%" }} className={i === 10 ? "chart-bar chart-bar-active" : "chart-bar"} />)}
              </div>
              <div className="chart-labels"><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span></div>
              <div className="energy-divider" />
              <div className="energy-footer"><span><i className="legend-dot purple-dot" /> Energy used</span><span className="sample-label">Sample preview</span></div>
            </div>
            <div className="floating-chip chip-solar"><span className="chip-icon sun-icon"><Sun size={18} /></span><span><strong>Solar ready?</strong><small>Start with an estimate</small></span><ChevronDown size={15} /></div>
            <div className="floating-chip chip-voltage"><span className="chip-icon bolt-icon"><Zap size={18} fill="currentColor" /></span><span><strong>V = I × R</strong><small>Electrical basics</small></span></div>
            <div className="visual-caption"><span className="caption-check"><Check size={13} /></span> Clear tools. Better-informed decisions.</div>
          </div>
        </section>

        <section className="metrics-strip section-wrap" aria-label="VoltCare principles">
          <div><span className="metric-icon"><Globe2 size={19} /></span><span><strong>Global-first</strong><small>Designed for a worldwide audience</small></span></div>
          <div><span className="metric-icon"><Zap size={19} /></span><span><strong>Practical tools</strong><small>Useful calculations, made clearer</small></span></div>
          <div><span className="metric-icon"><CircleHelp size={19} /></span><span><strong>Learn by doing</strong><small>Understand the numbers behind results</small></span></div>
        </section>

        <section className="tools-section section-wrap" id="tools">
          <div className="section-heading">
            <div><span className="section-kicker">THE TOOLKIT</span><h2>Good decisions start<br className="desktop-break" /> with the right tools.</h2></div>
            <p>Explore practical tools for everyday electrical questions and early-stage energy planning. We’ll build each calculator carefully, one step at a time.</p>
          </div>
          <div className="tool-grid">
            {tools.map(({ icon: Icon, number, title, description, tag, color }) => (
              <article className="tool-card" key={title}>
                <div className="tool-card-top"><span className={"tool-icon " + color}><Icon size={22} /></span><span className="tool-number">{number}</span></div>
                <span className="tool-tag">{tag}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <a href={title === "Electrical calculator" ? "#electrical-calculator" : title === "Load calculator" ? "#load-calculator" : title === "Energy calculator" ? "#energy-calculator" : title === "Solar planner" ? "#solar-planner" : "#contact"} className="text-link">Try planner <ArrowUpRight size={15} /></a>
              </article>
            ))}
          </div>
          <div className="tools-note"><span className="note-icon"><CircleHelp size={18} /></span><p><strong>Built around clarity, not guesswork.</strong> Results will show their assumptions and limitations. Installation decisions should always account for local electrical codes and qualified professional advice.</p></div>
        </section>

        {user && <section className="user-dashboard section-wrap" id="dashboard">
          <div className="dashboard-welcome">
            <div>
              <span className="section-kicker">YOUR VOLTCARE ACCOUNT</span>
              <h2>Welcome back, {user.displayName || user.email?.split("@")[0] || "there"}.</h2>
              <p>Your personal space for electrical estimates and energy planning.</p>
            </div>
            <span className="dashboard-avatar"><UserRound size={27} /></span>
          </div>
          <div className="dashboard-stat-grid">
            <article className="dashboard-stat-card"><span className="dashboard-stat-icon"><BookOpen size={19} /></span><span className="dashboard-stat-label">Saved calculations</span><strong>{savedCalculations.length}</strong><small>Available in your workspace</small></article>
            <article className="dashboard-stat-card"><span className="dashboard-stat-icon"><Zap size={19} /></span><span className="dashboard-stat-label">Calculator tools</span><strong>4</strong><small>Electrical, load, energy &amp; solar</small></article>
            <article className="dashboard-stat-card"><span className="dashboard-stat-icon"><Check size={19} /></span><span className="dashboard-stat-label">Account status</span><strong>Active</strong><small>Signed in securely with Firebase</small></article>
          </div>
          <div className="dashboard-lower-grid">
            <article className="dashboard-info-card">
              <span className="section-kicker">ACCOUNT DETAILS</span>
              <h3>Your profile</h3>
              <div className="dashboard-detail-row"><span>Name</span><strong>{user.displayName || "Not provided"}</strong></div>
              <div className="dashboard-detail-row"><span>Email</span><strong>{user.email || "Not available"}</strong></div>
              <div className="dashboard-detail-row"><span>Account created</span><strong>{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—"}</strong></div>
            </article>
            <article className="dashboard-info-card">
              <span className="section-kicker">QUICK ACTIONS</span>
              <h3>What would you like to do?</h3>
              <a className="dashboard-action-link" href="#electrical-calculator"><span><PlugZap size={18} /> Electrical calculator</span><ArrowRight size={16} /></a>
              <a className="dashboard-action-link" href="#load-calculator"><span><Zap size={18} /> Load calculator</span><ArrowRight size={16} /></a>
              <a className="dashboard-action-link" href="#solar-planner"><span><Sun size={18} /> Solar planner</span><ArrowRight size={16} /></a>
              <a className="dashboard-action-link" href="#my-calculations"><span><BookOpen size={18} /> View saved calculations</span><ArrowRight size={16} /></a>
            </article>
          </div>
          {isAdmin && <button className="admin-launch-card" type="button" onClick={openAdminWorkspace}><div><span className="section-kicker">SECURE ADMIN ACCESS</span><h3>Open VoltCare Admin Workspace</h3><p>Manage user profiles and publish learning resources.</p></div><span className="admin-launch-icon"><ShieldCheck size={25} /></span></button>}
        </section>}

        {user && <section className="saved-calculations section-wrap" id="my-calculations">
          <div className="section-heading"><div><span className="section-kicker">YOUR WORKSPACE</span><h2>My calculations.</h2></div><p>Your saved estimates, available whenever you sign in to your VoltCare account.</p></div>
          {savedCalculations.length ? <div className="saved-calculation-grid">{savedCalculations.map((item) => <article className="saved-calculation-card" key={item.id}><div className="saved-card-top"><span className="saved-card-icon"><Zap size={18} /></span><button type="button" className="saved-delete" onClick={() => deleteSavedCalculation(item.id)} aria-label="Delete saved calculation"><X size={16} /></button></div><span className="saved-card-type">{item.calculator}</span><h3>{item.payload?.title || item.calculator + " result"}</h3><p>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : "Just saved"}</p><div className="saved-card-values">{Object.entries(item.payload?.results || {}).slice(0,3).map(([key,value]) => <span key={key}><small>{key.replace(/([A-Z])/g," $1").replace(/^./,m=>m.toUpperCase())}</small><strong>{typeof value === "number" ? Number(value.toPrecision(5)).toLocaleString() : String(value)}</strong></span>)}</div></article>)}</div> : <div className="saved-empty"><BookOpen size={24} /><h3>No saved calculations yet</h3><p>Calculate a result below, then tap “Save calculation” to keep it here.</p></div>}
        </section>}
        <ElectricalCalculator user={user} onSave={saveCalculation} />

        <LoadCalculator user={user} onSave={saveCalculation} />

        <EnergyCalculator user={user} onSave={saveCalculation} />

        <SolarPlanner user={user} onSave={saveCalculation} />

        <section className="how-section" id="how-it-works">
          <div className="section-wrap how-inner">
            <div className="how-copy"><span className="section-kicker light-kicker">SIMPLE BY DESIGN</span><h2>Technical doesn’t<br />have to mean confusing.</h2><p>VoltCare is being built to help you move from a question to a clearer understanding — without needing to be an expert first.</p><a className="button button-light" href="#learn">See our approach <ArrowRight size={16} /></a></div>
            <div className="how-steps">
              <article><span className="step-number">01</span><div><h3>Choose your question</h3><p>Start with the electrical or energy problem you want to understand.</p></div><span className="step-check"><Check size={16} /></span></article>
              <article><span className="step-number">02</span><div><h3>Enter what you know</h3><p>Use straightforward inputs, familiar units, and helpful explanations.</p></div><span className="step-check"><Check size={16} /></span></article>
              <article><span className="step-number">03</span><div><h3>Understand the result</h3><p>See an estimate with context, formulas, and sensible next steps.</p></div><span className="step-check"><Check size={16} /></span></article>
            </div>
          </div>
        </section>

        <section className="learning-centre section-wrap" id="learn">
          <div className="section-heading">
            <div><span className="section-kicker">VOLTCARE LEARNING CENTRE</span><h2>Build your knowledge,<br className="desktop-break" /> one concept at a time.</h2></div>
            <p>Short, practical lessons with formulas, worked examples, and reminders about where real-world engineering needs extra care.</p>
          </div>
          <div className="lesson-grid">
            <article className="lesson-card"><span className="lesson-number">LESSON 01 · FUNDAMENTALS</span><h3>Ohm’s Law</h3><p>Understand the relationship between voltage, current, and resistance in a basic circuit.</p><div className="lesson-formula">V = I × R</div><div className="lesson-example"><strong>Worked example</strong><p>A 12 V supply across a 6 Ω resistor gives I = V ÷ R = 12 ÷ 6 = <strong>2 A</strong>.</p></div><a className="text-link" href="#electrical-calculator">Practise with calculator <ArrowRight size={15} /></a></article>
            <article className="lesson-card"><span className="lesson-number">LESSON 02 · POWER</span><h3>Electrical Power</h3><p>Power tells you how quickly electrical energy is transferred or used.</p><div className="lesson-formula">P = V × I</div><div className="lesson-example"><strong>Worked example</strong><p>A device operating at 12 V and 2 A uses P = 12 × 2 = <strong>24 W</strong>.</p></div><a className="text-link" href="#electrical-calculator">Practise with calculator <ArrowRight size={15} /></a></article>
            <article className="lesson-card"><span className="lesson-number">LESSON 03 · ENERGY</span><h3>Energy Consumption</h3><p>Electrical energy depends on power and how long equipment runs.</p><div className="lesson-formula">E (Wh) = P (W) × t (h)</div><div className="lesson-example"><strong>Worked example</strong><p>A 100 W fan used for 5 hours consumes 100 × 5 = 500 Wh, or <strong>0.5 kWh</strong>.</p></div><a className="text-link" href="#energy-calculator">Practise with calculator <ArrowRight size={15} /></a></article>
            <article className="lesson-card"><span className="lesson-number">LESSON 04 · SOLAR PLANNING</span><h3>Solar Array Basics</h3><p>A preliminary array estimate relates daily energy demand to sun hours and system losses.</p><div className="lesson-formula">Wp ≈ Wh ÷ (H × f)</div><div className="lesson-example"><strong>Worked example</strong><p>For 5,000 Wh/day, 5 peak-sun-hours and a 0.75 derating factor: 5,000 ÷ (5 × 0.75) ≈ <strong>1,333 Wp</strong>.</p></div><a className="text-link" href="#solar-planner">Try solar planner <ArrowRight size={15} /></a></article>
          </div>
          <p className="learning-safety"><CircleHelp size={17} /> These lessons are introductory. Real installations require correct equipment ratings, protection, local-code compliance, and qualified assessment.</p>
        </section>

        <section className="contact-section section-wrap" id="contact">
          <div className="contact-panel">
            <div><span className="section-kicker light-kicker">LET’S BUILD A BETTER ENERGY FUTURE</span><h2>What would you like<br />to solve?</h2><p>VoltCare is growing. Tell us which electrical calculator, solar tool, or learning resource would be most useful to you.</p></div>
            <a className="button button-light" href="https://github.com/Ademola-2/Voltcare" target="_blank" rel="noreferrer">Follow the project <ArrowUpRight size={16} /></a>
            <div className="contact-decoration" aria-hidden="true"><Zap size={150} /></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main section-wrap"><Brand /><p>Making electrical engineering and energy planning easier to understand.</p><div className="footer-links"><a href="#tools">Tools</a><a href="#learn">Learn</a><a href="#contact">Contact</a><a href="https://github.com/Ademola-2/Voltcare" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13} /></a></div></div>
        <div className="footer-bottom section-wrap"><span>© {new Date().getFullYear()} VoltCare. Built for a brighter, more informed future.</span><span>Engineering estimates are educational and do not replace professional assessment.</span></div>
      </footer>
    </div>
  );
}

export default App;