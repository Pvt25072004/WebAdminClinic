import React, { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import vi from "date-fns/locale/vi"; // Use Vietnamese locale
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAllSchedules, createSchedule } from "../services/admin.schedules.api";
import { getDoctors } from "../services/admin.doctors.api";
import { useAuth } from "../contexts/AuthContext";
import { CalendarDays, Plus, X } from "lucide-react";

// Setup the localizer by providing the date-fns functions
const locales = {
  vi: vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Week starts on Monday
  getDay,
  locales,
});

export default function SchedulesManagement() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: "",
    work_date: "",
    start_time: "08:00:00",
    end_time: "17:00:00",
    max_patients: 10,
  });

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getAllSchedules();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load schedules error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedules();
    loadDoctors();
  }, [user?.hospital_id]);

  const loadDoctors = async () => {
    try {
      // Pass user's hospital_id if they are admin_hospital, else null
      const hospId = user?.role === 'admin_hospital' ? user?.hospital_id : null;
      const responseData = await getDoctors(hospId, 1, 100);
      const actualDoctors = responseData?.data ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      setDoctors(actualDoctors);
    } catch (e) {
      console.error("Load doctors error:", e);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!formData.doctor_id || !formData.work_date) {
      alert("Vui lòng chọn bác sĩ và ngày trực!");
      return;
    }
    
    // Find selected doctor to get their hospital_id
    const selectedDoc = doctors.find(d => d.id === parseInt(formData.doctor_id));
    if (!selectedDoc) return;

    try {
      setIsSubmitting(true);
      await createSchedule({
        ...formData,
        doctor_id: parseInt(formData.doctor_id),
        max_patients: parseInt(formData.max_patients),
        hospital_id: user?.hospital_id, // Gắn vào bệnh viện của admin
      });
      alert("Tạo lịch thành công! Trạng thái đang Chờ duyệt (Pending).");
      setIsModalOpen(false);
      loadSchedules();
    } catch (error) {
      alert(error.message || "Tạo lịch thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const events = useMemo(() => {
    return schedules.map((sch) => {
      // sch.work_date: "2024-05-30"
      // sch.start_time: "08:00:00"
      // sch.end_time: "12:00:00"
      const wDate = new Date(sch.work_date);
      
      const [startHour, startMin] = (sch.start_time || "00:00").split(":");
      const startDate = new Date(wDate.getFullYear(), wDate.getMonth(), wDate.getDate(), Number(startHour), Number(startMin));
      
      const [endHour, endMin] = (sch.end_time || "23:59").split(":");
      const endDate = new Date(wDate.getFullYear(), wDate.getMonth(), wDate.getDate(), Number(endHour), Number(endMin));

      let docName = "Bác sĩ ẩn danh";
      if (sch.doctor && sch.doctor.user) {
        docName = sch.doctor.user.full_name;
      } else if (sch.doctor) {
        docName = `Bác sĩ ID: ${sch.doctor.id}`;
      }

      let hospName = "N/A";
      if (sch.hospital) hospName = sch.hospital.name;

      return {
        id: sch.id,
        title: `BS. ${docName} (${sch.max_patients} bn)`,
        start: startDate,
        end: endDate,
        resource: {
          doctor: docName,
          hospital: hospName,
          max: sch.max_patients,
        }
      };
    });
  }, [schedules]);

  // Custom event styles
  const eventStyleGetter = (event, start, end, isSelected) => {
    return {
      style: {
        backgroundColor: "#10b981", // emerald-500
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
        padding: "2px 4px",
      }
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tổng quan Lịch trực</h2>
            <p className="text-sm text-slate-500">Xem lịch làm việc của toàn bộ bác sĩ trên hệ thống</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tạo Lịch Trực
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            Đang tải dữ liệu lịch biểu...
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            culture="vi"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            messages={{
              next: "Tiếp",
              previous: "Trước",
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
              agenda: "Lịch trình",
              noEventsInRange: "Không có lịch trực nào trong khoảng thời gian này.",
            }}
            tooltipAccessor={(e) => `Bác sĩ: ${e.resource.doctor}\nBệnh viện: ${e.resource.hospital}\nTối đa: ${e.resource.max} bệnh nhân`}
          />
        )}
      </div>

      {/* Modal Tạo Lịch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Tạo Lịch Trực Mới</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSchedule} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Bác sĩ</label>
                <select 
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      BS. {doc.user?.full_name || `ID: ${doc.id}`} - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày trực</label>
                <input 
                  type="date"
                  required
                  value={formData.work_date}
                  onChange={(e) => setFormData({...formData, work_date: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input 
                    type="time"
                    required
                    step="2"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ kết thúc</label>
                  <input 
                    type="time"
                    required
                    step="2"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng BN tối đa</label>
                <input 
                  type="number"
                  min="1"
                  required
                  value={formData.max_patients}
                  onChange={(e) => setFormData({...formData, max_patients: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Đang tạo..." : "Xác nhận Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
