import React, { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import vi from "date-fns/locale/vi"; // Use Vietnamese locale
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAllSchedules, createSchedule, updateScheduleStatus } from "../services/admin.schedules.api";
import { getAppointmentsBySchedule } from "../services/admin.appointments.api";
import { getDoctors } from "../services/admin.doctors.api";
import { useAuth } from "../contexts/AuthContext";
import { CalendarDays, Plus, X, Users, Clock, AlertCircle } from "lucide-react";

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
    end_date: "",
    start_time: "08:00:00",
    end_time: "17:00:00",
    max_patients: 10,
  });

  // Details Modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

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
      alert("Vui lòng chọn bác sĩ (hoặc tất cả) và ngày trực!");
      return;
    }
    
    let hospitalId = user?.hospital_id;

    // Find selected doctor to get their hospital_id (only if not 'all')
    if (formData.doctor_id !== "all") {
      const selectedDoc = doctors.find(d => d.id === parseInt(formData.doctor_id));
      if (!selectedDoc) return;
      if (!hospitalId && selectedDoc.hospitals && selectedDoc.hospitals.length > 0) {
        hospitalId = selectedDoc.hospitals[0].id;
      }
    } else if (!hospitalId) {
      alert("Super Admin không thể chọn 'Áp dụng cho tất cả bác sĩ' mà không có cơ sở y tế mặc định. Vui lòng chọn một bác sĩ cụ thể.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        max_patients: parseInt(formData.max_patients),
        hospital_id: hospitalId,
      };
      
      if (!payload.end_date) {
        delete payload.end_date;
      }

      if (formData.doctor_id === "all") {
        payload.apply_to_all_doctors = true;
        delete payload.doctor_id;
      } else {
        payload.doctor_id = parseInt(formData.doctor_id);
      }

      const response = await createSchedule(payload);
      
      if (response && response.message) {
        alert(response.message);
      } else {
        alert("Tạo lịch thành công!");
      }
      setIsModalOpen(false);
      loadSchedules();
    } catch (error) {
      alert(error.message || "Tạo lịch thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
    try {
      setLoadingAppointments(true);
      const data = await getAppointmentsBySchedule(event.id);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load appointments error:", e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const toggleScheduleStatus = async () => {
    if (!selectedEvent) return;
    try {
      const newStatus = !selectedEvent.resource.is_available;
      await updateScheduleStatus(selectedEvent.id, newStatus);
      alert(`Đã ${newStatus ? 'mở' : 'đóng'} lịch thành công!`);
      setIsDetailsModalOpen(false);
      loadSchedules();
    } catch (error) {
      alert(error.message || "Không thể cập nhật trạng thái lịch");
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
          is_available: sch.is_available,
          approval_status: sch.approval_status,
          schedule: sch,
        }
      };
    });
  }, [schedules]);

  // Custom event styles
  const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor = "#10b981"; // emerald-500 (Đang mở)
    
    if (event.resource.approval_status === "pending") {
      backgroundColor = "#f59e0b"; // amber-500 (Chờ duyệt)
    } else if (event.resource.approval_status === "rejected" || !event.resource.is_available) {
      backgroundColor = "#94a3b8"; // slate-400 (Tạm ngưng / Hủy)
    }
    // TODO: if booked_patients >= max -> red (đã đầy)
    // we can calculate this if we add appointments count or check it in backend

    return {
      style: {
        backgroundColor,
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
            onSelectEvent={handleSelectEvent}
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
                  <option value="all">-- Áp dụng cho tất cả bác sĩ --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      BS. {doc.user?.full_name || `ID: ${doc.id}`} - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                  <input 
                    type="date"
                    required
                    value={formData.work_date}
                    onChange={(e) => setFormData({...formData, work_date: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày (Tùy chọn)</label>
                  <input 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
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

      {/* Modal Chi tiết Lịch (Event Details) */}
      {isDetailsModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Chi tiết Ca trực</h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-800 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Bác sĩ phụ trách</span>
                  </div>
                  <p className="text-slate-700 font-semibold">{selectedEvent.resource.doctor}</p>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Thời gian</span>
                  </div>
                  <p className="text-slate-700 font-semibold">
                    {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}
                  </p>
                  <p className="text-sm text-slate-500">{format(selectedEvent.start, 'dd/MM/yyyy')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  Danh sách Bệnh nhân ({appointments.length}/{selectedEvent.resource.max})
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedEvent.resource.is_available 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedEvent.resource.is_available ? 'Đang mở' : 'Đã đóng'}
                  </span>
                  <button 
                    onClick={toggleScheduleStatus}
                    className={`px-4 py-1 rounded-lg font-medium text-sm transition-colors border ${
                      selectedEvent.resource.is_available
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {selectedEvent.resource.is_available ? 'Khóa ca trực' : 'Mở ca trực'}
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-600">Bệnh nhân</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Loại khám</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingAppointments ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                          Đang tải danh sách...
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-slate-500 flex flex-col items-center">
                          <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                          Chưa có bệnh nhân nào đặt lịch trong ca này
                        </td>
                      </tr>
                    ) : (
                      appointments.map(app => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{app.user?.full_name || 'N/A'}</div>
                            <div className="text-slate-500 text-xs">{app.user?.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {app.examination_type === 'online' ? 'Trực tuyến' : 'Trực tiếp'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                              app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              app.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {app.status === 'pending' ? 'Chờ duyệt' :
                               app.status === 'confirmed' ? 'Đã duyệt' :
                               app.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
