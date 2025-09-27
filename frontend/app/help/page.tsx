"use client";

import DashboardNavbar from "@/components/DashboardNavbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

export default function HelpPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const mockAuth = localStorage.getItem("cognito-auth");
      setIsAuthenticated(mockAuth === "true");
    };

    checkAuth();

    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("cognito-auth")
    ) {
      window.location.href = "/";
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] dark:bg-[#0F0F0F]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#FF7F50]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0F0F0F]">
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-[#2A2A2A] dark:text-[#E0E0E0]">
                  Help & <span className="text-[#FF7F50]">Support</span>
                </h1>
                <p className="mt-2 text-[#4A4A4A] dark:text-[#B0B0B0] font-light">
                  Get help with using cognito.ai and find answers to common
                  questions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-[#FFF5F0] dark:bg-[#2A1A0F] flex items-center justify-center border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
                      <svg
                        className="h-5 w-5 text-[#FF7F50]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      Getting Started
                    </h3>
                  </div>
                  <p className="text-[#4A4A4A] dark:text-[#B0B0B0] mb-4">
                    Learn the basics of using cognito.ai for forensic analysis
                  </p>
                  <button
                    onClick={() =>
                      window.open(
                        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        "_blank",
                      )
                    }
                    className="text-[#FF7F50] font-medium"
                  >
                    View Guide →
                  </button>
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-[#FFF5F0] dark:bg-[#2A1A0F] flex items-center justify-center border border-[#FF7F50]/20 dark:border-[#FF7F50]/30">
                      <svg
                        className="h-5 w-5 text-[#FF7F50]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                      Documentation
                    </h3>
                  </div>
                  <p className="text-[#4A4A4A] dark:text-[#B0B0B0] mb-4">
                    Comprehensive documentation and API references
                  </p>
                  <button
                    onClick={() => (window.location.href = "/docs")}
                    className="text-[#FF7F50] font-medium"
                  >
                    Read Docs →
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-6">
                  Frequently Asked{" "}
                  <span className="text-[#FF7F50]">Questions</span>
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      question: "How do I create a new case?",
                      answer:
                        "Click on the 'Create new case' card on the cases page, enter a case name and description, then upload your forensic files.",
                    },
                    {
                      question: "What file formats are supported?",
                      answer:
                        "We support UFDR files, PDF documents, text files, and various forensic data formats commonly used in digital investigations.",
                    },
                    {
                      question: "How does the AI analysis work?",
                      answer:
                        "Our AI uses natural language processing to understand your queries and searches through your forensic data to find relevant evidence and patterns.",
                    },
                    {
                      question: "Is my data secure?",
                      answer:
                        "Yes, all data is encrypted and stored securely. We follow industry best practices for data protection and privacy.",
                    },
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="border border-[#E0E0E0] dark:border-[#2A2A2A] rounded-lg"
                    >
                      <button
                        onClick={() =>
                          setExpandedFAQ(expandedFAQ === index ? null : index)
                        }
                        className="w-full px-4 py-3 text-left flex items-center justify-between"
                      >
                        <h4 className="font-medium text-[#2A2A2A] dark:text-[#E0E0E0]">
                          {faq.question}
                        </h4>
                        <svg
                          className={`w-5 h-5 text-[#FF7F50] transition-transform ${
                            expandedFAQ === index ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {expandedFAQ === index && (
                        <div className="px-4 pb-3">
                          <p className="text-[#4A4A4A] dark:text-[#B0B0B0]">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E0E0E0] dark:border-[#2A2A2A] p-6">
                <h3 className="text-lg font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-4">
                  Contact <span className="text-[#FF7F50]">Support</span>
                </h3>
                <div>
                  <h4 className="font-medium text-[#2A2A2A] dark:text-[#E0E0E0] mb-2">
                    Email Support
                  </h4>
                  <p className="text-[#4A4A4A] dark:text-[#B0B0B0] mb-3">
                    Get help via email within 24 hours
                  </p>
                  <button className="px-4 py-2 bg-[#FF7F50] text-white rounded-md">
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
