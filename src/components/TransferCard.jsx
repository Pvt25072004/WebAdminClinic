export default function TransferCard({ title, amount, Icon }) {
  return (
    <article className="group relative cursor-pointer overflow-hidden rounded-[18px] bg-white p-6 shadow-card transition duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)]">
      <span className="absolute left-0 top-0 h-0 w-[5px] bg-emerald-500 transition-all duration-300 group-hover:h-full" />

      <div className="mb-5 flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-[#edf0fb] text-xl text-emerald-500 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white">
        <Icon />
      </div>

      <p className="mb-2 text-[15px] text-[#6c7380]">{title}</p>
      <h2 className="bg-gradient-to-br from-[#262a39] to-emerald-500 bg-clip-text text-[26px] font-bold text-transparent">
        {amount}
      </h2>
    </article>
  );
}
