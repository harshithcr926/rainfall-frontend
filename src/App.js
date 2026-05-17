import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from "recharts";

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MODEL_COLORS = {
  "Random Forest":       "#22c55e",
  "Gradient Boosting":   "#3b82f6",
  "Logistic Regression": "#f59e0b",
  "K-Nearest Neighbors": "#a855f7",
  "SVM":                 "#ef4444",
  "Deep Learning (MLP)": "#06b6d4",
};

const FIELD_META = {
  TEMP_MEAN_C:            { label: "Mean Temp (°C)",       min: -5,  max: 50,  step: 0.1, icon: "🌡️"  },
  TEMP_MAX_C:             { label: "Max Temp (°C)",        min: -5,  max: 55,  step: 0.1, icon: "🔥"  },
  TEMP_MIN_C:             { label: "Min Temp (°C)",        min: -10, max: 45,  step: 0.1, icon: "❄️"  },
  HUMIDITY_pct:           { label: "Humidity (%)",         min: 0,   max: 100, step: 0.1, icon: "💧"  },
  SPECIFIC_HUMIDITY_gkg:  { label: "Specific Humidity (g/kg)", min: 0, max: 30, step: 0.01, icon: "🌫️" },
  WIND_SPEED_10m_ms:      { label: "Wind Speed 10m (m/s)", min: 0,   max: 30,  step: 0.1, icon: "💨"  },
  WIND_DIRECTION_deg:     { label: "Wind Direction (°)",   min: 0,   max: 360, step: 1,   icon: "🧭"  },
  SURFACE_PRESSURE_kPa:   { label: "Surface Pressure (kPa)", min: 80, max: 110, step: 0.01, icon: "⬇️" },
  DEW_POINT_C:            { label: "Dew Point (°C)",       min: -20, max: 35,  step: 0.1, icon: "🌡️"  },
  SOLAR_RADIATION_MJm2:   { label: "Solar Radiation (MJ/m²)", min: 0, max: 35, step: 0.01, icon: "☀️" },
  CLOUD_COVER_pct:        { label: "Cloud Cover (%)",      min: 0,   max: 100, step: 0.1, icon: "☁️"  },
  EVAPOTRANSPIRATION_mm:  { label: "Evapotranspiration (mm)", min: 0, max: 15, step: 0.01, icon: "🌿" },
  PRECIPITATION_mm:       { label: "Precipitation (mm)",   min: 0,   max: 300, step: 0.1, icon: "🌧️"  },
};

const DEFAULT_INPUTS = {
  TEMP_MEAN_C: 26,
  TEMP_MAX_C: 32,
  TEMP_MIN_C: 20,
  HUMIDITY_pct: 72,
  SPECIFIC_HUMIDITY_gkg: 12,
  WIND_SPEED_10m_ms: 3.5,
  WIND_DIRECTION_deg: 180,
  SURFACE_PRESSURE_kPa: 100.2,
  DEW_POINT_C: 18,
  SOLAR_RADIATION_MJm2: 5.0,
  CLOUD_COVER_pct: 55,
  EVAPOTRANSPIRATION_mm: 0.5,
  PRECIPITATION_mm: 0.0,
};

// ── COMPONENTS ─────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌧️</span>
          <div>
            <h1 style={styles.title}>RainCast AI</h1>
            <p style={styles.subtitle}>AI-Driven Rainfall Forecast & Analytical System</p>
          </div>
        </div>
        <div style={styles.badge}>
          <span style={styles.badgeDot}></span>
          Mini Project — ML + Deep Learning
        </div>
      </div>
    </header>
  );
}

function InputSlider({ fieldKey, value, onChange }) {
  const meta = FIELD_META[fieldKey];
  const pct = ((value - meta.min) / (meta.max - meta.min)) * 100;
  return (
    <div style={styles.inputCard}>
      <div style={styles.inputHeader}>
        <span style={styles.inputIcon}>{meta.icon}</span>
        <label style={styles.inputLabel}>{meta.label}</label>
        <input
          type="number"
          value={value}
          min={meta.min}
          max={meta.max}
          step={meta.step}
          onChange={e => onChange(fieldKey, parseFloat(e.target.value) || 0)}
          style={styles.numberInput}
        />
      </div>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        onChange={e => onChange(fieldKey, parseFloat(e.target.value))}
        style={{ ...styles.slider, background: `linear-gradient(to right, #3b82f6 ${pct}%, #1e293b ${pct}%)` }}
      />
      <div style={styles.sliderBounds}>
        <span>{meta.min}</span><span>{meta.max}</span>
      </div>
    </div>
  );
}

function ProbGauge({ value }) {
  const color = value < 30 ? "#22c55e" : value < 60 ? "#f59e0b" : "#ef4444";
  const label = value < 30 ? "Low Risk" : value < 60 ? "Moderate" : "High Risk";
  const circumference = 2 * Math.PI * 54;
  const dashoffset = circumference * (1 - value / 100);
  return (
    <div style={styles.gaugeWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px", transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="26" fontWeight="bold">{value}%</text>
        <text x="70" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11">{label}</text>
      </svg>
    </div>
  );
}

function ModelCard({ name, prob, accuracy }) {
  const color = MODEL_COLORS[name] || "#64748b";
  return (
    <div style={{ ...styles.modelCard, borderLeftColor: color }}>
      <div style={styles.modelName}>{name}</div>
      <div style={styles.modelProb}>
        <div style={{ ...styles.modelProbBar, width: `${prob}%`, background: color }}></div>
      </div>
      <div style={{ color, fontWeight: 700, fontSize: 18 }}>{prob}%</div>
      <div style={styles.modelAcc}>Accuracy: {accuracy}%</div>
    </div>
  );
}

function LossCurveChart({ lossCurve }) {
  const data = lossCurve.map((loss, i) => ({ epoch: (i + 1) * 5, loss }));
  return (
    <div style={styles.chartBox}>
      <h3 style={styles.chartTitle}>📉 Deep Learning Training Loss Curve</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="epoch" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Epoch", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip formatter={(v) => v.toFixed(4)} contentStyle={styles.tooltip} />
          <Area type="monotone" dataKey="loss" stroke="#06b6d4" fill="url(#lossGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DLArchDiagram({ layers }) {
  const layerNames = ["Input", "Dense 128\nReLU", "Dense 64\nReLU", "Dense 32\nReLU", "Output\nSigmoid"];
  const colors = ["#334155", "#0e7490", "#0891b2", "#06b6d4", "#22c55e"];
  const W = 520, H = 140;
  const xs = layers.map((_, i) => 40 + i * (W - 60) / (layers.length - 1));
  return (
    <div style={styles.chartBox}>
      <h3 style={styles.chartTitle}>🧠 Neural Network Architecture</h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 140 }}>
        {layers.map((size, i) => {
          if (i < layers.length - 1) {
            return <line key={`l${i}`} x1={xs[i]} y1={H / 2} x2={xs[i + 1]} y2={H / 2}
              stroke="#334155" strokeWidth="2" strokeDasharray="4 2" />;
          }
          return null;
        })}
        {layers.map((size, i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={H / 2} r={28} fill={colors[i]} stroke="#0f172a" strokeWidth="2" />
            <text x={xs[i]} y={H / 2 - 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{size}</text>
            <text x={xs[i]} y={H / 2 + 9} textAnchor="middle" fill="#94a3b8" fontSize="8">{layerNames[i]?.split("\n")[0]}</text>
            <text x={xs[i]} y={H / 2 + 19} textAnchor="middle" fill="#64748b" fontSize="8">{layerNames[i]?.split("\n")[1]}</text>
          </g>
        ))}
      </svg>
      <p style={{ color: "#475569", fontSize: 12, textAlign: "center", margin: "8px 0 0" }}>
        MLP with 3 hidden layers · Adam optimizer · Early stopping · Batch size 64
      </p>
    </div>
  );
}

function AccuracyChart({ accuracies }) {
  const data = Object.entries(accuracies).map(([name, acc]) => ({
    name: name.replace("Logistic Regression", "Log. Reg.").replace("K-Nearest Neighbors", "KNN").replace("Gradient Boosting", "Grad. Boost"),
    accuracy: acc,
    fill: MODEL_COLORS[name] || "#64748b",
  }));
  return (
    <div style={styles.chartBox}>
      <h3 style={styles.chartTitle}>📊 Model Accuracy Comparison</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-20} textAnchor="end" />
          <YAxis domain={[70, 95]} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
          <Tooltip formatter={(v) => `${v}%`} contentStyle={styles.tooltip} />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ImportanceChart({ importances }) {
  const sorted = Object.entries(importances)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => ({
      name: k.replace("_pct", "%").replace("_C", "°C").replace("_ms", " m/s").replace("_mm", " mm").replace("_kPa", " kPa").replace("TEMP_MEAN", "Temp Mean").replace("TEMP_MAX", "Temp Max").replace("TEMP_MIN", "Temp Min").replace("HUMIDITY", "Humidity").replace("SPECIFIC_HUMIDITY_gkg", "Spec. Humid.").replace("WIND_SPEED_10m", "Wind 10m").replace("WIND_DIRECTION_deg", "Wind Dir.").replace("SURFACE_PRESSURE", "Pressure").replace("DEW_POINT", "Dew Point").replace("SOLAR_RADIATION_MJm2", "Solar Rad.").replace("CLOUD_COVER", "Cloud Cover").replace("EVAPOTRANSPIRATION", "Evapotrans.").replace("PRECIPITATION", "Precip."),
      value: v,
    }));
  return (
    <div style={styles.chartBox}>
      <h3 style={styles.chartTitle}>🌟 Feature Importance (Random Forest)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={90} />
          <Tooltip formatter={(v) => `${v}%`} contentStyle={styles.tooltip} />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PredictionPieChart({ predictions }) {
  const data = Object.entries(predictions).map(([name, prob]) => ({
    name: name.replace("Logistic Regression", "Log. Reg.").replace("K-Nearest Neighbors", "KNN"),
    value: prob,
  }));
  const colors = Object.keys(predictions).map(k => MODEL_COLORS[k] || "#64748b");
  return (
    <div style={styles.chartBox}>
      <h3 style={styles.chartTitle}>🥧 Rain Probability by Model</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value}%`} labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} contentStyle={styles.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function RadarChartComp({ inputs }) {
  const keys = ['TEMP_MEAN_C', 'HUMIDITY_pct', 'WIND_SPEED_10m_ms', 'CLOUD_COVER_pct', 'DEW_POINT_C', 'PRECIPITATION_mm'];
  const data = keys.map(k => ({
    subject: FIELD_META[k].label.split(" ")[0],
    value: Math.min(100, Math.max(0, ((inputs[k] - FIELD_META[k].min) / (FIELD_META[k].max - FIELD_META[k].min)) * 100)),
    fullMark: 100,
  }));
  return (
    <div style={styles.chartBox}>
      <h3 style={styles.chartTitle}>📡 Input Parameter Radar</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} />
          <Radar name="Input" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("predict");

  useEffect(() => {
    fetch(`${API_BASE}/api/meta`)
      .then(r => r.json())
      .then(setMeta)
      .catch(() => setError("⚠️ Cannot connect to backend. Make sure Flask server is running on port 5000."));
  }, []);

  const handleChange = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setActiveTab("results");
    } catch (e) {
      setError("Prediction failed: " + e.message);
    }
    setLoading(false);
  };

  const handleReset = () => { setInputs(DEFAULT_INPUTS); setResult(null); setActiveTab("predict"); };

  return (
    <div style={styles.root}>
      <Header />

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.tabs}>
        {["predict", "results", "analytics"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
            {tab === "predict" ? "🎛️ Input Parameters" : tab === "results" ? "🔮 Predictions" : "📈 Analytics"}
          </button>
        ))}
      </div>

      <main style={styles.main}>
        {/* INPUT PANEL */}
        {activeTab === "predict" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Enter Weather Parameters</h2>
              <p style={styles.sectionDesc}>Adjust the sliders or type values for each parameter to get a rainfall prediction.</p>
            </div>
            <div style={styles.inputGrid}>
              {Object.keys(FIELD_META).map(k => (
                <InputSlider key={k} fieldKey={k} value={inputs[k]} onChange={handleChange} />
              ))}
            </div>
            <div style={styles.actionRow}>
              <button onClick={handleReset} style={styles.resetBtn}>↩ Reset</button>
              <button onClick={handlePredict} disabled={loading} style={{ ...styles.predictBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "⏳ Predicting..." : "🚀 Predict Rainfall"}
              </button>
            </div>
          </div>
        )}

        {/* RESULTS PANEL */}
        {activeTab === "results" && (
          <div>
            {!result ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 64 }}>🌤️</div>
                <p style={{ color: "#64748b", marginTop: 16 }}>No prediction yet. Go to Input Parameters and click Predict.</p>
                <button onClick={() => setActiveTab("predict")} style={styles.predictBtn}>Go to Inputs</button>
              </div>
            ) : (
              <div>
                <div style={styles.resultHero}>
                  <ProbGauge value={result.ensemble} />
                  <div style={styles.heroText}>
                    <h2 style={styles.heroTitle}>Ensemble Prediction</h2>
                    <p style={styles.heroSub}>Average across all {Object.keys(result.predictions).length} models</p>
                    <div style={{
                      ...styles.heroVerdict,
                      background: result.ensemble < 30 ? "#15803d22" : result.ensemble < 60 ? "#b4530022" : "#dc262622",
                      color: result.ensemble < 30 ? "#22c55e" : result.ensemble < 60 ? "#f59e0b" : "#ef4444",
                      border: `1px solid ${result.ensemble < 30 ? "#22c55e" : result.ensemble < 60 ? "#f59e0b" : "#ef4444"}`,
                    }}>
                      {result.ensemble < 30 ? "☀️ Unlikely to Rain Tomorrow" : result.ensemble < 60 ? "🌥️ Rain is Possible Tomorrow" : "🌧️ High Chance of Rain Tomorrow"}
                    </div>
                  </div>
                </div>

                <h3 style={{ color: "#cbd5e1", marginBottom: 16, marginTop: 32 }}>Individual Model Predictions</h3>
                <div style={styles.modelGrid}>
                  {Object.entries(result.predictions).map(([name, prob]) => (
                    <ModelCard key={name} name={name} prob={prob} accuracy={meta?.accuracies?.[name] || "–"} />
                  ))}
                </div>

                <div style={styles.chartsGrid}>
                  <PredictionPieChart predictions={result.predictions} />
                  <RadarChartComp inputs={inputs} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS PANEL */}
        {activeTab === "analytics" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Model Analytics</h2>
              <p style={styles.sectionDesc}>Model performance trained on 30,000 samples from India Rainfall Dataset (2015–2024).</p>
            </div>
            {meta ? (
              <>
                <div style={styles.statsRow}>
                  {Object.entries(meta.accuracies).map(([name, acc]) => (
                    <div key={name} style={{ ...styles.statCard, borderTopColor: MODEL_COLORS[name] }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{name}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: MODEL_COLORS[name] }}>{acc}%</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>Accuracy</div>
                    </div>
                  ))}
                </div>
                <div style={styles.chartsGrid}>
                  <AccuracyChart accuracies={meta.accuracies} />
                  <ImportanceChart importances={meta.importances} />
                </div>
                {meta.dl_info && meta.dl_info.layers && (
                  <div>
                    <h3 style={{ color: "#06b6d4", marginTop: 28, marginBottom: 16, fontSize: 17 }}>🧠 Deep Learning — MLP Neural Network</h3>
                    <div style={styles.chartsGrid}>
                      <DLArchDiagram layers={meta.dl_info.layers} />
                      {meta.dl_info.loss_curve && meta.dl_info.loss_curve.length > 1 && (
                        <LossCurveChart lossCurve={meta.dl_info.loss_curve} />
                      )}
                    </div>
                    <div style={{ ...styles.infoBox, borderColor: "#0e7490", marginBottom: 0, marginTop: 16 }}>
                      <h4 style={{ color: "#06b6d4", marginBottom: 10 }}>🔬 Deep Learning Model Details</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                        {[
                          ["Type", meta.dl_info.type],
                          ["Architecture", "Input → 128 → 64 → 32 → Out"],
                          ["Activation", "ReLU (hidden), Sigmoid (out)"],
                          ["Optimizer", "Adam (lr=0.001)"],
                          ["Training Epochs", meta.dl_info.epochs_run],
                          ["Accuracy", `${meta.accuracies['Deep Learning (MLP)']}%`],
                        ].map(([k, v]) => (
                          <div key={k} style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ color: "#475569", fontSize: 11, marginBottom: 3 }}>{k}</div>
                            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div style={styles.infoBox}>
                  <h4 style={{ color: "#3b82f6", marginBottom: 12 }}>📚 About This Project</h4>
                  <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: 14 }}>
                    This system trains <strong style={{ color: "#cbd5e1" }}>5 machine learning models</strong> — Random Forest, Gradient Boosting, Logistic Regression, K-Nearest Neighbors, and SVM — on the India Rainfall Dataset containing <strong style={{ color: "#cbd5e1" }}>146,000+ records</strong> from 2015–2024 across multiple Indian cities and states.
                    <br /><br />
                    The target variable is <code style={styles.code}>RAINFALL_TOMORROW</code> (binary: 0 = no rain, 1 = rain). An ensemble average of all model predictions is shown to reduce individual model bias.
                    <br /><br />
                    <strong style={{ color: "#f59e0b" }}>Note:</strong> For deep learning integration, you can extend the backend with a Keras/TensorFlow MLP model using the same features — the Flask API structure already supports it.
                  </p>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <p style={{ color: "#64748b" }}>⏳ Loading model metadata... (Backend must be running)</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>AI-Driven Rainfall Forecast & Analytical System · Mini Project · Built with React + Flask + Scikit-learn</p>
      </footer>
    </div>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const styles = {
  root: { minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', sans-serif", color: "#e2e8f0" },
  header: { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderBottom: "1px solid #1e3a5f", padding: "20px 0" },
  headerContent: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  logo: { display: "flex", alignItems: "center", gap: 14 },
  logoIcon: { fontSize: 40 },
  title: { margin: 0, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: -0.5 },
  subtitle: { margin: 0, fontSize: 13, color: "#64748b" },
  badge: { display: "flex", alignItems: "center", gap: 8, background: "#1e3a5f", border: "1px solid #3b82f6", borderRadius: 999, padding: "6px 16px", fontSize: 13, color: "#93c5fd" },
  badgeDot: { width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 2s infinite" },
  tabs: { maxWidth: 1200, margin: "24px auto 0", padding: "0 24px", display: "flex", gap: 8, flexWrap: "wrap" },
  tab: { padding: "10px 22px", borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a", color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s" },
  tabActive: { background: "#1e3a5f", border: "1px solid #3b82f6", color: "#93c5fd" },
  main: { maxWidth: 1200, margin: "24px auto", padding: "0 24px 80px" },
  sectionHeader: { marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 },
  sectionDesc: { color: "#64748b", fontSize: 14, marginTop: 6 },
  inputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  inputCard: { background: "#1e293b", borderRadius: 12, padding: 16, border: "1px solid #334155" },
  inputHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  inputIcon: { fontSize: 20 },
  inputLabel: { fontSize: 13, color: "#94a3b8", flex: 1 },
  numberInput: { width: 70, background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#fff", padding: "4px 8px", fontSize: 14, textAlign: "right" },
  slider: { width: "100%", appearance: "none", height: 6, borderRadius: 3, outline: "none", cursor: "pointer", marginBottom: 4 },
  sliderBounds: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569" },
  actionRow: { display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end", flexWrap: "wrap" },
  resetBtn: { padding: "12px 24px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", cursor: "pointer", fontSize: 15 },
  predictBtn: { padding: "12px 32px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 20px #3b82f633" },
  emptyState: { textAlign: "center", padding: "80px 20px" },
  resultHero: { display: "flex", alignItems: "center", gap: 32, background: "#1e293b", borderRadius: 16, padding: 28, border: "1px solid #334155", flexWrap: "wrap" },
  gaugeWrap: { flexShrink: 0 },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" },
  heroSub: { color: "#64748b", fontSize: 14, marginBottom: 14 },
  heroVerdict: { display: "inline-block", borderRadius: 10, padding: "10px 20px", fontSize: 16, fontWeight: 700 },
  modelGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 },
  modelCard: { background: "#1e293b", borderRadius: 12, padding: 16, border: "1px solid #334155", borderLeft: "4px solid #64748b" },
  modelName: { fontSize: 13, color: "#94a3b8", marginBottom: 10, fontWeight: 600 },
  modelProb: { height: 6, background: "#0f172a", borderRadius: 3, marginBottom: 8, overflow: "hidden" },
  modelProbBar: { height: "100%", borderRadius: 3, transition: "width 0.8s ease" },
  modelAcc: { fontSize: 11, color: "#475569", marginTop: 4 },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16, marginTop: 24 },
  chartBox: { background: "#1e293b", borderRadius: 14, padding: 20, border: "1px solid #334155" },
  chartTitle: { color: "#cbd5e1", fontSize: 15, fontWeight: 700, marginBottom: 12, marginTop: 0 },
  tooltip: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 24 },
  statCard: { background: "#1e293b", borderRadius: 12, padding: 16, border: "1px solid #334155", borderTop: "3px solid", textAlign: "center" },
  infoBox: { background: "#1e293b", borderRadius: 14, padding: 24, border: "1px solid #1e3a5f", marginTop: 24 },
  code: { background: "#0f172a", borderRadius: 4, padding: "2px 6px", color: "#22c55e", fontSize: 13, fontFamily: "monospace" },
  errorBanner: { maxWidth: 1200, margin: "16px auto 0", padding: "12px 24px", background: "#450a0a", border: "1px solid #ef4444", borderRadius: 10, color: "#fca5a5", fontSize: 14 },
  footer: { textAlign: "center", padding: "20px", color: "#334155", fontSize: 13, borderTop: "1px solid #1e293b" },
};
