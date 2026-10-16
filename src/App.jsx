import { useState } from "react";
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
  PlugZap,
  Sun,
  X,
  Zap,
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

function ElectricalCalculator() {
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
          <p className="formula-note">Uses V = I × R and P = V × I, with equivalent formulas as needed. Intended for basic DC/resistive circuit learning.</p>
        </div>
      </div>
      <p className="calculator-disclaimer">Educational estimate only. AC circuits, power factor, component limits, and local installation requirements may need additional analysis by a qualified professional.</p>
    </section>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell" id="home">
      <div className="announcement">
        <span className="announcement-dot" />
        A smarter way to explore electrical and solar energy
        <ArrowUpRight size={14} aria-hidden="true" />
      </div>

      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#tools" onClick={closeMenu}>Tools</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#learn" onClick={closeMenu}>Learn</a>
            <a className="nav-cta" href="#contact" onClick={closeMenu}>Get started <ArrowRight size={16} /></a>
          </nav>
        </div>
      </header>

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
                <a href={title === "Electrical calculator" ? "#electrical-calculator" : "#contact"} className="text-link">{title === "Electrical calculator" ? "Try calculator" : "Coming soon"} <ArrowUpRight size={15} /></a>
              </article>
            ))}
          </div>
          <div className="tools-note"><span className="note-icon"><CircleHelp size={18} /></span><p><strong>Built around clarity, not guesswork.</strong> Results will show their assumptions and limitations. Installation decisions should always account for local electrical codes and qualified professional advice.</p></div>
        </section>

        <ElectricalCalculator />

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

        <section className="learn-section section-wrap" id="learn">
          <div className="learn-icon"><BookOpen size={25} /></div>
          <div className="learn-copy"><span className="section-kicker">THE LEARNING CORNER</span><h2>Understand the why,<br />not just the answer.</h2><p>Our learning centre will connect formulas to real-world examples, from electrical fundamentals to solar energy planning.</p></div>
          <a className="button button-secondary learn-button" href="#contact">Learning centre <ArrowRight size={16} /></a>
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