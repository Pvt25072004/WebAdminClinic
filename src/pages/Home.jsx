import PlanCard from "../components/PlanCard";
import PromoCard from "../components/PromoCard";
import SavingsCard from "../components/SavingsCard";
import Sidebar from "../components/Sidebar";
import TransactionCard from "../components/TransactionCard";
import TransferCard from "../components/TransferCard";
import {
  connections,
  months,
  navItems,
  recentExpenses,
  timeOptions,
  transferCards,
} from "../data/dashboardData";

export default function Home() {
  return (
    <div className="grid grid-cols-[3fr_1.2fr] gap-8 max-[1400px]:grid-cols-1">
      <div className="grid gap-8">
        <section className="mb-0 grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {transferCards.map((card) => (
            <TransferCard key={card.title} {...card} />
          ))}
        </section>

        <PromoCard />

        <section className="grid grid-cols-2 gap-6 max-xl:grid-cols-1">
          <TransactionCard title="Recent Expenses" items={recentExpenses} />
          <TransactionCard title="Your Connections" items={connections} />
        </section>
      </div>

      <aside className="flex flex-col gap-8">
        <SavingsCard timeOptions={timeOptions} months={months} />
        <PlanCard />
      </aside>
    </div>
  );
}
