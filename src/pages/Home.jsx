import PlanCard from "../components/PlanCard";
import PromoCard from "../components/PromoCard";
import SavingsCard from "../components/SavingsCard";
import TransactionCard from "../components/TransactionCard";
import TransferCard from "../components/TransferCard";
import AppointmentsChart from "../components/AppointmentsChart";
import { useAuth } from "../contexts/AuthContext";
import {
  connections,
  months,
  recentExpenses,
  timeOptions,
  transferCards, // We'll keep default as fallback
} from "../data/dashboardData";
import {
  FaMoneyBillWave,
  FaHospital,
  FaUsers,
  FaCalendarCheck,
  FaStethoscope,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { getHospitals } from "../services/admin.hospitals.api";
import { getUsers } from "../services/admin.users.api";
import { getDoctors } from "../services/admin.doctors.api";
import { getAllPayments } from "../services/admin.payments.api";
import { getCategories } from "../services/admin.categories.api";
import { getAllAppointments } from "../services/admin.appointments.api";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  const normalizedRole = (
    user?.role ||
    user?.userRole ||
    user?.user_role ||
    user?.roles?.[0] ||
    "patient"
  ).toLowerCase();

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalHospitals: 0,
    totalUsers: 0,
    totalAppointments: 0,
    paymentsData: [],
    appointmentsData: [],
    hospitalsData: [],
    recentItems: [],
    alerts: [],
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [hospitals, users, doctors, payments, categories, appointments] = await Promise.all([
          getHospitals().catch(() => []),
          getUsers().catch(() => []),
          getDoctors().catch(() => []),
          getAllPayments().catch(() => []),
          getCategories().catch(() => []),
          getAllAppointments().catch(() => [])
        ]);

        const totalHospitals = Array.isArray(hospitals) ? hospitals.length : 0;
        const countUsers = Array.isArray(users) ? users.length : 0;
        const countDoctors = Array.isArray(doctors) ? doctors.length : 0;
        const totalUsers = countUsers + countDoctors;
        const totalCategories = Array.isArray(categories) ? categories.length : 0;
        const totalAppointments = Array.isArray(appointments) ? appointments.length : 0;
        
        let totalRevenue = 0;
        const paymentsArray = Array.isArray(payments) ? payments : [];
        const alerts = [];

        paymentsArray.forEach(p => {
          if (p.status === 'COMPLETED' || p.status === 'SUCCESS' || p.status === 'PAID' || p.status === 'SUCCESSFUL' || p.status === 'Đã thanh toán' || p.amount) {
            totalRevenue += Number(p.amount || p.total_amount || p.price || 0);
          }
        });

        const recentItems = [];
        const formatTime = (dateString) => {
          if (!dateString) return "Gần đây";
          return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          }).format(new Date(dateString));
        };

        if (Array.isArray(hospitals) && hospitals.length > 0) {
          const sortedHospitals = [...hospitals].sort((a,b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
          sortedHospitals.forEach(h => {
            recentItems.push({
              title: "Bệnh viện mới: " + (h.name || "BV"),
              time: formatTime(h.created_at || h.createdAt),
              amount: "Mới",
              type: "positive",
              Icon: FaHospital
            });
          });
        }

        if (Array.isArray(hospitals)) {
          const sortedHospitalsByUpdate = [...hospitals]
            .sort((a,b) => new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0) - new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0));
          sortedHospitalsByUpdate.forEach(h => {
            const timeStr = formatTime(h.updated_at || h.updatedAt || h.created_at || h.createdAt);
            if (h.is_active === false) {
              alerts.push({
                title: h.name,
                time: "Khóa lúc: " + timeStr,
                amount: "Khóa",
                type: "negative",
                image: "https://i.pravatar.cc/150?u=" + h.id
              });
            } else {
              alerts.push({
                title: h.name,
                time: "Hoạt động: " + timeStr,
                amount: "Active",
                type: "positive",
                image: "https://i.pravatar.cc/150?u=" + h.id
              });
            }
          });
        }

        setStats({
          totalRevenue,
          totalHospitals,
          totalUsers,
          totalCategories,
          totalAppointments,
          paymentsData: paymentsArray,
          appointmentsData: Array.isArray(appointments) ? appointments : [],
          hospitalsData: Array.isArray(hospitals) ? hospitals : [],
          recentItems,
          alerts,
          loading: false,
        });
      } catch (err) {
        console.error("Dashboard fetch error", err);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const adminStats = [
    {
      title: "Tổng số bệnh viện",
      amount: stats.loading ? "..." : stats.totalHospitals.toString(),
      Icon: FaHospital,
      onClick: () => navigate("/hospital"),
    },
    {
      title: "Tổng số người dùng",
      amount: stats.loading ? "..." : stats.totalUsers.toString(),
      Icon: FaUsers,
      onClick: () => navigate("/users"),
    },
    {
      title: "Tổng chuyên khoa",
      amount: stats.loading ? "..." : stats.totalCategories.toString(),
      Icon: FaStethoscope,
      onClick: () => navigate("/category"),
    },
    {
      title: "Tổng lịch hẹn",
      amount: stats.loading ? "..." : stats.totalAppointments.toString(),
      Icon: FaCalendarCheck,
      onClick: () => navigate("/schedules"),
    },
    {
      title: "Tổng doanh thu",
      amount: stats.loading ? "..." : formatCurrency(stats.totalRevenue),
      Icon: FaMoneyBillWave,
      onClick: () => navigate("/payment"),
    },
  ];

  const hospitalStats = [
    { title: "Doanh thu bệnh viện", amount: stats.loading ? "..." : formatCurrency(stats.totalRevenue), Icon: FaMoneyBillWave, onClick: () => navigate("/payment") },
    { title: "Lịch khám (Hôm nay)", amount: stats.loading ? "..." : stats.totalAppointments.toString(), Icon: FaCalendarCheck, onClick: () => navigate("/schedules") },
    { title: "Bác sĩ hoạt động", amount: stats.loading ? "..." : stats.totalUsers.toString(), Icon: FaStethoscope, onClick: () => navigate("/doctor") },
  ];

  const statsToDisplay =
    normalizedRole === "admin_hospital" ? hospitalStats : adminStats;

  return (
    <div className="grid grid-cols-[3fr_1.2fr] gap-8 max-[1400px]:grid-cols-1">
      <div className="grid gap-8">
        <section className="mb-0 grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {statsToDisplay.map((card) => (
            <TransferCard key={card.title} {...card} />
          ))}
        </section>

        <section className="grid grid-cols-2 gap-6 max-xl:grid-cols-1">
          <TransactionCard title="Danh sách mới nhất" items={stats.recentItems.length ? stats.recentItems : recentExpenses} />
          <TransactionCard title="Cảnh báo hệ thống" items={stats.alerts.length ? stats.alerts : connections} />
        </section>
      </div>

      <aside className="flex flex-col gap-8">
        <SavingsCard timeOptions={["Daily", "Weekly", "Monthly", "Yearly"]} months={[]} paymentsData={stats.paymentsData} />
        <AppointmentsChart appointments={stats.totalAppointments > 0 ? stats.appointmentsData : []} hospitals={stats.hospitalsData} />
      </aside>
    </div>
  );
}
