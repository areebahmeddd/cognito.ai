"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "What file formats does cognito.ai support?",
    answer:
      "We support a wide range of forensic file formats including UFDR, PDF, DOC, DOCX, TXT, JSON, XML, CSV, LOG, PCAP, ZIP, RAR, and 7Z files.",
  },
  {
    question: "How secure is my forensic data?",
    answer:
      "Your data security is our top priority. All data is encrypted in transit and at rest, and we follow industry-standard security practices to protect your sensitive forensic information.",
  },
  {
    question: "Can I try cognito.ai before purchasing?",
    answer:
      "Yes! We offer a free 14-day trial with full access to all features. No credit card required to get started.",
  },
  {
    question: "How accurate is the AI analysis?",
    answer:
      "Our AI models are trained specifically on forensic data patterns and achieve high accuracy rates. However, we always recommend human verification for critical findings.",
  },
  {
    question: "Do you offer enterprise support?",
    answer:
      "Yes, we provide dedicated enterprise support with custom integrations, priority support, and advanced security features for large organizations.",
  },
  {
    question: "Can I export my analysis results?",
    answer:
      "Absolutely! You can export your findings in multiple formats including PDF reports, CSV data, and JSON for further analysis in other tools.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 lg:py-32 bg-slate-50 dark:bg-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Everything you need to know about cognito.ai
          </p>
        </div>
        <div className="mt-16 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <button
                className="flex w-full items-center justify-between p-6 text-left"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
