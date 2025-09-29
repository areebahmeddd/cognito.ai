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
    <section className="py-20 lg:py-32 bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
            How It <span className="text-[#FF7F50]">Works</span>
          </h2>
          <p className="text-lg text-[#4A4A4A] dark:text-[#B0B0B0] font-light max-w-2xl mx-auto">
            Get started with forensic analysis in three simple steps. No
            technical expertise required.
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-8 left-1/2 hidden lg:block w-full -translate-x-1/2">
            <div className="flex justify-between items-center px-8">
              <div className="flex-1 h-0.5 bg-[#E0E0E0] dark:bg-[#4A4A4A]"></div>
              <div className="w-8 h-8 rounded-full bg-[#E0E0E0] dark:bg-[#4A4A4A] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#FF7F50] animate-prominent-glow"></div>
              </div>
              <div className="flex-1 h-0.5 bg-[#E0E0E0] dark:bg-[#4A4A4A]"></div>
              <div className="w-8 h-8 rounded-full bg-[#E0E0E0] dark:bg-[#4A4A4A] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#FF7F50] animate-prominent-glow"></div>
              </div>
              <div className="flex-1 h-0.5 bg-[#E0E0E0] dark:bg-[#4A4A4A]"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 relative z-10">
            {steps.map((step) => (
              <div
                key={step.step}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] border border-[#FF7F50]/20 dark:border-[#FF7F50]/30 mb-6">
                  <step.icon className="h-8 w-8 text-[#FF7F50]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#FF7F50] mb-2">
                    Step {step.step}
                  </div>
                  <h3 className="text-xl font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-3">
                    {step.name.split(" ").map((word, idx) =>
                      idx === 0 ? (
                        <span key={idx} className="text-[#FF7F50]">
                          {word}
                        </span>
                      ) : (
                        ` ${word}`
                      ),
                    )}
                  </h3>
                  <p className="text-[#4A4A4A] dark:text-[#B0B0B0] font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
