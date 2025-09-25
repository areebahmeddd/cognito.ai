"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export default function CTASection() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignIn = () => {
    setIsSignedIn(true);
    // Mock sign in - redirect to dashboard
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 500);
  };

  return (
    <section className="py-20 lg:py-32 bg-slate-900 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Transform Your Forensic Analysis?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Join thousands of investigators who trust cognito.ai for their
            forensic data analysis needs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              size="lg"
              onClick={handleSignIn}
              className="group bg-white px-6 py-3 text-slate-900 hover:bg-slate-100"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-white hover:bg-slate-800"
            >
              Contact Sales
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            No credit card required • Free 14-day trial
          </p>
        </div>
      </div>
    </section>
  );
}
