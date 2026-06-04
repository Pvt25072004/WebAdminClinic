import { useState } from "react";
import { FaRegClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function TransactionCard({ title, items }) {
  const displayItems = items || [];

  return (
    <section className="rounded-[18px] bg-white p-6 shadow-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="relative inline-block text-xl font-semibold after:absolute after:-bottom-2 after:left-0 after:h-[3px] after:w-[40%] after:rounded after:bg-emerald-500">
            {title}
          </h3>
        </div>

        <div className="min-h-[250px]">
          {displayItems.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
              Không có dữ liệu
            </div>
          ) : (
            displayItems.map((item, index) => {
              const Icon = item.Icon;

          return (
            <div
              key={item.title}
              onClick={() => item.onClick && item.onClick()}
              className="group relative mb-5 flex cursor-pointer items-center justify-between border-b border-[#e6e9f4] pb-[18px] transition duration-300 last:mb-0 last:border-b-0 last:pb-0 hover:translate-x-1"
            >
              <div className={`flex h-[45px] w-[45px] items-center justify-center bg-[#e6e9f4] text-lg text-[#6c7380] transition duration-300 group-hover:scale-110 group-hover:bg-[#edf0fb] group-hover:text-emerald-500 ${item.isAvatar ? 'rounded-full overflow-hidden' : 'rounded-xl'}`}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon />
                )}
              </div>

              <div className="ml-4 flex-1">
                <div className="mb-1 text-base font-semibold">{item.title}</div>
                <div className="flex items-center text-[13px] text-[#6c7380]">
                  <FaRegClock className="mr-1 text-xs" />
                  {item.time}
                </div>
              </div>

              <div
                className={[
                  "text-[17px] font-semibold transition duration-200 group-hover:scale-110",
                  item.type === "positive" ? "text-[#2dbf78]" : "text-[#f36c6c]",
                ].join(" ")}
              >
                {item.amount}
              </div>
            </div>
          );
            })
          )}
        </div>
      </div>
    </section>
  );
}
