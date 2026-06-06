import React, { useEffect, useState, useMemo } from "react";
import { getAllReviews } from "../services/reviews.api";
import { useAuth } from "../contexts/AuthContext";
import { Star, MessageSquare, TrendingUp, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ReviewManagement() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const isHospitalAdmin = user?.role === "admin_hospital" || user?.user_role === "admin_hospital";
  const hospitalId = user?.hospital_id || user?.hospital?.id;

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAllReviews();
      let data = res || [];
      if (Array.isArray(res.data)) data = res.data;

      // Lọc đánh giá theo quyền
      if (isHospitalAdmin && hospitalId) {
        data = data.filter(r => r.doctor?.hospitals?.some(h => Number(h.id) === Number(hospitalId)));
      }
      setReviews(data);
    } catch (e) {
      console.error("Load reviews error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính toán thống kê
  const stats = useMemo(() => {
    if (reviews.length === 0) return null;

    const total = reviews.length;
    const totalStars = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const avgRating = totalStars / total;
    const fiveStars = reviews.filter(r => Number(r.rating) === 5).length;

    // Phân bổ sao
    const distribution = [
      { name: "5 Sao", count: reviews.filter(r => Number(r.rating) === 5).length, star: 5 },
      { name: "4 Sao", count: reviews.filter(r => Number(r.rating) === 4).length, star: 4 },
      { name: "3 Sao", count: reviews.filter(r => Number(r.rating) === 3).length, star: 3 },
      { name: "2 Sao", count: reviews.filter(r => Number(r.rating) === 2).length, star: 2 },
      { name: "1 Sao", count: reviews.filter(r => Number(r.rating) === 1).length, star: 1 },
    ];

    // Thống kê theo đối tượng (Bệnh viện nếu là SuperAdmin, Bác sĩ nếu là Admin Hospital)
    const grouped = {};
    reviews.forEach(r => {
      let key = "Khác";
      if (isHospitalAdmin) {
        key = r.doctor?.user?.full_name || `Bác sĩ #${r.doctor_id}`;
      } else {
        key = r.doctor?.hospitals?.[0]?.name || `Bệnh viện (N/A)`;
      }

      if (!grouped[key]) {
        grouped[key] = { name: key, total: 0, sumRating: 0 };
      }
      grouped[key].total += 1;
      grouped[key].sumRating += Number(r.rating || 0);
    });

    const topEntities = Object.values(grouped).map(g => ({
      name: g.name,
      avg: g.sumRating / g.total,
      total: g.total
    })).sort((a, b) => b.avg - a.avg || b.total - a.total).slice(0, 5);

    return { total, totalStars, avgRating, fiveStars, distribution, topEntities };
  }, [reviews, isHospitalAdmin]);

  const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Thống kê Đánh giá
        </h2>
        <p className="text-slate-500">
          Theo dõi mức độ hài lòng của bệnh nhân đối với {isHospitalAdmin ? "các bác sĩ" : "các bệnh viện"}
        </p>
        <p className="text-sm font-medium text-emerald-600 mt-1">
          Tổng số: {reviews.length} đánh giá
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">Chưa có đánh giá nào</h3>
          <p className="mt-1 text-slate-500">Hệ thống chưa ghi nhận đánh giá nào phù hợp với tài khoản của bạn.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <MessageSquare className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng Đánh Giá</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats?.total}</h3>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Star className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Điểm Trung Bình</p>
                <h3 className="text-2xl font-bold text-slate-900 flex items-end gap-1">
                  {stats?.avgRating?.toFixed(1)} <span className="text-sm font-medium text-slate-500 mb-1">/ 5.0</span>
                </h3>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng Số Sao</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {stats?.totalStars} <span className="text-sm font-normal text-slate-500">sao</span>
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Phân Bổ Đánh Giá</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.distribution} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} tick={{ fill: '#64748b', fontSize: 13 }} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {stats?.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top List */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Top {isHospitalAdmin ? "Bác Sĩ" : "Bệnh Viện"} Yêu Thích
                </h3>
              </div>
              <div className="space-y-4">
                {stats?.topEntities.map((entity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">
                          {entity.name}
                        </p>
                        <p className="text-xs text-slate-500">{entity.total} nhận xét</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-amber-700">{entity.avg.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Reviews Table */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Đánh Giá Gần Đây</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium w-16 text-center">STT</th>
                    <th className="px-6 py-4 font-medium">Bệnh Nhân</th>
                    <th className="px-6 py-4 font-medium">{isHospitalAdmin ? "Bác Sĩ" : "Bệnh Viện"}</th>
                    <th className="px-6 py-4 font-medium">Đánh Giá</th>
                    <th className="px-6 py-4 font-medium">Bình Luận</th>
                    <th className="px-6 py-4 font-medium">Ngày Gửi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.slice(0, 10).map((r, index) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{r.user?.full_name || "Bệnh nhân"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-600">
                          {isHospitalAdmin 
                            ? r.doctor?.user?.full_name 
                            : r.doctor?.hospitals?.[0]?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-slate-700">{r.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        <span className="text-slate-600" title={r.comment}>{r.comment || <em className="text-slate-400">Không có bình luận</em>}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
