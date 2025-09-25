const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Digital Forensics Analyst",
    company: "Cyber Security Solutions",
    content:
      "cognito.ai has revolutionized how we analyze forensic data. The natural language search saves us hours of manual work.",
    avatar: "SJ",
  },
  {
    name: "Michael Chen",
    role: "Lead Investigator",
    company: "Law Enforcement Agency",
    content:
      "The AI-powered insights help us uncover connections we would have missed. It's become an essential tool in our investigations.",
    avatar: "MC",
  },
  {
    name: "Dr. Emily Rodriguez",
    role: "Forensic Expert",
    company: "Private Practice",
    content:
      "The accuracy and speed of crypto address extraction is impressive. It's made our analysis process much more efficient.",
    avatar: "ER",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Trusted by Forensic Professionals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            See what our users say about cognito.ai
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-8"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {testimonial.company}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
