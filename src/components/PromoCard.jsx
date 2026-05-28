export default function PromoCard() {
  return (
    <section className="relative mb-8 flex justify-between overflow-hidden rounded-[18px] bg-gradient-to-br from-[#edf0fb] to-[#dbe4ff] p-9 shadow-card max-xl:flex-col max-xl:gap-8">
      <div className="absolute -right-36 -top-36 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-white/10 to-white/5" />

      <div className="relative z-10 max-w-[50%] max-xl:max-w-full">
        <h2 className="mb-5 bg-gradient-to-r from-[#262a39] to-emerald-500 bg-clip-text text-[28px] font-bold text-transparent max-sm:text-[22px]">
          Smart money management
        </h2>
        <p className="mb-6 text-base leading-relaxed text-[#6c7380] max-sm:text-sm">
          Experience global transactions with zero hidden charges. Secure,
          transfer and manage your finances with confidence.
        </p>
        <button className="rounded-full bg-emerald-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_15px_rgba(16,185,129,0.3)] transition duration-300 hover:-translate-y-1 hover:bg-[#3265e6] hover:shadow-[0_10px_20px_rgba(16,185,129,0.4)] max-sm:px-5 max-sm:py-3">
          Explore Features
        </button>
      </div>

      <div className="relative flex h-[200px] w-[320px] rotate-[5deg] flex-col justify-between overflow-hidden rounded-[20px] bg-gradient-to-br from-[#6889ff] to-emerald-500 p-6 text-white shadow-[0_15px_30px_rgba(16,185,129,0.3)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.4)] max-xl:h-[170px] max-xl:w-full max-xl:rotate-0">
        <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_83%_83%,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_27%,transparent_28%),radial-gradient(circle_at_17%_17%,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_12%,transparent_13%)] opacity-70 mix-blend-soft-light" />

        <div className="relative flex items-center justify-between">
          <div className="text-base font-medium tracking-[1px]">Platinum Edge</div>
          <div className="flex gap-1">
            <span className="h-[22px] w-[22px] rounded-full bg-white/90" />
            <span className="-ml-2 h-[22px] w-[22px] rounded-full bg-white/70" />
          </div>
        </div>

        <div className="relative text-[22px] font-medium tracking-[3px] drop-shadow-sm max-sm:text-lg">
          4832 7691 2450 8115
        </div>

        <div className="relative flex items-end justify-between">
          <div>
            <div className="mb-1 text-[10px] tracking-[1px] opacity-70">
              CARD HOLDER
            </div>
            <div className="text-base font-medium tracking-[1px]">
              Alexander Morgan
            </div>
          </div>

          <div className="text-right">
            <div className="mb-1 text-[10px] tracking-[1px] opacity-70">
              EXPIRES
            </div>
            <div className="text-base font-medium">09/27</div>
          </div>
        </div>
      </div>
    </section>
  );
}
