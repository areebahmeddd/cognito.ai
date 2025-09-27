import { MessageSquare, Shield, Zap } from "lucide-react";

const features = [
  {
    name: "Natural Language",
    description:
      "Ask questions in plain English and get instant answers from your forensic data.",
    icon: MessageSquare,
  },
  {
    name: "Privacy First",
    description:
      "Your data stays secure with enterprise-grade encryption and zero-knowledge processing.",
    icon: Shield,
  },
  {
    name: "Lightning Fast",
    description:
      "Get results in seconds, not hours. Our AI processes data at unprecedented speed.",
    icon: Zap,
  },
];

export default function Features() {
  return (
    <section className="py-12 lg:py-20 bg-white dark:bg-[#1A1A1A]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
            Productivity at its <span className="text-[#FF7F50]">best</span>
          </h2>
          <p className="text-lg text-[#4A4A4A] dark:text-[#B0B0B0] font-light max-w-2xl mx-auto">
            Forensic analysis should be tools that help you get things done, not
            distractions that keep you from your work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={feature.name} className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5F0] dark:bg-[#2A1A0F] mb-6 border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
                <feature.icon className="h-8 w-8 text-[#FF7F50]" />
              </div>
              <h3 className="text-xl font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-3">
                {feature.name.split(" ").map((word, idx) =>
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
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
