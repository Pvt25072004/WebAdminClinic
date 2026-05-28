import { getAllPayments } from "../services/admin.payments.api";
import { ClipboardList } from "lucide-react";
import Button from "../components/Button";
import { formatDate } from "../utils/helpers";
import React, { useEffect, useState, useMemo } from "react";
export default function PaymentManagement() {
  const [adminPayments, setAdminPayments] = useState([]);
  const [loadingPaymentsAdmin, setLoadingPaymentsAdmin] = useState(false);
  const loadAdminPayments = async () => {
    try {
      setLoadingPaymentsAdmin(true);
      const data = await getAllPayments();
      setAdminPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load admin payments error:", e);
    } finally {
      setLoadingPaymentsAdmin(false);
    }
  };
  useEffect(() => {
    void loadAdminPayments();
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Giám sát thanh toán
          </h2>
          <p className="text-sm text-slate-500">
            Đối soát doanh thu từng lịch hẹn
          </p>
        </div>
        <Button variant="outline" size="sm" icon={ClipboardList}>
          Xuất báo cáo
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2">Mã</th>
              <th>Bệnh nhân</th>
              <th>Doctor</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {loadingPaymentsAdmin && (
              <tr>
                <td colSpan={6} className="py-3 text-center text-slate-500">
                  Đang tải danh sách thanh toán...
                </td>
              </tr>
            )}
            {!loadingPaymentsAdmin && adminPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-center text-slate-500">
                  Chưa có thanh toán nào.
                </td>
              </tr>
            )}
            {!loadingPaymentsAdmin &&
              adminPayments.map((payment) => {
                const patientName =
                  payment.appointment?.user?.full_name ||
                  payment.patient_name ||
                  "Bệnh nhân";
                const doctorName =
                  payment.appointment?.doctor?.name ||
                  payment.doctor_name ||
                  "Bác sĩ";
                const createdRaw =
                  payment.paid_at || payment.created_at || payment.createdAt;
                const createdText = createdRaw
                  ? formatDate(createdRaw.toString().slice(0, 10))
                  : "";
                const amountNumber =
                  typeof payment.amount === "number"
                    ? payment.amount
                    : Number(payment.amount || 0);
                return (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs text-slate-500">
                      {`PAY-${payment.id}`}
                    </td>
                    <td>{patientName}</td>
                    <td>{doctorName}</td>
                    <td className="text-emerald-600 font-semibold">
                      {amountNumber.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="text-slate-500">
                      {payment.payment_method || payment.method || "-"}
                    </td>
                    <td className="text-slate-500">{createdText}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
