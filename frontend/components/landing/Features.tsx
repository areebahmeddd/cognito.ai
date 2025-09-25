import { BarChart3, Brain, FileText, Search, Shield, Zap } from "lucide-react";

const features = [
  {
    name: "Natural Language Search",
    description:
      "Ask questions in plain English and get instant answers from your forensic data.",
    icon: Search,
  },
  {
    name: "Crypto Address Extraction",
    description:
      "Automatically identify and extract cryptocurrency addresses from communications.",
    icon: Shield,
  },
  {
    name: "Real-time Analysis",
    description:
      "Process and analyze data in real-time with lightning-fast search capabilities.",
    icon: Zap,
  },
  {
    name: "AI-Powered Insights",
    description:
      "Leverage advanced AI to uncover patterns and connections in your data.",
    icon: Brain,
  },
  {
    name: "Multi-format Support",
    description:
      "Upload and analyze various file formats including PDFs, documents, and logs.",
    icon: FileText,
  },
  {
    name: "Visual Analytics",
    description:
      "Get comprehensive reports and visualizations of your forensic findings.",
    icon: BarChart3,
  },
];

export default function Features() {
  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Powerful Features for Forensic Analysis
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Everything you need to analyze forensic data efficiently and
            effectively.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {feature.name}
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
