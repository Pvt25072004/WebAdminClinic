import React, { useEffect, useState, useMemo } from "react";
import { getAllReviews } from "../services/reviews.api";
import Button from "../components/Button";
import { Shield, Eye } from "lucide-react";

export default function ReviewManagement() {
  const [adminReviews, setAdminReviews] = useState([]);
  const [loadingReviewsAdmin, setLoadingReviewsAdmin] = useState(false);
  const loadAdminReviews = async () => {
    try {
      setLoadingReviewsAdmin(true);
      const data = await getAllReviews();
      setAdminReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load admin reviews error:", e);
    } finally {
      setLoadingReviewsAdmin(false);
    }
  };
  useEffect(() => {
    void loadAdminReviews();
  }, []);

  const doctorRatings = useMemo(() => {
    if (!adminReviews || adminReviews.length === 0) return [];
    
    const map = new Map();
    adminReviews.forEach(review => {
      const doctorId = review.doctor?.id || review.doctor_id;
      if (!doctorId) return;
      
      if (!map.has(doctorId)) {
        map.set(doctorId, {
          doctorId,
          doctorName: review.doctor?.full_name || review.doctor?.name || "Bác sĩ ẩn danh",
          totalReviews: 0,
          sumRating: 0
        });
      }
      
      const item = map.get(doctorId);
      item.totalReviews++;
      item.sumRating += (review.rating || 0);
    });
    
    return Array.from(map.values()).map(item => ({
      ...item,
      averageRating: (item.sumRating / item.totalReviews).toFixed(1)
    }));
  }, [adminReviews]);
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
        {loadingReviewsAdmin && (
          <p className="text-sm text-slate-500">
            Đang tải danh sách đánh giá...
          </p>
        )}
        {!loadingReviewsAdmin && doctorRatings.length === 0 && (
          <p className="text-sm text-slate-500">
            Chưa có đánh giá nào cho bác sĩ.
          </p>
        )}
        {!loadingReviewsAdmin &&
          doctorRatings.map((doctorRating) => (
            <div
              key={doctorRating.doctorId}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">
                    {doctorRating.doctorName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {doctorRating.totalReviews} đánh giá
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">
                      ⭐ {doctorRating.averageRating}
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
