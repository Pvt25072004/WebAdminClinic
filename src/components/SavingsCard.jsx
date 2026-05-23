export default function SavingsCard({ timeOptions, months }) {
  return (
    <section className="rounded-[18px] bg-white p-8 shadow-card">
      <h3 className="mb-4 flex items-center text-[17px] text-[#6c7380] before:mr-2.5 before:h-2 before:w-2 before:rounded-full before:bg-[#4270f4] before:content-['']">
        Monthly Savings
      </h3>

      <div className="relative mb-6 inline-block bg-gradient-to-br from-[#4270f4] to-[#6a85f1] bg-clip-text text-[40px] font-extrabold text-transparent after:absolute after:bottom-0 after:left-1 after:h-[3px] after:w-10 after:rounded after:bg-gradient-to-br after:from-[#4270f4] after:to-[#6a85f1] max-md:text-[32px]">
        $467.5
      </div>

      <div className="mb-6 flex overflow-x-auto rounded-full bg-[#f5f7ff] p-1">
        {timeOptions.map((option) => (
          <button
            key={option}
            className={[
              "whitespace-nowrap rounded-full px-[18px] py-2 text-sm font-medium transition duration-300 hover:text-[#4270f4] max-sm:px-3",
              option === "Monthly"
                ? "bg-[#4270f4] font-semibold text-white shadow-[0_5px_10px_rgba(66,112,244,0.3)] hover:text-white"
                : "text-[#6c7380]",
            ].join(" ")}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="-mx-4 h-[200px]">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4270F4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4270F4" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d="M0,80 C20,70 40,30 60,60 C80,90 100,40 120,30 C140,20 160,50 180,20 C200,30 220,60 240,80 C260,60 280,40 300,60"
            fill="none"
            stroke="#4270F4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_5px_5px_rgba(66,112,244,0.2)]"
          />

          <path
            d="M0,80 C20,70 40,30 60,60 C80,90 100,40 120,30 C140,20 160,50 180,20 C200,30 220,60 240,80 C260,60 280,40 300,60 L300,100 L0,100 Z"
            fill="url(#gradientFill)"
            opacity="0.25"
          />

          <circle cx="180" cy="20" r="6" fill="#4270F4" stroke="#ffffff" strokeWidth="3" />
        </svg>
      </div>

      <div className="mt-4 flex justify-between px-2.5">
        {months.map((month) => (
          <button
            key={month}
            className={[
              "relative rounded-full px-2.5 py-1 text-sm font-medium transition duration-300 hover:bg-[#edf0fb] hover:text-[#4270f4]",
              month === "Dec"
                ? "bg-[#edf0fb] font-semibold text-[#4270f4] after:absolute after:-top-[50px] after:left-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:rounded-full after:border-[3px] after:border-white after:bg-[#4270f4] after:shadow-[0_0_10px_rgba(66,112,244,0.5)] after:content-['']"
                : "text-[#6c7380]",
            ].join(" ")}
          >
            {month}
          </button>
        ))}
      </div>
    </section>
  );
}
