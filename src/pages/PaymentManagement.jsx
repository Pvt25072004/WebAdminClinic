import { getAllPayments } from "../services/admin.payments.api";
import { ClipboardList, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../components/Button";
import { formatDate } from "../utils/helpers";
import React, { useEffect, useState, useMemo } from "react";

export default function PaymentManagement() {
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

  const loadAdminPayments = async () => {
    try {
      setLoadingPaymentsAdmin(true);
      const res = await getAllPayments({ page, limit, startDate, endDate, search });
      if (res && res.data) {
        setAdminPayments(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      } else if (Array.isArray(res)) {
        // Fallback backward compatibility
        setAdminPayments(res);
      }
    } catch (e) {
      console.error("Load admin payments error:", e);
    } finally {
      setLoadingPaymentsAdmin(false);
    }
  };

  useEffect(() => {
    void loadAdminPayments();
  }, [page, limit, startDate, endDate, search]);

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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
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
        <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); setPage(1); }}>
          Xóa bộ lọc
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b bg-slate-50/50">
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
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Đang tải danh sách thanh toán...
                  </td>
                </tr>
              )}
              {!loadingPaymentsAdmin && adminPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Chưa có lịch sử thanh toán nào phù hợp.
                  </td>
                </tr>
              )}
              {!loadingPaymentsAdmin && adminPayments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {p.transaction_id || `PAY-${p.id}`}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {p.appointment?.user?.full_name || p.appointment?.patient_name || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {p.appointment?.doctor?.user?.full_name || "N/A"}
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
        </div>

        {totalPages > 1 && (
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
