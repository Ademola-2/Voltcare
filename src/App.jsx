import { useEffect, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase.js";
import { addDoc, collection, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, setDoc, getDoc, where, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
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


const starterLessons = [
{ id:"starter-ohms-law", title:"Ohm’s Law", category:"FUNDAMENTALS", summary:"Understand the relationship between voltage, current, and resistance in a basic circuit.", formula:"V = I × R", body:"Ohm’s Law describes the relationship between voltage (V), current (I), and resistance (R) in an ohmic conductor when physical conditions remain constant. Voltage is the electrical potential difference that drives charge; current is the rate of charge flow; resistance opposes current.\n\nKey formulas:\n• V = I × R\n• I = V ÷ R\n• R = V ÷ I\n\nWorked example:\nA 12 V supply is connected across a 6 Ω resistor. Current is I = V ÷ R = 12 ÷ 6 = 2 A.\n\nRemember: these relationships are useful for basic resistive DC circuits. Real components have ratings and may heat up; never assume a circuit is safe just because the arithmetic works." },
{ id:"starter-electrical-power", title:"Electrical Power", category:"POWER", summary:"Power tells you how quickly electrical energy is transferred or used.", formula:"P = V × I", body:"Electrical power is the rate at which electrical energy is transferred or converted. It is measured in watts (W).\n\nUseful formulas:\n• P = V × I\n• P = I² × R\n• P = V² ÷ R\n\nWorked example:\nA device operating at 12 V and drawing 2 A uses P = 12 × 2 = 24 W.\n\nFor AC systems, voltage, current, power factor, and waveform may affect the calculation. Nameplate power is a useful starting point, but actual consumption can vary." },
{ id:"starter-energy-consumption", title:"Energy Consumption", category:"ENERGY", summary:"Electrical energy depends on power and how long equipment runs.", formula:"E (Wh) = P (W) × t (h)", body:"Energy consumption combines the power of a device with the time it operates. Watt-hours (Wh) and kilowatt-hours (kWh) are common units. One kilowatt-hour equals 1,000 watt-hours.\n\nFormulas:\n• Energy (Wh) = power (W) × time (h)\n• Energy (kWh) = energy (Wh) ÷ 1,000\n\nWorked example:\nA 100 W fan used for 5 hours consumes 100 × 5 = 500 Wh = 0.5 kWh. If used for 5 hours every day for 30 days, estimated use is 15 kWh.\n\nThis is an estimate: cycling loads, standby power, and actual operating conditions can change consumption." },
{ id:"starter-solar-array-basics", title:"Solar Array Basics", category:"SOLAR PLANNING", summary:"A preliminary array estimate relates daily energy demand to sun hours and system losses.", formula:"Wp ≈ Wh ÷ (H × f)", body:"A rough solar array estimate divides daily energy demand by peak sun hours and an allowance for system losses. Peak sun hours represent equivalent hours at 1,000 W/m², not simply the number of daylight hours.\n\nApproximate formula:\nArray power (Wp) ≈ daily energy (Wh) ÷ (peak sun hours × derating factor)\n\nWorked example:\nFor 5,000 Wh/day, 5 peak-sun-hours, and a 0.75 derating factor: 5,000 ÷ (5 × 0.75) ≈ 1,333 Wp.\n\nThis is an early estimate only. Site-specific solar resource, shading, orientation, temperature, battery losses, inverter efficiency, seasonal demand, and equipment specifications must be assessed before choosing a system." }
];

const quizQuestionBank = [
  { id: "ohms-formula", question: "Which formula represents Ohm’s Law?", options: ["V = I × R", "P = V + I", "R = V × I", "I = V × R"], answer: 0, explanation: "Voltage equals current multiplied by resistance: V = I × R.", topic: "Ohm’s Law" },
  { id: "ohms-current", question: "A 12 V supply is connected across a 6 Ω resistor. What current flows?", options: ["0.5 A", "2 A", "6 A", "72 A"], answer: 1, explanation: "I = V ÷ R = 12 ÷ 6 = 2 A.", topic: "Ohm’s Law" },
  { id: "ohms-resistance", question: "A circuit has 10 V across it and a current of 2 A. What is its resistance?", options: ["5 Ω", "12 Ω", "20 Ω", "0.2 Ω"], answer: 0, explanation: "R = V ÷ I = 10 ÷ 2 = 5 Ω.", topic: "Ohm’s Law" },
  { id: "ohms-current-2", question: "If voltage stays constant while resistance increases, what happens to current in a basic resistive circuit?", options: ["It increases", "It becomes infinite", "It decreases", "It always stays the same"], answer: 2, explanation: "From I = V ÷ R, increasing resistance reduces current when voltage is constant.", topic: "Ohm’s Law" },
  { id: "power-formula", question: "Which formula calculates electrical power when voltage and current are known?", options: ["P = V × I", "P = V ÷ I", "P = I + R", "P = V − R"], answer: 0, explanation: "Electrical power is voltage multiplied by current: P = V × I.", topic: "Electrical Power" },
  { id: "power-calc", question: "A 12 V device draws 2 A. How much electrical power does it use?", options: ["6 W", "10 W", "24 W", "14 W"], answer: 2, explanation: "P = V × I = 12 × 2 = 24 W.", topic: "Electrical Power" },
  { id: "power-unit", question: "What is the standard unit of electrical power?", options: ["Ohm", "Watt", "Ampere-hour", "Kilowatt-hour"], answer: 1, explanation: "Power is measured in watts (W); energy is commonly measured in Wh or kWh.", topic: "Electrical Power" },
  { id: "power-resistance", question: "Which formula can calculate power in a resistive circuit using current and resistance?", options: ["P = I² × R", "P = I ÷ R", "P = R ÷ I", "P = I + R"], answer: 0, explanation: "For a resistive circuit, power can be calculated using P = I² × R.", topic: "Electrical Power" },
  { id: "energy-unit", question: "Which unit is commonly used for electrical energy on utility bills?", options: ["Volt", "Ampere", "Kilowatt-hour (kWh)", "Ohm"], answer: 2, explanation: "Utility energy consumption is commonly recorded in kilowatt-hours (kWh).", topic: "Energy Consumption" },
  { id: "energy-calc", question: "A 100 W fan runs for 5 hours. How much energy does it use?", options: ["20 Wh", "500 Wh", "5,000 Wh", "100 kWh"], answer: 1, explanation: "Energy = power × time = 100 W × 5 h = 500 Wh, or 0.5 kWh.", topic: "Energy Consumption" },
  { id: "energy-convert", question: "How many watt-hours are in 1 kilowatt-hour?", options: ["100 Wh", "500 Wh", "1,000 Wh", "10,000 Wh"], answer: 2, explanation: "One kilowatt-hour equals 1,000 watt-hours.", topic: "Energy Consumption" },
  { id: "energy-time", question: "For the same appliance power, what happens to energy use if operating time doubles?", options: ["It halves", "It doubles", "It becomes zero", "It cannot change"], answer: 1, explanation: "Energy = power × time, so doubling operating time doubles energy use if power remains constant.", topic: "Energy Consumption" },
  { id: "solar-sun-hours", question: "What do peak sun hours represent in a basic solar estimate?", options: ["All daylight hours exactly", "Equivalent hours at a standard solar irradiance", "Battery charging time only", "The number of panels"], answer: 1, explanation: "Peak sun hours express solar energy as equivalent hours at about 1,000 W/m².", topic: "Solar Planning" },
  { id: "solar-array", question: "Which information is used in a preliminary estimate of solar array power?", options: ["Daily energy, peak sun hours, and a derating factor", "Battery color and panel brand", "Only the building height", "Only the inverter price"], answer: 0, explanation: "A simple estimate divides daily energy in Wh by peak sun hours multiplied by a derating factor.", topic: "Solar Planning" },
  { id: "solar-derating", question: "Why is a derating factor included in a rough solar array estimate?", options: ["To ignore all losses", "To account approximately for system losses", "To determine cable color", "To increase daylight hours"], answer: 1, explanation: "The derating factor allows for approximate system losses that reduce usable solar output.", topic: "Solar Planning" },
  { id: "solar-sizing", question: "A rough solar estimate gives a panel capacity. What should happen before equipment is purchased?", options: ["Treat it as a guaranteed design", "Ignore battery and inverter needs", "Have the full system checked for site conditions, ratings, and protection", "Choose cables by appearance"], answer: 2, explanation: "Array sizing is only an initial estimate; the full design needs qualified verification.", topic: "Solar Planning" },
  { id: "battery-usable", question: "Why is a battery’s usable capacity often less than its nominal capacity?", options: ["Some capacity may be reserved to respect operating limits", "Batteries have no energy stored", "Voltage is measured in watts", "Panels create extra capacity automatically"], answer: 0, explanation: "Depth-of-discharge limits and system losses mean not all nominal stored energy should be assumed usable.", topic: "Battery Planning" },
  { id: "inverter-loss", question: "What does inverter efficiency describe?", options: ["How much energy is lost converting DC to AC", "The number of solar panels", "The battery's color", "The cable length only"], answer: 0, explanation: "Inverter efficiency compares useful output energy with input energy; losses reduce available energy.", topic: "Solar Planning" },
  { id: "safety-design", question: "Before installing a real electrical or solar system, what should you do?", options: ["Use an estimate without checking", "Ignore protection devices", "Verify equipment ratings, protection, and local requirements with a qualified professional", "Choose the smallest cable"], answer: 2, explanation: "Real installations require suitable ratings, protection, code compliance, and qualified assessment.", topic: "Electrical Safety" },
  { id: "safety-isolation", question: "Before working on electrical equipment, what is a key safety step?", options: ["Assume it is off because a switch is down", "Follow safe isolation procedures and verify absence of voltage", "Remove protective devices", "Work on it while energized whenever possible"], answer: 1, explanation: "Use appropriate safe-isolation procedures and test for absence of voltage; follow local rules and training.", topic: "Electrical Safety" }
];

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createQuiz(excludedIds = []) {
  const excluded = new Set(excludedIds);
  let available = quizQuestionBank.filter((item) => !excluded.has(item.id));
  if (available.length < 10) available = quizQuestionBank;
  return shuffleItems(available).slice(0, 10).map((item) => {
    const shuffledOptions = shuffleItems(item.options.map((text, index) => ({ text, correct: index === item.answer })));
    return { ...item, options: shuffledOptions.map((option) => option.text), answer: shuffledOptions.findIndex((option) => option.correct) };
  });
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
  const [adminLessons, setAdminLessons] = useState(starterLessons.map(lesson => ({ ...lesson, isStarter: true, published: true })));
  const [publishedLessons, setPublishedLessons] = useState(starterLessons.map(lesson => ({ ...lesson, isStarter: true, published: true })));
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonProgress, setLessonProgress] = useState({});
  const [progressBusy, setProgressBusy] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonCategory, setLessonCategory] = useState("Electrical basics");
  const [lessonSummary, setLessonSummary] = useState("");
  const [lessonBody, setLessonBody] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(() => createQuiz());
  const [quizUsedIds, setQuizUsedIds] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizSaveMessage, setQuizSaveMessage] = useState("");
  const [quizSaveBusy, setQuizSaveBusy] = useState(false);
  const startNewQuiz = () => { const excluded = [...new Set([...quizUsedIds, ...quizQuestions.map((item) => item.id)])]; const nextQuiz = createQuiz(excluded); setQuizQuestions(nextQuiz); setQuizUsedIds(nextQuiz.map((item) => item.id)); setQuizAnswers({}); setQuizSubmitted(false); setQuizSaveMessage(""); };
  const quizScore = quizQuestions.filter((item, index) => quizAnswers[index] === item.answer).length;
  const submitQuiz = async (event) => {
    event.preventDefault();
    if (quizSubmitted || Object.keys(quizAnswers).length !== quizQuestions.length) return;
    setQuizSubmitted(true);
    if (!user) { setQuizSaveMessage("Sign in to save this result and build your quiz history."); return; }
    const attempt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      score: quizScore,
      total: quizQuestions.length,
      percentage: Math.round((quizScore / quizQuestions.length) * 100),
      questionIds: quizQuestions.map((item) => item.id),
      topics: [...new Set(quizQuestions.map((item) => item.topic))],
      completedAt: new Date().toISOString()
    };
    setQuizSaveBusy(true);
    setQuizSaveMessage("");
    try {
      await setDoc(doc(db, "users", user.uid), { quizHistory: arrayUnion(attempt) }, { merge: true });
      setQuizHistory((current) => [attempt, ...current.filter((item) => item.id !== attempt.id)]);
      setQuizSaveMessage("Quiz result saved to your account.");
    } catch (error) {
      console.error("Could not save quiz result", error);
      setQuizSaveMessage("Your score is shown, but we couldn’t save it. Please try again after checking your connection.");
    } finally { setQuizSaveBusy(false); }
  };
  useEffect(() => onAuthStateChanged(auth, (currentUser) => setUser(currentUser)), []);
  useEffect(() => { if (!welcomeToast) return undefined; const timer = window.setTimeout(() => setWelcomeToast(""), 3500); return () => window.clearTimeout(timer); }, [welcomeToast]);
  useEffect(() => { if (!progressMessage) return undefined; const timer = window.setTimeout(() => setProgressMessage(""), 4000); return () => window.clearTimeout(timer); }, [progressMessage]);
  useEffect(() => { if (!adminMessage) return undefined; const timer = window.setTimeout(() => setAdminMessage(""), 4500); return () => window.clearTimeout(timer); }, [adminMessage]);

  useEffect(() => { let active = true; const loadProgress = async () => { if (!user) { setLessonProgress({}); setQuizHistory([]); return; } try { const profile = await getDoc(doc(db, "users", user.uid)); if (active) { setLessonProgress(profile.exists() ? (profile.data().lessonProgress || {}) : {}); const history = profile.exists() ? (profile.data().quizHistory || []) : []; setQuizHistory([...history].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))); } } catch (error) { console.error("Could not load learning progress and quiz history", error); } }; loadProgress(); return () => { active = false; }; }, [user]);
  const finishLesson = async () => { if (!selectedLesson) return; if (!user) { setProgressMessage("Sign in to save your learning progress."); setSelectedLesson(null); setAuthOpen(true); return; } const lessonId = selectedLesson.id || `lesson-${(selectedLesson.title || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`; const nextProgress = { ...lessonProgress, [lessonId]: { completed: true, completedAt: new Date().toISOString(), title: selectedLesson.title || "Lesson" } }; setProgressBusy(true); setProgressMessage(""); try { await setDoc(doc(db, "users", user.uid), { lessonProgress: nextProgress }, { merge: true }); setLessonProgress(nextProgress); setProgressMessage("Lesson completed — your progress has been saved."); setSelectedLesson(null); } catch (error) { console.error("Could not save lesson progress", error); setProgressMessage("Could not save progress. Please try again."); } finally { setProgressBusy(false); } };
  useEffect(() => { const lessonsQuery = query(collection(db, "lessons"), where("published", "==", true)); const unsubscribe = onSnapshot(lessonsQuery, (snap) => { const stored = snap.docs.map(d => ({ id: d.id, ...d.data() })); const byId = new Map(stored.map(item => [item.id, item])); const originals = starterLessons.map(lesson => ({ ...lesson, ...(byId.get(lesson.id) || {}), id: lesson.id, isStarter: true })); const extras = stored.filter(item => !starterLessons.some(lesson => lesson.id === item.id)); setPublishedLessons([...originals, ...extras].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))); }, (e) => { console.error("Could not listen for published lessons", e); }); return unsubscribe; }, []);
  useEffect(() => { let active = true; const check = async () => { setIsAdmin(false); setAdminOpen(false); if (!user) return; try { const snap = await getDoc(doc(db, "admins", user.uid)); if (active) setIsAdmin(snap.exists() && snap.data()?.role === "admin"); } catch (e) { console.error("Admin check failed", e); if (active) setIsAdmin(false); } }; check(); return () => { active = false; }; }, [user]);
  const openAdminWorkspace = async () => { if (!user || !isAdmin) return; setAdminOpen(true); setAdminMessage(""); setAdminBusy(true); setAdminLessons(starterLessons.map(lesson => ({ ...lesson, isStarter: true, published: true }))); try { const lessonPromise = getDocs(collection(db, "lessons")); const userPromise = getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))); const [ls, us] = await Promise.allSettled([lessonPromise, userPromise]); if (ls.status === "fulfilled") { const stored = ls.value.docs.map(d => ({ id: d.id, ...d.data() })); const byId = new Map(stored.map(item => [item.id, item])); const originals = starterLessons.map(lesson => ({ ...lesson, ...(byId.get(lesson.id) || {}), id: lesson.id, isStarter: true, published: true })); const extras = stored.filter(item => !starterLessons.some(lesson => lesson.id === item.id)); setAdminLessons([...originals, ...extras].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))); } else { console.error("Could not load lesson library", ls.reason); setAdminMessage("Showing the four original lessons. Firestore lessons could not load."); } if (us.status === "fulfilled") setAdminUsers(us.value.docs.map(d => ({ id: d.id, ...d.data() }))); else { console.error("Could not load user profiles", us.reason); setAdminMessage("Lessons are available, but user profiles could not load."); } } catch (e) { console.error(e); setAdminMessage("Showing original lessons. Some admin data could not load."); } finally { setAdminBusy(false); } };
  const editLesson = (lesson) => { setEditingLessonId(lesson.id); setLessonTitle(lesson.title || ""); setLessonCategory(lesson.category || "Electrical basics"); setLessonSummary(lesson.summary || ""); setLessonBody(lesson.body || ""); setAdminMessage("Editing: " + lesson.title); };
  const resetLessonForm = () => { setEditingLessonId(null); setLessonTitle(""); setLessonCategory("Electrical basics"); setLessonSummary(""); setLessonBody(""); };
  const publishLesson = async (event) => { event.preventDefault(); if (!user || !isAdmin || !lessonTitle.trim() || !lessonSummary.trim() || !lessonBody.trim()) return; setAdminBusy(true); setAdminMessage(""); try { const payload = { title: lessonTitle.trim(), category: lessonCategory, summary: lessonSummary.trim(), body: lessonBody.trim(), published: true, updatedAt: serverTimestamp() }; if (editingLessonId) { const existing = adminLessons.find(item => item.id === editingLessonId); if (existing?.isStarter) await setDoc(doc(db, "lessons", editingLessonId), { ...payload, createdBy: user.uid, source: "starter" }, { merge: true }); else await updateDoc(doc(db, "lessons", editingLessonId), payload); setAdminLessons(items => items.map(item => item.id === editingLessonId ? { ...item, ...payload, updatedAt: new Date(), published: true } : item)); setAdminMessage("Lesson updated and published successfully."); } else { const ref = await addDoc(collection(db, "lessons"), { ...payload, createdBy: user.uid, createdAt: serverTimestamp() }); setAdminLessons(items => [{ id: ref.id, ...payload, createdAt: new Date(), isStarter: false }, ...items]); setAdminMessage("Lesson published successfully."); } resetLessonForm(); } catch (e) { console.error(e); setAdminMessage("Could not save lesson. Check Firestore rules and connection."); } finally { setAdminBusy(false); } };
  const removeLesson = async (id) => { const lesson = adminLessons.find(item => item.id === id); if (!user || !isAdmin || lesson?.isStarter || !window.confirm("Delete this lesson permanently?")) return; try { await deleteDoc(doc(db, "lessons", id)); setAdminLessons(items => items.filter(item => item.id !== id)); setAdminMessage("Lesson deleted."); } catch (e) { console.error(e); setAdminMessage("Could not delete this lesson. Check Firestore rules."); } };
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

      {adminOpen && isAdmin && <div className="admin-overlay"><section className="admin-workspace" role="dialog" aria-modal="true" aria-labelledby="admin-workspace-title"><header className="admin-workspace-header"><div><span className="section-kicker">VOLTCARE CONTROL ROOM</span><h2 id="admin-workspace-title">Admin workspace</h2><p>{user?.email}</p></div><button className="admin-close" type="button" onClick={() => setAdminOpen(false)} aria-label="Close"><X size={22}/></button></header>{adminMessage && <p className="admin-message" role="status">{adminMessage}</p>}{adminBusy && <p className="admin-message">Loading / saving…</p>}<div className="admin-stat-grid"><article><span>Registered profiles</span><strong>{adminUsers.length}</strong></article><article><span>Learning resources</span><strong>{adminLessons.length}</strong></article><article><span>Admin access</span><strong>Verified</strong></article></div><div className="admin-content-grid"><section className="admin-card"><span className="section-kicker">CONTENT MANAGEMENT</span><h3>{editingLessonId ? "Edit lesson" : "Publish a lesson"}</h3><p className="admin-form-hint">{editingLessonId ? "Make your corrections, then save the updated lesson." : "Create a new lesson for the Learning Centre."}</p><form className="admin-lesson-form" onSubmit={publishLesson}><label>Title<input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} required maxLength="100" placeholder="e.g. Circuit breakers"/></label><label>Category<select value={lessonCategory} onChange={e=>setLessonCategory(e.target.value)}><option>Electrical basics</option><option>Power systems</option><option>Solar energy</option><option>Electrical safety</option><option>Energy efficiency</option><option>FUNDAMENTALS</option><option>POWER</option><option>ENERGY</option><option>SOLAR PLANNING</option></select></label><label>Summary<textarea value={lessonSummary} onChange={e=>setLessonSummary(e.target.value)} required rows="2" maxLength="240"/></label><label>Lesson content<textarea value={lessonBody} onChange={e=>setLessonBody(e.target.value)} required rows="5" placeholder="Write the lesson…"/></label><button className="button button-primary" disabled={adminBusy} type="submit">{adminBusy ? "Saving…" : editingLessonId ? "Save changes" : "Publish lesson"} <ArrowRight size={16}/></button>{editingLessonId && <button className="button button-secondary" type="button" onClick={resetLessonForm}>Cancel edit</button>}</form></section><section className="admin-card"><span className="section-kicker">REGISTERED USERS</span><h3>User profiles</h3>{adminUsers.length ? <div className="admin-user-list">{adminUsers.map(p=><article key={p.id}><span className="admin-user-avatar"><UserRound size={17}/></span><div><strong>{p.name||"Name not provided"}</strong><small>@{p.username||"no-username"} · {p.email||"No email"}</small></div></article>)}</div> : <p className="admin-empty">No profiles found.</p>}</section></div><section className="admin-card admin-lessons-card"><span className="section-kicker">LESSON LIBRARY</span><h3>Learning resources ({adminLessons.length})</h3><p className="admin-form-hint">Includes the four original VoltCare lessons and all lessons published from this workspace.</p>{adminLessons.length ? <div className="admin-lesson-list">{adminLessons.map(l=><article key={l.id} className="admin-lesson-row"><div><strong>{l.title}</strong><small>{l.category} · {l.summary}</small><span className="admin-lesson-source">{l.isStarter ? "Original lesson" : "Published lesson"} · {l.published === false ? "Draft" : "Published"}</span></div><div className="admin-lesson-actions"><button type="button" className="admin-edit-button" onClick={()=>editLesson(l)} aria-label={"Edit "+l.title}>Edit</button>{!l.isStarter && <button type="button" className="admin-delete-button" onClick={()=>removeLesson(l.id)} aria-label={"Delete "+l.title}><X size={17}/></button>}</div></article>)}</div> : <p className="admin-empty">No lessons found.</p>}</section><p className="admin-security-note"><ShieldCheck size={16}/> Admin access is controlled by a protected admins/{'{uid}'} document. Do not grant admin status through user profile fields.</p></section></div>}
      {welcomeToast && <div className="welcome-toast" role="status"><span className="welcome-toast-icon"><Check size={18} /></span><span>{welcomeToast}</span><button type="button" onClick={() => setWelcomeToast("")} aria-label="Dismiss message"><X size={16} /></button></div>}
      {profileOpen && <div className="auth-overlay" onClick={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}><section className="auth-dialog profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="auth-close" type="button" onClick={() => setProfileOpen(false)} aria-label="Close settings"><X size={20} /></button><span className="section-kicker">ACCOUNT SETTINGS</span><h2 id="profile-title">Edit your profile</h2><p className="auth-intro">Update the name and username shown on your VoltCare account.</p><form className="auth-form" onSubmit={saveProfile}><label htmlFor="profile-name">Full name</label><input id="profile-name" type="text" autoComplete="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required minLength="2" placeholder="Your name" /><label htmlFor="profile-username">Username</label><input id="profile-username" type="text" autoComplete="username" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" title="Use 3–20 letters, numbers, or underscores" placeholder="your_username" /><small className="auth-field-hint">3–20 characters; letters, numbers, and underscores only.</small><label>Email address</label><input type="email" value={user?.email || ""} readOnly /><small className="auth-field-hint">Email changes are not available here yet.</small>{profileMessage && <p className="auth-message" role="alert">{profileMessage}</p>}<button className="button button-primary auth-submit" type="submit" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save profile"} <Check size={16} /></button></form></section></div>}
      {authOpen && <div className="auth-overlay" onClick={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close dialog"><X size={20} /></button><span className="section-kicker">YOUR VOLTCARE ACCOUNT</span><h2 id="auth-title">{authMode === "register" ? "Create your account" : "Welcome back"}</h2><p className="auth-intro">{authMode === "register" ? "Create an account with your email address." : "Sign in to your VoltCare account."}</p><button className="google-auth-button" type="button" onClick={handleGoogleSignIn} disabled={authBusy}><span className="google-g" aria-hidden="true">G</span>Continue with Google</button><div className="auth-divider"><span>or continue with email</span></div><form className="auth-form" onSubmit={submitAuth}>{authMode === "register" && <><label htmlFor="auth-name">Full name</label><input id="auth-name" type="text" autoComplete="name" value={authName} onChange={(e) => setAuthName(e.target.value)} required minLength="2" placeholder="Enter your name" /><label htmlFor="auth-username">Username</label><input id="auth-username" type="text" autoComplete="username" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" title="Use 3–20 letters, numbers, or underscores" placeholder="e.g. ademola_coder" /><small className="auth-field-hint">3–20 characters; letters, numbers, and underscores only.</small></>}<label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required placeholder="you@example.com" /><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength="6" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required placeholder="At least 6 characters" />{authMessage && <p className="auth-message" role="alert">{authMessage}</p>}<button className="button button-primary auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"} <ArrowRight size={16} /></button></form><p className="auth-switch">{authMode === "register" ? "Already have an account?" : "New to VoltCare?"} <button type="button" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setAuthMessage(""); }}>{authMode === "register" ? "Sign in" : "Create account"}</button></p></section></div>}
      {selectedLesson && <div className="lesson-reader-overlay" onClick={(event) => { if (event.target === event.currentTarget) setSelectedLesson(null); }}><article className="lesson-reader" role="dialog" aria-modal="true" aria-labelledby="lesson-reader-title"><div className="lesson-reader-top"><span className="section-kicker">VOLTCARE LEARNING CENTRE</span><button className="lesson-reader-close" type="button" onClick={() => setSelectedLesson(null)} aria-label="Close lesson"><X size={20} /></button></div><span className="lesson-reader-category">{selectedLesson.category || "ELECTRICAL ENGINEERING"}</span><h2 id="lesson-reader-title">{selectedLesson.title}</h2><p className="lesson-reader-summary">{selectedLesson.summary}</p>{selectedLesson.formula && <div className="lesson-reader-formula">{selectedLesson.formula}</div>}<div className="lesson-reader-body">{(selectedLesson.body || "Lesson notes have not been added yet.").split("\n").map((line, index) => line.trim() ? <p key={index}>{line}</p> : <br key={index} />)}</div><div className="lesson-reader-footer"><span><BookOpen size={16} /> Learn at your own pace</span><button className="button button-primary" type="button" onClick={finishLesson} disabled={progressBusy}>{progressBusy ? "Saving progress…" : "Mark as completed"} <Check size={16} /></button></div></article></div>}
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
          <article className="learning-progress-panel"><div className="learning-progress-heading"><span className="dashboard-stat-icon"><BookOpen size={19} /></span><div><span className="dashboard-stat-label">LEARNING PROGRESS</span><h3>Your learning journey</h3><p>{Object.values(lessonProgress).filter((item) => item?.completed).length} lessons completed so far</p></div></div><div className="learning-progress-track"><span style={{ width: `${Math.min(100, Math.round((Object.values(lessonProgress).filter((item) => item?.completed).length / Math.max(4, 4 + publishedLessons.length)) * 100))}%` }} /></div><div className="learning-progress-meta"><span>{Math.min(Object.values(lessonProgress).filter((item) => item?.completed).length, 4 + publishedLessons.length)} of {4 + publishedLessons.length} lessons completed</span><a href="#learn">Continue learning <ArrowRight size={14} /></a></div></article>
          {progressMessage && <p className="progress-feedback" role="status">{progressMessage}</p>}
          <article className="quiz-history-panel">
            <div className="learning-progress-heading"><span className="dashboard-stat-icon"><Check size={19} /></span><div><span className="dashboard-stat-label">QUIZ PERFORMANCE</span><h3>Your quiz history</h3><p>{quizHistory.length} saved attempt{quizHistory.length === 1 ? "" : "s"} · average {quizHistory.length ? Math.round(quizHistory.reduce((sum, item) => sum + Number(item.percentage ?? (item.score / item.total) * 100), 0) / quizHistory.length) : 0}% · best {quizHistory.length ? Math.max(...quizHistory.map((item) => Number(item.percentage ?? (item.score / item.total) * 100))) : 0}%</p></div></div>
            {quizHistory.length ? <div className="quiz-history-list">{quizHistory.slice(0, 5).map((attempt) => <div className="quiz-history-row" key={attempt.id}><span><strong>{attempt.score}/{attempt.total}</strong><small>{new Date(attempt.completedAt).toLocaleDateString()}</small></span><span className="quiz-history-bar"><i style={{ width: `${attempt.percentage ?? Math.round(attempt.score / attempt.total * 100)}%` }} /></span><b>{attempt.percentage ?? Math.round(attempt.score / attempt.total * 100)}%</b></div>)}</div> : <p className="quiz-history-empty">Complete a quiz while signed in and your results will appear here.</p>}
            <a className="dashboard-action-link" href="#learn"><span><BookOpen size={18} /> Take a ten-question quiz</span><ArrowRight size={16} /></a>
          </article>
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
            {publishedLessons.filter(lesson => lesson.isStarter).map((lesson, index) => <article className="lesson-card lesson-card-interactive" key={lesson.id}><span className="lesson-number">LESSON {String(index + 1).padStart(2, "0")} · {lesson.category}</span><h3>{lesson.title}</h3><p>{lesson.summary}</p>{lesson.formula && <div className="lesson-formula">{lesson.formula}</div>}<button className="text-link lesson-read-button" type="button" onClick={() => setSelectedLesson({ ...lesson })}>Read full lesson <ArrowRight size={15} /></button></article>)}
            {publishedLessons.filter(lesson => !lesson.isStarter).map((lesson, index) => <article className="lesson-card lesson-card-interactive" key={lesson.id}><span className="lesson-number">COMMUNITY LESSON · {String(index + 1).padStart(2, "0")}</span><h3>{lesson.title}</h3><p>{lesson.summary}</p><span className="lesson-category">{lesson.category}</span><button className="text-link lesson-read-button" type="button" onClick={() => setSelectedLesson({ id: `community-${lesson.id}`, title: lesson.title, category: lesson.category, summary: lesson.summary, body: lesson.body || "", formula: lesson.formula || "" })}>Read full lesson <ArrowRight size={15} /></button></article>)}
          </div>
          <p className="learning-safety"><CircleHelp size={17} /> These lessons are introductory. Real installations require correct equipment ratings, protection, local-code compliance, and qualified assessment.</p>

          <section className="quiz-panel" aria-labelledby="quiz-heading">
            <div className="quiz-heading-row"><div><span className="section-kicker">QUICK KNOWLEDGE CHECK</span><h3 id="quiz-heading">Test what you’ve learned</h3><p>Answer ten randomized questions on electrical fundamentals, energy, battery planning, solar, and safety. You’ll see your score and explanations when you submit.</p></div><span className="quiz-badge"><Check size={14} /> 10 questions</span></div>
            <form onSubmit={submitQuiz}>
              <div className="quiz-question-list">
                {quizQuestions.map((item, index) => <fieldset className="quiz-question" key={item.id}>
                  <legend><span>{String(index + 1).padStart(2, "0")}</span>{item.question}</legend>
                  <div className="quiz-options">{item.options.map((option, optionIndex) => <label className={quizSubmitted && optionIndex === item.answer ? "quiz-option quiz-option-correct" : quizSubmitted && quizAnswers[index] === optionIndex && optionIndex !== item.answer ? "quiz-option quiz-option-wrong" : "quiz-option"} key={option}><input type="radio" name={`quiz-${index}`} value={optionIndex} checked={quizAnswers[index] === optionIndex} disabled={quizSubmitted} onChange={() => setQuizAnswers((current) => ({ ...current, [index]: optionIndex }))} /><span>{option}</span>{quizSubmitted && optionIndex === item.answer && <Check size={16} />}</label>)}</div>
                  {quizSubmitted && <p className="quiz-explanation">{quizAnswers[index] === item.answer ? "Correct! " : "Review: "}{item.explanation}</p>}
                </fieldset>)}
              </div>
              {quizSubmitted ? <div className="quiz-result" role="status"><div><span className="section-kicker">YOUR RESULT</span><strong>{quizScore} / {quizQuestions.length}</strong><p>{quizScore === quizQuestions.length ? "Excellent work — you’ve mastered this set!" : quizScore >= 7 ? "Good effort! Review the explanations and try again." : "Keep learning. Read the lessons above, then give it another try."}</p></div><button className="button button-secondary" type="button" onClick={startNewQuiz}>Try another set</button></div>{quizSaveMessage && <p className="quiz-save-feedback" role="status">{quizSaveBusy ? "Saving your score…" : quizSaveMessage}</p>} : <div className="quiz-actions"><span>{Object.keys(quizAnswers).length} of {quizQuestions.length} answered</span><button className="button button-primary" type="submit" disabled={Object.keys(quizAnswers).length !== quizQuestions.length}>Submit answers <ArrowRight size={16} /></button></div>}
            </form>
            {user && <article className="quiz-history-panel quiz-history-inline">
              <div className="learning-progress-heading"><span className="dashboard-stat-icon"><Check size={19} /></span><div><span className="dashboard-stat-label">YOUR PERFORMANCE</span><h3>Quiz history &amp; stats</h3><p>{quizHistory.length} attempt{quizHistory.length === 1 ? "" : "s"} saved · average {quizHistory.length ? Math.round(quizHistory.reduce((sum, item) => sum + Number(item.percentage ?? (item.score / item.total) * 100), 0) / quizHistory.length) : 0}% · best {quizHistory.length ? Math.max(...quizHistory.map((item) => Number(item.percentage ?? (item.score / item.total) * 100))) : 0}%</p></div></div>
              {quizHistory.length ? <div className="quiz-history-list">{quizHistory.slice(0, 5).map((attempt) => <div className="quiz-history-row" key={attempt.id}><span><strong>{attempt.score}/{attempt.total}</strong><small>{new Date(attempt.completedAt).toLocaleDateString()}</small></span><span className="quiz-history-bar"><i style={{ width: `${attempt.percentage ?? Math.round(attempt.score / attempt.total * 100)}%` }} /></span><b>{attempt.percentage ?? Math.round(attempt.score / attempt.total * 100)}%</b></div>)}</div> : <p className="quiz-history-empty">Your saved attempts will appear here after you complete a quiz while signed in.</p>}
            </article>}
          </section>

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