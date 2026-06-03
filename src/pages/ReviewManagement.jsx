import React, { useEffect, useState, useMemo } from "react";
import { getDoctors } from "../services/admin.doctors.api";
import Button from "../components/Button";
import { Shield, Eye } from "lucide-react";

export default function ReviewManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDoctorsData = async () => {
    try {
      setLoading(true);
      const res = await getDoctors();
      // Handle the paginated response
      setDoctors(res?.data || []);
    } catch (e) {
      console.error("Load doctors error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctorsData();
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Giám sát đánh giá
          </h2>
          <p className="text-sm text-slate-500">
            Số sao trung bình của từng bác sĩ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={Eye}>
            Xem tất cả
          </Button>
          <Button variant="danger" size="sm" icon={Shield}>
            Báo cáo
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <p className="text-sm text-slate-500">
            Đang tải danh sách đánh giá...
          </p>
        )}
        {!loading && doctors.length === 0 && (
          <p className="text-sm text-slate-500">
            Chưa có thông tin bác sĩ nào.
          </p>
        )}
        {!loading &&
          doctors
            .filter((d) => d.review_count > 0) // Chỉ hiển thị bác sĩ đã có đánh giá
            .sort((a, b) => b.rating - a.rating)
            .map((doctor) => (
            <div
              key={doctor.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">
                    {doctor.user?.full_name || "Bác sĩ ẩn danh"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {doctor.review_count} đánh giá
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">
                      ⭐ {Number(doctor.rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-500">/ 5.0</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
