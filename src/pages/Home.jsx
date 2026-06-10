import PlanCard from "../components/PlanCard";
import PromoCard from "../components/PromoCard";
import SavingsCard from "../components/SavingsCard";
import TransactionCard from "../components/TransactionCard";
import TransferCard from "../components/TransferCard";
import AppointmentsChart from "../components/AppointmentsChart";
import { useAuth } from "../contexts/AuthContext";
import {
  FaMoneyBillWave,
  FaHospital,
  FaUsers,
  FaCalendarCheck,
  FaStethoscope,
  FaUser,
  FaRegCalendarAlt,
  FaStar,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { getHospitalRegistrations } from "../services/admin.hospital.registration.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { getUsers } from "../services/admin.users.api";
import { getDoctors } from "../services/admin.doctors.api";
import {
  getAllPayments,
  getDashboardStats as getPaymentStats,
} from "../services/admin.payments.api";
import { getCategories } from "../services/admin.categories.api";
import { getAllAppointments } from "../services/admin.appointments.api";
import { getDashboardStats } from "../services/admin.dashboard.api";
import { getAllReviews } from "../services/reviews.api";
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
    totalDoctors: 0,
    totalAppointments: 0,
    averageStars: "0.0",
    paymentsData: [],
    appointmentsData: [],
    hospitalsData: [],
    recentItems: [],
    alerts: [],
    recentAppointments: [],
    registrationRequests: [],
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const hospitalId = user?.hospital_id || user?.hospital?.id;
        const [
          hospitals,
          users,
          doctors,
          payments,
          appointments,
          statsData,
          paymentStats,
          categoriesRes,
          registrations,
          reviewsRes,
        ] = await Promise.all([
          getHospitals().catch(() => []),
          getUsers(1, 5, { role: "patient" }).catch(() => []),
          getDoctors(
            normalizedRole === "admin_hospital" ? hospitalId : null,
            1,
            1000,
          ).catch(() => []),
          getAllPayments().catch(() => []),
          getAllAppointments(1, 1000).catch(() => []),
          getDashboardStats().catch(() => null),
          getPaymentStats().catch(() => null),
          getCategories().catch(() => []),
          getHospitalRegistrations().catch(() => []),
          getAllReviews().catch(() => []),
        ]);

        const totalHospitals = statsData?.totalHospitals || 0;
        const totalUsers =
          statsData?.totalUsersCount ||
          (statsData?.totalPatients || 0) + (statsData?.totalDoctors || 0);
        const totalCategories = Array.isArray(categoriesRes)
          ? categoriesRes.length
          : 0;
        const totalAppointments = statsData?.totalAppointments || 0;
        const totalDoctors = statsData?.totalDoctors || 0;
        const totalRevenue = statsData?.totalRevenue || 0;

        let totalStars = 0;
        const reviewsArray = Array.isArray(reviewsRes?.data)
          ? reviewsRes.data
          : Array.isArray(reviewsRes)
            ? reviewsRes
            : [];
        reviewsArray.forEach((r) => {
          totalStars += Number(r.rating) || 0;
        });
        const averageStars =
          reviewsArray.length > 0
            ? (totalStars / reviewsArray.length).toFixed(1)
            : "0.0";

        const paymentsArray = Array.isArray(payments) ? payments : [];
        const alerts = [];

        const recentItems = [];
        const formatTime = (dateString) => {
          if (!dateString) return "Gần đây";
          return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(dateString));
        };

        if (Array.isArray(hospitals) && hospitals.length > 0) {
          const sortedHospitals = [...hospitals]
            .sort(
              (a, b) =>
                new Date(b.created_at || b.createdAt || 0) -
                new Date(a.created_at || a.createdAt || 0),
            )
            .slice(0, 5);
          sortedHospitals.forEach((h, index) => {
            recentItems.push({
              title: h.name || "BV Mới",
              time: formatTime(h.created_at || h.createdAt),
              amount: index === 0 ? "Mới nhất" : "",
              type: "positive",
              Icon: FaHospital,
              onClick: () =>
                navigate("/hospital", { state: { selectedHospitalId: h.id } }),
            });
          });
        }

        const usersList = Array.isArray(users)
          ? users
          : Array.isArray(users?.data)
            ? users.data
            : [];
        if (usersList.length > 0) {
          const sortedUsers = [...usersList]
            .sort(
              (a, b) =>
                new Date(b.created_at || b.createdAt || 0) -
                new Date(a.created_at || a.createdAt || 0),
            )
            .slice(0, 5);
          sortedUsers.forEach((u, index) => {
            alerts.push({
              title: u.full_name || u.name || u.username || "Người dùng",
              time: formatTime(u.created_at || u.createdAt),
              amount: index === 0 ? "Mới nhất" : "",
              type: "positive",
              isAvatar: true,
              image:
                u.avatar_url ||
                `https://i.pravatar.cc/100?img=${(u.id % 70) + 1}`,
              Icon: FaUser,
            });
          });
        }

        const appointmentsList = Array.isArray(appointments)
          ? appointments
          : Array.isArray(appointments?.data)
            ? appointments.data
            : [];
        const recentAppointments = [];
        if (
          normalizedRole === "admin_hospital" &&
          appointmentsList.length > 0
        ) {
          const sortedAppointments = [...appointmentsList]
            .sort(
              (a, b) =>
                new Date(b.created_at || b.createdAt || 0) -
                new Date(a.created_at || a.createdAt || 0),
            )
            .slice(0, 5);
          sortedAppointments.forEach((a, index) => {
            recentAppointments.push({
              title: a.user?.full_name || "Bệnh nhân",
              time: formatTime(a.created_at || a.createdAt),
              amount: a.status === "pending" ? "Chờ xác nhận" : "Đã duyệt",
              type: a.status === "pending" ? "negative" : "positive",
              Icon: FaCalendarCheck,
            });
          });
        }

        const registrationRequests = [];
        if (
          normalizedRole === "admin" &&
          Array.isArray(registrations) &&
          registrations.length > 0
        ) {
          const pendingRegs = registrations.filter(
            (r) => r.status === "pending",
          );
          pendingRegs.slice(0, 5).forEach((r, index) => {
            registrationRequests.push({
              title: r.hospital_name || "Đăng ký cơ sở mới",
              time: formatTime(r.created_at || r.createdAt),
              amount: "Chờ duyệt",
              type: "negative",
              Icon: FaHospital,
              onClick: () => navigate("/hospital-registrations"),
            });
          });
        }

        setStats({
          totalRevenue,
          totalHospitals,
          totalUsers,
          totalDoctors,
          totalCategories,
          totalAppointments,
          averageStars,
          paymentsData: paymentsArray,
          appointmentsData: appointmentsList,
          hospitalsData: Array.isArray(hospitals)
            ? hospitals
            : Array.isArray(hospitals?.data)
              ? hospitals.data
              : [],
          doctorsData: Array.isArray(doctors)
            ? doctors
            : Array.isArray(doctors?.data)
              ? doctors.data
              : [],
          recentItems,
          alerts,
          recentAppointments,
          registrationRequests,
          revenueChart: paymentStats?.revenueChart || [],
          loading: false,
        });
      } catch (err) {
        console.error("Dashboard fetch error", err);
        setStats((s) => ({ ...s, loading: false }));
      }
    };
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
      onClick: () => navigate("/appointment"),
    },
    {
      title: "Tổng doanh thu",
      amount: stats.loading ? "..." : formatCurrency(stats.totalRevenue),
      Icon: FaMoneyBillWave,
      onClick: () => navigate("/payment"),
    },
    {
      title: "Trung bình sao đánh giá",
      amount: stats.loading ? "..." : `${stats.averageStars} / 5.0`,
      Icon: FaStar,
      onClick: () => navigate("/review"),
    },
  ];

  const hospitalStats = [
    {
      title: "Doanh thu cơ sở",
      amount: stats.loading ? "..." : formatCurrency(stats.totalRevenue),
      Icon: FaMoneyBillWave,
      onClick: () => navigate("/payment"),
    },
    {
      title: "Lịch khám (Tổng)",
      amount: stats.loading ? "..." : stats.totalAppointments.toString(),
      Icon: FaRegCalendarAlt,
      onClick: () => navigate("/appointment"),
    },
    {
      title: "Bác sĩ hoạt động",
      amount: stats.loading ? "..." : stats.totalDoctors.toString(),
      Icon: FaStethoscope,
      onClick: () => navigate("/doctor"),
    },
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
          {normalizedRole === "admin" ? (
            <>
              <TransactionCard
                title="Yêu cầu đăng ký bệnh viện mới"
                items={stats.registrationRequests}
              />
              <TransactionCard
                title="Danh sách bệnh viện mới nhất"
                items={stats.recentItems}
              />
            </>
          ) : (
            <>
              <TransactionCard title="Bệnh nhân mới" items={stats.alerts} />
              <TransactionCard
                title="Lịch hẹn mới nhất"
                items={stats.recentAppointments}
              />
            </>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-8">
        <SavingsCard
          timeOptions={["Daily", "Weekly", "Monthly", "Yearly"]}
          chartData={stats.revenueChart}
          paymentsData={stats.paymentsData}
        />
        <AppointmentsChart
          appointments={
            stats.totalAppointments > 0 ? stats.appointmentsData : []
          }
          hospitals={stats.hospitalsData}
          doctors={stats.doctorsData}
          role={normalizedRole}
        />
      </aside>
    </div>
  );
}
