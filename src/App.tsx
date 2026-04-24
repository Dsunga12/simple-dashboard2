export default function App() {
  const aiStudioLink =
    "https://ai.studio/apps/ee0b21de-b9f1-41e2-a6d4-e2be73c485a7";

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
            Weekly Performance Dashboard
          </p>

          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            GYG Singapore Peak Hour Championship
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            A weekly store performance dashboard designed to review transactions,
            sales performance, zone rankings, and weekly growth insights.
          </p>

          <a
            href={aiStudioLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-yellow-400 px-5 py-4 text-center text-sm font-black text-slate-950 transition hover:bg-yellow-300 sm:w-auto"
          >
            Open Full AI Studio Dashboard
          </a>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Report Type" value="Weekly" />
          <Card label="Focus" value="Store Performance" />
          <Card label="Metrics" value="Sales & Transactions" />
          <Card label="Status" value="Ready" green />
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-2xl font-black">Weekly Report Summary</h2>

          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-300 sm:text-base">
            <li>Tracks weekly store performance across participating outlets.</li>
            <li>Compares transaction volume, sales results, and week-over-week growth.</li>
            <li>Highlights top-performing restaurants and zone rankings.</li>
            <li>Supports management review through a full AI Studio dashboard.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function Card({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <h2
        className={`mt-2 break-words text-xl font-black leading-snug sm:text-2xl ${
          green ? "text-green-400" : "text-white"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}
