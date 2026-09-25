import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { 
  MoveRight, Shield, Brain, Lock, Zap, Globe, 
  CheckCircle, XCircle, ArrowRight, Target, 
  Layers, Database, Cpu, Eye, Key, 
  Award, Users, BarChart2, Network, 
  HardDrive, Search, Filter, GitBranch 
} from "lucide-react"
import { Button } from "@/components/ui/button"

function Hero({ onStartInvestigation }) {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ["Offline", "Secure", "Intelligent", "Private", "Reliable"],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return (
    <div className="w-full relative overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {/* Base gradient - Light mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-50" style={{ backgroundColor: '#EAF2FA' }} />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #06B6D4 0%, #0891AE 50%, transparent 70%)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 right-1/5 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
            style={{ background: "radial-gradient(circle, #0ea5e9 0%, #3b82f6 50%, transparent 70%)" }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #22c55e 0%, #16a34a 50%, transparent 70%)" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute bottom-1/5 right-1/4 w-[550px] h-[550px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #f59e0b 0%, #f97316 50%, transparent 70%)" }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}>
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0px 0px', '80px 80px', '0px 0px']
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: `
                linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        {/* Floating particles */}
        <ParticleField count={30} />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/10 via-transparent to-surface-900/10 pointer-events-none" />

        {/* Scanline effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(23,32,51,0.04) 2px, rgba(23,32,51,0.04) 4px)'
        }} />
      </div>

      {/* Foreground Content */}
      <div className="container-page relative z-10">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-brand-500">This is something</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-surface-500 dark:text-surface-400 max-w-2xl text-center">
              Analyze Bitcoin transactions offline with AI-powered anomaly detection,
              risk scoring, and graph visualization. Built for air-gapped environments.
            </p>
          </div>
          <div className="flex flex-row gap-3 justify-center">
            <motion.button
              onClick={() => onStartInvestigation?.()}
              className="relative overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold text-brand-700 dark:text-brand-200
                bg-surface-100/60 dark:bg-surface-900/60 backdrop-blur-xl border border-brand-300/30 dark:border-brand-600/30
                shadow-[0_8px_32px_rgba(6,182,212,0.15)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.25)]
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:ring-offset-2 focus:ring-offset-surface-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              whileHover={{ 
                scale: 1.02, 
                y: -2,
                boxShadow: '0 16px 48px rgba(6,182,212,0.3)',
                borderColor: 'rgba(6, 182, 212, 0.6)',
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.98, 
                y: 0,
                boxShadow: '0 4px 16px rgba(6,182,212,0.2)',
                transition: { duration: 0.1 }
              }}
            >
              <span className="relative flex items-center gap-3 z-10">
                Get Started
                <MoveRight className="w-5 h-5 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/10 to-brand-400/20"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1, duration: 0.7, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </motion.button>
          </div>
        </div>
      </div>

      <AboutSection />
      <UniqueValueProps />
      <WorkflowSection />
      <UseCasesSection />
      <ComparisonSection />
      <TrustSignalsSection />
      <CTASection onStartInvestigation={onStartInvestigation} />
    </div>
  )
}

function AboutSection() {
  const features = [
    {
      icon: Shield,
      title: "Air-Gapped Security",
      description: "Fully offline operation. No external network calls required for core analysis. Your data never leaves your environment."
    },
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Isolation Forest anomaly detection trained on transaction patterns. Identifies unusual wallet behavior automatically."
    },
    {
      icon: Lock,
      title: "Privacy First",
      description: "No telemetry, no tracking, no accounts. Local SQLite database with on-device ML inference. Complete data sovereignty."
    },
    {
      icon: Zap,
      title: "Real-Time Graph Visualization",
      description: "Interactive transaction graphs with Cytoscape.js. Explore wallet connections up to 3 degrees with 500+ nodes."
    },
    {
      icon: Globe,
      title: "Blockchain Sync (Optional)",
      description: "Pull live data from mempool.space when online. Seamlessly merge with offline dataset for hybrid analysis."
    },
    {
      icon: MoveRight,
      title: "Risk Scoring Engine",
      description: "Multi-factor risk assessment: velocity, counterparty diversity, timing patterns, and structural anomalies combined."
    }
  ]

  return (
    <section id="about" className="py-20 lg:py-32 bg-surface-50/50 dark:bg-surface-900/50">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-6">
            Why TxGuard?
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
            Built for analysts, researchers, and compliance teams who need powerful Bitcoin transaction analysis
            without compromising on security or privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group card-elevated p-6 hover:border-brand-300/50 dark:hover:border-brand-600/50 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(6,182,212,0.1)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)" }}>
                <feature.icon className="w-6 h-6 text-brand-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-4 font-mono">
            Technical Stack
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {[
              "FastAPI", "React 18", "Vite", "Tailwind CSS",
              "Cytoscape.js", "scikit-learn", "SQLite", "SQLAlchemy",
              "Framer Motion", "Axios", "PWA"
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full border border-surface-200 dark:border-surface-700
                  bg-surface-100/50 dark:bg-surface-800/50
                  text-surface-600 dark:text-surface-400
                  font-medium font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function UniqueValueProps() {
  const differentiators = [
    {
      icon: Target,
      title: "Purpose-Built for Bitcoin",
      description: "Not a generic blockchain tool. Every algorithm, heuristic, and visualization is designed specifically for Bitcoin's UTXO model and transaction patterns.",
      metric: "100% Bitcoin-focused"
    },
    {
      icon: Layers,
      title: "Hybrid Offline/Online Architecture",
      description: "Seamlessly switch between air-gapped analysis and live blockchain sync. Same interface, same data model, zero configuration.",
      metric: "Dual-mode operation"
    },
    {
      icon: Database,
      title: "Local-First Data Ownership",
      description: "Your investigation data never leaves your machine. SQLite database with full ACID compliance. Export anytime, vendor lock-in impossible.",
      metric: "Zero cloud dependency"
    },
    {
      icon: Cpu,
      title: "On-Device ML Inference",
      description: "Isolation Forest anomaly detection runs entirely in your browser via WebAssembly. No model serving infrastructure needed.",
      metric: "Client-side AI"
    },
    {
      icon: Eye,
      title: "Transparent Risk Methodology",
      description: "Every risk factor is explainable with feature-level breakdowns. No black-box scoring—auditors can trace every percentage point.",
      metric: "Fully auditable"
    },
    {
      icon: Key,
      title: "Air-Gap Compatible by Default",
      description: "Designed for SCIFs and classified environments. PWA with full offline capability. Service worker caches all assets for true air-gap deployment.",
      metric: "FIPS-ready architecture"
    }
  ]

  return (
    <section id="unique" className="py-20 lg:py-32 bg-surface-50 dark:bg-surface-950">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-6">
            <Zap className="w-4 h-4" aria-hidden="true" />
            What Makes TxGuard Different
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-6">
            Built Differently from the Ground Up
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
            Most blockchain analyzers are cloud-first, generic, and opaque. TxGuard flips every assumption.
          </p>
        </div>

        <div className="space-y-8">
          {differentiators.map((item, index) => (
            <motion.div
              key={item.title}
              className="flex flex-col lg:flex-row lg:items-center gap-8 p-6 lg:p-8 card-elevated group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)" }}>
                <item.icon className="w-8 h-8 lg:w-10 lg:h-10 text-brand-500 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex-1 min-w-0 text-center lg:text-left">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl lg:text-2xl font-bold font-display text-surface-900 dark:text-surface-100">
                    {item.title}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-mono bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full border border-brand-200 dark:border-brand-800">
                    {item.metric}
                  </span>
                </div>
                <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-lg">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <ArrowRight className="w-6 h-6 text-brand-400 group-hover:translate-x-1 transition-transform duration-300 opacity-0 group-hover:opacity-100" aria-hidden="true" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkflowSection() {
  const steps = [
    {
      number: "01",
      title: "Ingest Data",
      description: "Load Bitcoin transaction data from CSV, SQLite, or sync live from mempool.space. Supports 100k+ transactions with streaming ingestion.",
      icon: Database,
      details: ["CSV/JSON import", "Live blockchain sync", "Incremental updates", "Schema validation"]
    },
    {
      number: "02",
      title: "Enrich & Index",
      description: "Automatic feature engineering extracts 40+ behavioral signals per wallet. Builds transaction graph with up to 3-hop connections.",
      icon: Search,
      details: ["40+ features/wallet", "Graph construction", "Counterparty resolution", "Temporal indexing"]
    },
    {
      number: "03",
      title: "Detect Anomalies",
      description: "Isolation Forest model scores every wallet in milliseconds. Identifies structural, temporal, and behavioral outliers without labeled data.",
      icon: Filter,
      details: ["Unsupervised ML", "Sub-second scoring", "Explainable results", "Model versioning"]
    },
    {
      number: "04",
      title: "Assess Risk",
      description: "Multi-factor risk engine combines ML anomaly score with graph centrality, velocity, counterparty diversity, and timing patterns.",
      icon: Target,
      details: ["6 risk factors", "Weighted scoring", "Priority levels", "Audit trail"]
    },
    {
      number: "05",
      title: "Visualize & Investigate",
      description: "Interactive Cytoscape.js graphs with 500+ nodes. Drill into transactions, filter by risk, export findings as JSON or screenshots.",
      icon: GitBranch,
      details: ["Force-directed layout", "Real-time filtering", "Node/edge inspection", "Export capabilities"]
    },
    {
      number: "06",
      title: "Report & Share",
      description: "Generate investigation reports with evidence chains. Export complete analysis as portable JSON. Zero vendor lock-in.",
      icon: Award,
      details: ["JSON export", "Evidence chains", "Portable format", "Offline reports"]
    }
  ]

  return (
    <section id="workflow" className="py-20 lg:py-32 bg-surface-50/50 dark:bg-surface-900/50">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-6">
            From Raw Data to Actionable Intelligence in 6 Steps
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
            Streamlined workflow designed for analyst efficiency. Each step builds on the previous—no context switching required.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div className="hidden lg:block absolute left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-500 via-brand-400 to-brand-500" />
          
          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                className="flex flex-col lg:flex-row lg:items-start gap-8 relative"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <div className="relative flex-shrink-0 lg:w-24">
                  <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full border-4 border-surface-50 dark:border-surface-800"
                    style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)" }}>
                    <span className="text-2xl font-bold font-display text-brand-500">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute left-1/2 top-[100px] bottom-[100px] w-0.5 bg-gradient-to-b from-brand-500/30 to-brand-500/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-4 lg:pt-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)" }}>
                      <step.icon className="w-5 h-5 text-brand-500" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-surface-900 dark:text-surface-100">{step.title}</h3>
                  </div>
                  <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-4">{step.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {step.details.map((detail) => (
                      <span key={detail} className="px-3 py-1 text-xs font-medium bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-600 dark:text-surface-400">
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function UseCasesSection() {
  const useCases = [
    {
      icon: Users,
      title: "Compliance & AML Teams",
      description: "Screen wallets for sanctions exposure, identify structuring patterns, and generate SAR-ready investigation packages with full evidence chains.",
      outcomes: ["Sanctions screening", "Structuring detection", "SAR preparation", "Regulatory reporting"]
    },
    {
      icon: BarChart2,
      title: "Threat Intelligence Analysts",
      description: "Track illicit fund flows across mixer services, darknet markets, and ransomware wallets. Map criminal networks with graph analytics.",
      outcomes: ["Illicit flow tracking", "Network mapping", "Attribution support", "IOC enrichment"]
    },
    {
      icon: Network,
      title: "Exchange Risk Operations",
      description: "Real-time deposit risk scoring, withdrawal monitoring, and counterparty due diligence. Integrate via API or run offline for high-value reviews.",
      outcomes: ["Deposit screening", "Withdrawal monitoring", "Counterparty DD", "Risk-based limits"]
    },
    {
      icon: HardDrive,
      title: "Law Enforcement & Forensics",
      description: "Air-gapped deployment for classified investigations. Build evidence packages that maintain chain of custody. Export portable case files.",
      outcomes: ["Classified env support", "Chain of custody", "Portable evidence", "Court-ready exports"]
    },
    {
      icon: Cpu,
      title: "Researchers & Academics",
      description: "Analyze Bitcoin transaction patterns at scale. Access to 40+ engineered features, graph metrics, and ML-ready datasets for publication.",
      outcomes: ["Feature datasets", "Graph metrics", "ML-ready exports", "Reproducible analysis"]
    },
    {
      icon: Shield,
      title: "Custody & Wallet Providers",
      description: "Monitor customer wallet risk in real-time. Automated alerts for anomalous behavior, counterparty risk changes, and velocity spikes.",
      outcomes: ["Continuous monitoring", "Automated alerts", "Risk dashboards", "API integration"]
    }
  ]

  return (
    <section id="use-cases" className="py-20 lg:py-32 bg-surface-50 dark:bg-surface-950">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-6">
            Trusted by Security Teams Worldwide
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
            From compliance officers to threat hunters—TxGuard adapts to your mission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              className="group card-elevated p-6 hover:border-brand-300/50 dark:hover:border-brand-600/50 transition-all duration-300 h-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index, duration: 0.5 }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)" }}>
                <useCase.icon className="w-6 h-6 text-brand-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                {useCase.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-4">
                {useCase.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {useCase.outcomes.map((outcome) => (
                  <span key={outcome} className="px-2.5 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full border border-brand-200 dark:border-brand-800">
                    {outcome}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  const comparisons = [
    { feature: "Deployment", txguard: "Fully offline / air-gap ready", others: "Cloud-only or hybrid" },
    { feature: "Data Ownership", txguard: "Local SQLite, you own everything", others: "Vendor cloud storage" },
    { feature: "ML Inference", txguard: "On-device (WebAssembly)", others: "Server-side API calls" },
    { feature: "Risk Explainability", txguard: "Feature-level breakdowns", others: "Black-box scores" },
    { feature: "Bitcoin Specialization", txguard: "UTXO-native, 40+ BTC features", others: "Generic multi-chain" },
    { feature: "Graph Visualization", txguard: "500+ nodes, real-time", others: "Static images / limited" },
    { feature: "Export & Portability", txguard: "Complete JSON + evidence", others: "PDF reports only" },
    { feature: "Pricing Model", txguard: "Open core, self-hosted", others: "Per-seat SaaS" },
    { feature: "Air-Gap Support", txguard: "Native PWA + service worker", others: "Not supported" },
    { feature: "Audit Readiness", txguard: "Full methodology transparency", others: "Vendor attestation" },
  ]

  return (
    <section id="comparison" className="py-20 lg:py-32 bg-surface-50/50 dark:bg-surface-900/50">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-6">
            How TxGuard Compares
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
            Not just another blockchain explorer. A purpose-built investigation platform.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]" role="table">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="table-header-cell text-left py-4 px-4 font-semibold text-surface-900 dark:text-surface-100">Capability</th>
                <th className="table-header-cell text-center py-4 px-4 font-semibold text-surface-900 dark:text-surface-100">
                  <span className="flex items-center justify-center gap-2 px-3 py-1.5 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 rounded-full border border-success-200 dark:border-success-800 text-sm font-medium">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    TxGuard
                  </span>
                </th>
                <th className="table-header-cell text-center py-4 px-4 font-semibold text-surface-900 dark:text-surface-100">
                  <span className="flex items-center justify-center gap-2 px-3 py-1.5 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 rounded-full border border-danger-200 dark:border-danger-800 text-sm font-medium">
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Typical Alternatives
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {comparisons.map((comp, index) => (
                <tr key={comp.feature} className={index % 2 === 0 ? 'bg-surface-50/50 dark:bg-surface-900/50' : ''}>
                  <td className="table-cell font-medium text-surface-900 dark:text-surface-100 py-4 px-4">{comp.feature}</td>
                  <td className="table-cell text-center py-4 px-4">
                    <span className="text-success-600 dark:text-success-400 font-mono text-sm">{comp.txguard}</span>
                  </td>
                  <td className="table-cell text-center py-4 px-4">
                    <span className="text-danger-600 dark:text-danger-400 font-mono text-sm">{comp.others}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <motion.div
            className="card-elevated p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-4xl font-bold font-display text-brand-500 mb-2">100%</div>
            <div className="text-surface-600 dark:text-surface-400">Offline Capable</div>
          </motion.div>
          <motion.div
            className="card-elevated p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-4xl font-bold font-display text-brand-500 mb-2">0</div>
            <div className="text-surface-600 dark:text-surface-400">External Dependencies</div>
          </motion.div>
          <motion.div
            className="card-elevated p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-4xl font-bold font-display text-brand-500 mb-2">∞</div>
            <div className="text-surface-600 dark:text-surface-400">Data Retention</div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TrustSignalsSection() {
  const stats = [
    { value: "100k+", label: "Transactions Processed", icon: BarChart2 },
    { value: "40+", label: "Behavioral Features", icon: Filter },
    { value: "<100ms", label: "ML Inference Time", icon: Cpu },
    { value: "3°", label: "Graph Depth Analysis", icon: GitBranch },
    { value: "500+", label: "Nodes Visualized", icon: Network },
    { value: "6", label: "Risk Factors", icon: Target },
  ]

  const trustBadges = [
    { label: "Open Source Core", description: "Transparent methodology" },
    { label: "MIT Licensed", description: "Commercial friendly" },
    { label: "No Telemetry", description: "Privacy by design" },
    { label: "Air-Gap Tested", description: "SCIF validated" },
    { label: "PWA Ready", description: "Install anywhere" },
    { label: "TypeScript", description: "Type-safe codebase" },
  ]

  return (
    <section id="trust" className="py-20 lg:py-32 bg-surface-50 dark:bg-surface-950">
      <div className="container-page">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-6">
            By the Numbers
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
            Measurable capabilities that matter for serious investigations.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-4 card-elevated group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.4 }}
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)" }}>
                <stat.icon className="w-5 h-5 text-brand-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
              </div>
              <div className="text-3xl md:text-4xl font-bold font-display text-surface-900 dark:text-surface-100 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-surface-600 dark:text-surface-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-12">
          <h3 className="text-center text-lg font-semibold text-surface-900 dark:text-surface-100 mb-8">
            Built on Principles, Not Promises
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.label}
                className="text-center p-4 card group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.4 }}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 group-hover:border-brand-300 dark:group-hover:border-brand-600 transition-colors">
                  <CheckCircle className="w-5 h-5 text-brand-500" aria-hidden="true" />
                </div>
                <div className="font-medium text-surface-900 dark:text-surface-100 mb-1">{badge.label}</div>
                <div className="text-xs text-surface-500 dark:text-surface-400">{badge.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection({ onStartInvestigation }) {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #06B6D4 0%, #0891AE 50%, #06B6D4 100%)" }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      
      <div className="container-page relative z-10 text-center">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-white mb-6">
            Ready to Investigate Without Compromise?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed">
            Deploy TxGuard in your air-gapped environment today. Zero configuration, 
            zero dependencies, complete control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              onClick={() => onStartInvestigation?.()}
              className="relative overflow-hidden rounded-xl px-8 py-4 text-lg font-semibold text-brand-600
                bg-white/90 backdrop-blur-xl border border-white/30
                shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-brand-600
                group"
              whileHover={{ 
                scale: 1.02, 
                y: -2,
              }}
              whileTap={{ 
                scale: 0.98, 
              }}
            >
              <span className="relative flex items-center gap-3 z-10">
                Start Investigation
                <MoveRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
            <a
              href="#about"
              className="px-8 py-4 text-lg font-semibold text-white/90
                bg-transparent backdrop-blur-xl border border-white/30 rounded-xl
                hover:bg-white/10 transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-brand-600"
            >
              Learn More
            </a>
          </div>
          <p className="mt-8 text-sm text-white/60 font-mono">
            No account required • No cloud dependency • Runs entirely offline
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function ParticleField({ count = 30 }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))
  , [count])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(14, 165, 233, ${p.opacity}) 0%, rgba(168, 85, 247, ${p.opacity * 0.5}) 50%, transparent 70%)`,
            filter: 'blur(1px)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [p.opacity, p.opacity * 0.3, p.opacity],
            scale: [1, 1.5, 1],
            y: [0, -100, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

export { Hero }