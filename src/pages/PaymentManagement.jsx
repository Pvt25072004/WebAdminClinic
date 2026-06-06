import { getAllPayments } from "../services/admin.payments.api";
import { ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../components/Button";
import { formatDate } from "../utils/helpers";
import React, { useEffect, useState, useMemo } from "react";

import { useAuth } from "../contexts/AuthContext";
import { getAdminCharts } from "../services/admin.dashboard.api";

export default function PaymentManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [adminPayments, setAdminPayments] = useState([]);
  const [loadingPaymentsAdmin, setLoadingPaymentsAdmin] = useState(false);
  
  // Phân trang & Filter
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [adminCharts, setAdminCharts] = useState({ revenueByHospital: [] });

  const loadAdminPayments = async () => {
    try {
      setLoadingPaymentsAdmin(true);
      if (isAdmin) {
        const charts = await getAdminCharts({ startDate, endDate, status: filterStatus });
        if (charts) setAdminCharts(charts);
      } else {
        const res = await getAllPayments({ page, limit, startDate, endDate, search, status: filterStatus });
        if (res && res.data) {
          setAdminPayments(res.data);
          setTotalPages(res.totalPages || 1);
          setTotalRecords(res.total || 0);
        } else if (Array.isArray(res)) {
          // Fallback backward compatibility
          setAdminPayments(res);
        }
      }
    } catch (e) {
      console.error("Load admin payments error:", e);
    } finally {
      setLoadingPaymentsAdmin(false);
    }
  };

  useEffect(() => {
    void loadAdminPayments();
  }, [page, limit, startDate, endDate, search, isAdmin, filterStatus]);

  const handleExportCSV = () => {
    if (adminPayments.length === 0) return;
    
    // Header
    const csvRows = [
      ["Mã GD", "Bệnh nhân", "Bác sĩ", "Số tiền (VNĐ)", "Phương thức", "Trạng thái", "Ngày tạo"]
    ];

    // Data
    adminPayments.forEach(p => {
      csvRows.push([
        p.transaction_id || `PAY-${p.id}`,
        p.appointment?.user?.full_name || p.appointment?.patient_name || "N/A",
        p.appointment?.doctor?.user?.full_name || "N/A",
        p.amount || 0,
        p.payment_method || "N/A",
        p.payment_status === 'completed' ? 'Thành công' : 'Chờ xử lý',
        p.created_at ? new Date(p.created_at).toLocaleString('vi-VN') : "N/A"
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + csvRows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaoCao_DoanhThu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Giám sát thanh toán
          </h2>
          <p className="text-sm text-slate-500">
            Đối soát doanh thu từng lịch hẹn ({totalRecords} giao dịch)
          </p>
        </div>
        <Button variant="outline" size="sm" icon={ClipboardList} onClick={handleExportCSV}>
          Xuất báo cáo CSV
        </Button>
      </div>

      {isAdmin && adminCharts.revenueByHospital && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Biểu đồ Doanh thu theo Bệnh viện</h3>
          {adminCharts.revenueByHospital.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-slate-400">
              {loadingPaymentsAdmin ? "Đang tải dữ liệu..." : "Chưa có dữ liệu doanh thu"}
            </div>
          ) : (
            <div className="flex items-end justify-start h-[240px] gap-6 pt-10 overflow-x-auto pb-2 scrollbar-thin px-4">
              {adminCharts.revenueByHospital.map((data, idx) => {
                const maxRev = Math.max(...adminCharts.revenueByHospital.map(d => d.total_revenue), 1);
                const hPct = (data.total_revenue / maxRev) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group min-w-[100px] max-w-[120px] relative h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-2 px-3 rounded-lg absolute -top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap text-center shadow-lg">
                      <div className="font-semibold mb-1">{data.hospital_name}</div>
                      <div className="text-amber-300">{Number(data.total_revenue).toLocaleString("vi-VN")} đ</div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-800 rotate-45"></div>
                    </div>
                    
                    <div className="w-full flex-1 flex flex-col justify-end items-center relative">
                      <div 
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-sm transition-all duration-500 group-hover:opacity-90 shadow-sm"
                        style={{ height: `${Math.max(hPct, 2)}%` }}
                      ></div>
                    </div>
                    <div className="mt-3 text-xs font-medium text-slate-600 text-center line-clamp-2 h-8 w-full leading-tight">
                      {data.hospital_name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
        {!isAdmin && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Tìm kiếm (Tên, Mã GD, ID...)</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Nhập từ khóa..." 
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        )}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
            <select
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="all">Tất cả</option>
              <option value="completed">Thành công</option>
              <option value="pending">Chờ xử lý</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Khoảng thời gian</label>
            <select
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 min-w-[140px]"
              onChange={(e) => {
                const val = e.target.value;
                setPage(1);
                if (val === 'all') {
                  setStartDate("");
                  setEndDate("");
                } else if (val === 'this_year') {
                  const currentYear = new Date().getFullYear();
                  setStartDate(`${currentYear}-01-01`);
                  setEndDate(`${currentYear}-12-31`);
                } else if (val === 'this_month') {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setStartDate(firstDay.toISOString().split('T')[0]);
                  setEndDate(lastDay.toISOString().split('T')[0]);
                } else if (val === 'this_week') {
                  const now = new Date();
                  const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
                  const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 7));
                  setStartDate(firstDay.toISOString().split('T')[0]);
                  setEndDate(lastDay.toISOString().split('T')[0]);
                } else if (val === 'today') {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                }
              }}
            >
              <option value="all">Tùy chỉnh / Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="this_year">Năm nay</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Từ ngày</label>
            <input 
              type="date" 
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Đến ngày</label>
            <input 
              type="date" 
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setFilterStatus("all"); setPage(1); }}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {isAdmin ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b bg-slate-50/50">
                  <th className="py-3 px-4 font-medium w-16 text-center">STT</th>
                  <th className="py-3 px-4 font-medium">Bệnh viện</th>
                  <th className="py-3 px-4 font-medium text-right">Tổng Doanh Thu</th>
                </tr>
              </thead>
              <tbody>
                {loadingPaymentsAdmin && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">
                      Đang tải danh sách thanh toán...
                    </td>
                  </tr>
                )}
                {!loadingPaymentsAdmin && adminCharts.revenueByHospital.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">
                      Chưa có lịch sử thanh toán nào phù hợp.
                    </td>
                  </tr>
                )}
                {!loadingPaymentsAdmin && adminCharts.revenueByHospital.map((p, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-slate-500 text-center font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {p.hospital_name}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 text-right">
                      {Number(p.total_revenue).toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b bg-slate-50/50">
                  <th className="py-3 px-4 font-medium w-16">STT</th>
                  <th className="py-3 px-4 font-medium">Mã GD</th>
                  <th className="py-3 px-4 font-medium">Bệnh nhân</th>
                  <th className="py-3 px-4 font-medium">Bác sĩ / Dịch vụ</th>
                  <th className="py-3 px-4 font-medium">Số tiền</th>
                  <th className="py-3 px-4 font-medium">Phương thức</th>
                  <th className="py-3 px-4 font-medium">Trạng thái</th>
                  <th className="py-3 px-4 font-medium text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {loadingPaymentsAdmin && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Đang tải danh sách thanh toán...
                    </td>
                  </tr>
                )}
                {!loadingPaymentsAdmin && adminPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Chưa có lịch sử thanh toán nào phù hợp.
                    </td>
                  </tr>
                )}
                {!loadingPaymentsAdmin && adminPayments.map((p, index) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.transaction_id || `PAY-${p.id}`}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {p.appointment?.user?.full_name || p.appointment?.patient_name || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.appointment?.service_package ? (
                        <div className="flex flex-col">
                           <span className="font-semibold text-indigo-600 line-clamp-1">{p.appointment.service_package.name}</span>
                           <span className="text-xs text-slate-400">Gói dịch vụ</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                           <span className="font-semibold text-slate-700">{p.appointment?.doctor?.user?.full_name ? `BS. ${p.appointment.doctor.user.full_name}` : "N/A"}</span>
                           <span className="text-xs text-slate-400">Đặt lịch khám</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {Number(p.amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded uppercase">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.payment_status === "completed" ? (
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded flex items-center w-max gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Thành công
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded flex items-center w-max gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Chờ xử lý
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-right">
                      {p.created_at ? formatDate(p.created_at) : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isAdmin && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-sm text-slate-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
