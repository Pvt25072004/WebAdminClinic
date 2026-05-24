import PlanCard from "../components/PlanCard";
import PromoCard from "../components/PromoCard";
import SavingsCard from "../components/SavingsCard";
import TransactionCard from "../components/TransactionCard";
import TransferCard from "../components/TransferCard";
import { useAuth } from "../contexts/AuthContext";
import {
  connections,
  months,
  recentExpenses,
  timeOptions,
  transferCards, // We'll keep default as fallback
} from "../data/dashboardData";
import { FaMoneyBillWave, FaHospital, FaUsers, FaCalendarCheck, FaStethoscope } from "react-icons/fa";

export default function Home() {
  const { user } = useAuth();
  const normalizedRole = (
    user?.role ||
    user?.userRole ||
    user?.user_role ||
    user?.roles?.[0] ||
    "patient"
  ).toLowerCase();

  const adminStats = [
    { title: "Tổng doanh thu hệ thống", amount: "$1,250,000", Icon: FaMoneyBillWave },
    { title: "Tổng số bệnh viện", amount: "45", Icon: FaHospital },
    { title: "Tổng số Users", amount: "12,450", Icon: FaUsers },
  ];

  const hospitalStats = [
    { title: "Doanh thu bệnh viện", amount: "$45,000", Icon: FaMoneyBillWave },
    { title: "Lịch khám (Hôm nay)", amount: "24", Icon: FaCalendarCheck },
    { title: "Bác sĩ hoạt động", amount: "12", Icon: FaStethoscope },
  ];

  const statsToDisplay = normalizedRole === "admin_hospital" ? hospitalStats : adminStats;

  return (
    <div className="grid grid-cols-[3fr_1.2fr] gap-8 max-[1400px]:grid-cols-1">
      <div className="grid gap-8">
        <section className="mb-0 grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {statsToDisplay.map((card) => (
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
