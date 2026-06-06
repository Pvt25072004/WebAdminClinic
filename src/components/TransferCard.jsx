export default function TransferCard({ title, amount, Icon, onClick }) {
  return (
    <article onClick={onClick} className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] hover:border-emerald-100">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="absolute left-0 top-0 h-0 w-[4px] bg-gradient-to-b from-emerald-400 to-teal-600 transition-all duration-500 group-hover:h-full rounded-r-full" />

      <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-slate-50 text-[22px] text-emerald-500 shadow-sm border border-slate-100/50 transition-all duration-500 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-teal-600 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] relative z-10">
        <Icon />
      </div>

      <div className="relative z-10">
        <p className="mb-1.5 text-[14px] font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <h2 className="bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-3xl font-extrabold text-transparent tracking-tight">
          {amount}
        </h2>
      </div>
    </article>
  );
}
