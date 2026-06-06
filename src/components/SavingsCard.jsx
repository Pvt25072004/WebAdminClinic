import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SavingsCard({ timeOptions, paymentsData = [], chartData = [] }) {
  const [activeTime, setActiveTime] = useState(timeOptions[2] || "Monthly");

  // Calculate total revenue from real data
  const calculatedTotal = useMemo(() => {
    let total = 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    paymentsData.forEach(p => {
      if (p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'SUCCESSFUL' || p.status === 'Đã thanh toán' || p.amount || p.payment_status === 'completed') {
        const pDateStr = p.created_at || p.createdAt || p.payment_date || p.paymentDate;
        let pDate = new Date(); // fallback to now if no date
        if (pDateStr) {
           pDate = new Date(pDateStr);
           if (isNaN(pDate.getTime())) pDate = new Date();
        }

        const amt = Number(p.amount || p.total_amount || p.price || 0);

        if (activeTime === "Daily") {
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
    <section className="rounded-[18px] bg-white p-8 shadow-sm border border-slate-100">
      <h3 className="mb-4 flex items-center text-[17px] text-[#6c7380] before:mr-2.5 before:h-2 before:w-2 before:rounded-full before:bg-emerald-500 before:content-['']">
        Doanh thu ({activeTime})
      </h3>

      <div className="relative mb-6 inline-block bg-gradient-to-br from-emerald-500 to-[#6a85f1] bg-clip-text text-[40px] font-extrabold text-transparent max-md:text-[32px]">
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
                ? "bg-emerald-500 font-semibold text-white shadow-md hover:text-white"
                : "text-[#6c7380]",
            ].join(" ")}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="-mx-4 h-[240px] mt-4">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} dy={15} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }}
                tickFormatter={(value) => `${value >= 1000000 ? value / 1000000 + 'M' : value >= 1000 ? value / 1000 + 'K' : value}`}
                width={50}
                dx={-10}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
                        <p className="text-emerald-600 font-bold text-lg">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3, className: 'drop-shadow-md' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
            Chưa có dữ liệu biểu đồ
          </div>
        )}
      </div>
    </section>
  );
}
