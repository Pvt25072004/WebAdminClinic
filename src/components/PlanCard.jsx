export default function PlanCard() {
  return (
    <section className="relative flex h-full items-center justify-between overflow-hidden rounded-[18px] bg-gradient-to-br from-[#13296a] to-[#16378e] p-8 text-white shadow-card">
      <span className="absolute -right-[200px] -top-[200px] h-[400px] w-[400px] rounded-full bg-white/5" />

      <div className="relative z-10 py-6">
        <div className="mb-2.5 text-base opacity-80">Budget Goal Q1 2025</div>
        <div className="mb-2.5 text-[28px] font-semibold drop-shadow">
          On Track
        </div>
      </div>

      <div className="relative mr-8 flex h-[140px] w-[140px] items-center justify-center rounded-full bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.2)] max-sm:mr-0 max-sm:h-28 max-sm:w-28">
        <span className="absolute h-[80%] w-[80%] rounded-full bg-[#0f2a65]" />
        <span className="absolute h-[150%] w-[150%] animate-ping rounded-full border-2 border-white/10" />
        <span className="relative text-[28px] font-bold drop-shadow">68%</span>
      </div>
    </section>
  );
}
