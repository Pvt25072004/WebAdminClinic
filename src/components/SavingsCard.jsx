import { useState, useMemo } from "react";

export default function SavingsCard({ timeOptions, months, paymentsData = [] }) {
  const [activeTime, setActiveTime] = useState(timeOptions[2] || "Monthly");
  const [activeMonth, setActiveMonth] = useState(months[0] || "Oct");

  // Calculate total revenue from real data
  const calculatedTotal = useMemo(() => {
    let total = 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    paymentsData.forEach(p => {
      if (p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'SUCCESSFUL' || p.status === 'Đã thanh toán' || p.amount) {
        const pDateStr = p.created_at || p.createdAt || p.payment_date || p.paymentDate;
        let pDate = new Date(); // fallback to now if no date
        if (pDateStr) {
           pDate = new Date(pDateStr);
           if (isNaN(pDate.getTime())) pDate = new Date();
        }

        const amt = Number(p.amount || p.total_amount || p.price || 0);

        if (activeTime === "Daily") {
          // Check if same day
          if (pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth() && pDate.getDate() === now.getDate()) {
            total += amt;
          }
        } else if (activeTime === "Weekly") {
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          if (pDate >= firstDayOfWeek && pDate <= lastDayOfWeek) {
            total += amt;
          }
        } else if (activeTime === "Yearly" || activeTime === "Annual") {
          if (pDate.getFullYear() === now.getFullYear()) {
            total += amt;
          }
        } else {
          // Monthly default
          if (pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth()) {
            total += amt;
          }
        }
      }
    });
    
    return total;
  }, [paymentsData, activeTime]);

  const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculatedTotal);

  return (
    <section className="rounded-[18px] bg-white p-8 shadow-card">
      <h3 className="mb-4 flex items-center text-[17px] text-[#6c7380] before:mr-2.5 before:h-2 before:w-2 before:rounded-full before:bg-emerald-500 before:content-['']">
        Doanh thu ({activeTime})
      </h3>

      <div className="relative mb-6 inline-block bg-gradient-to-br from-emerald-500 to-[#6a85f1] bg-clip-text text-[40px] font-extrabold text-transparent after:absolute after:bottom-0 after:left-1 after:h-[3px] after:w-10 after:rounded after:bg-gradient-to-br after:from-emerald-500 after:to-[#6a85f1] max-md:text-[32px]">
        {formattedTotal}
      </div>

      <div className="mb-6 flex overflow-x-auto rounded-full bg-[#f5f7ff] p-1">
        {timeOptions.map((option) => (
          <button
            key={option}
            onClick={() => setActiveTime(option)}
            className={[
              "whitespace-nowrap rounded-full px-[18px] py-2 text-sm font-medium transition duration-300 hover:text-emerald-500 max-sm:px-3",
              activeTime === option
                ? "bg-emerald-500 font-semibold text-white shadow-[0_5px_10px_rgba(16,185,129,0.3)] hover:text-white"
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
            className="drop-shadow-[0_5px_5px_rgba(16,185,129,0.2)]"
          />

          <path
            d="M0,80 C20,70 40,30 60,60 C80,90 100,40 120,30 C140,20 160,50 180,20 C200,30 220,60 240,80 C260,60 280,40 300,60 L300,100 L0,100 Z"
            fill="url(#gradientFill)"
            opacity="0.25"
          />

          <circle cx="180" cy="20" r="6" fill="#4270F4" stroke="#ffffff" strokeWidth="3" />
        </svg>
      </div>

      {months && months.length > 0 && (
        <div className="mt-4 flex justify-between px-2.5">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setActiveMonth(month)}
              className={[
                "relative rounded-full px-2.5 py-1 text-sm font-medium transition duration-300 hover:bg-[#edf0fb] hover:text-emerald-500",
                activeMonth === month
                  ? "bg-[#edf0fb] font-semibold text-emerald-500 after:absolute after:-top-[50px] after:left-1/2 after:h-3 after:w-3 after:-translate-x-1/2 after:rounded-full after:border-[3px] after:border-white after:bg-emerald-500 after:shadow-[0_0_10px_rgba(16,185,129,0.5)] after:content-['']"
                  : "text-[#6c7380]",
              ].join(" ")}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
