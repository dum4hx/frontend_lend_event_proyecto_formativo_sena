import { Link } from "react-router-dom";
import FooterPageLayout from "./FooterPageLayout";

const demoBenefits = [
  "Guided product walkthrough focused on your operation model",
  "Recommendations for plan, seats, and team setup",
  "Live Q&A with onboarding and implementation guidance",
];

const demoSteps = [
  {
    title: "Tell us about your operation",
    description: "Share team size, branch structure, and your main event workflow challenges.",
  },
  {
    title: "Pick your preferred schedule",
    description: "Choose a time slot and meeting format with our product specialists.",
  },
  {
    title: "Receive a tailored demo session",
    description: "Get a practical walkthrough aligned to your inventory and billing processes.",
  },
];

export default function BookDemoPage() {
  return (
    <FooterPageLayout
      title="Book a Demo"
      subtitle="Schedule a personalized product session to see how LendEvent fits your team, workflows, and growth goals."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card space-y-5">
          <h2 className="text-2xl font-bold text-yellow-400">What you get in your demo</h2>
          <ul className="space-y-3">
            {demoBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-gray-300">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3">
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.1)] px-5 py-2.5 text-sm font-bold text-[#FFD700] transition-colors hover:border-[rgba(255,215,0,0.55)] hover:bg-[rgba(255,215,0,0.18)]"
            >
              Start booking with our team
            </Link>
          </div>
        </section>

        <aside className="card space-y-4">
          <h3 className="text-lg font-bold text-yellow-400">Average Session</h3>
          <p className="text-gray-300">30 to 45 minutes</p>
          <p className="text-sm text-gray-400">
            Best suited for operations managers, founders, and teams evaluating migration from manual workflows.
          </p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Contact</p>
            <p className="mt-2 text-sm text-gray-300">demo@lendevent.com</p>
            <p className="text-sm text-gray-400">+57 601 000 2000</p>
          </div>
        </aside>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">How demo scheduling works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoSteps.map((step, index) => (
            <article key={step.title} className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Step {index + 1}</p>
              <h3 className="text-lg font-bold text-yellow-400">{step.title}</h3>
              <p className="text-gray-300 leading-relaxed">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </FooterPageLayout>
  );
}
