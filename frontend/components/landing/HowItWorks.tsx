import { BarChart3, Search, Upload } from "lucide-react";

const steps = [
  {
    step: "01",
    name: "Upload Data",
    description: "Upload your UFDR files and forensic data in various formats.",
    icon: Upload,
  },
  {
    step: "02",
    name: "Ask Questions",
    description:
      "Use natural language to query your data and ask specific questions.",
    icon: Search,
  },
  {
    step: "03",
    name: "Get Insights",
    description:
      "Receive instant, AI-powered insights and detailed analysis reports.",
    icon: BarChart3,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Get started with forensic analysis in three simple steps.
          </p>
        </div>
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Step {step.step}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {step.name}
                    </h3>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-1/2 hidden h-0.5 w-full -translate-x-1/2 bg-slate-300 dark:bg-slate-600 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
