import React, { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import vi from "date-fns/locale/vi"; // Use Vietnamese locale
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAllSchedules, createSchedule, updateScheduleStatus, deleteSchedule, updateSchedule } from "../services/admin.schedules.api";
import { getAppointmentsBySchedule } from "../services/admin.appointments.api";
import { getDoctors } from "../services/admin.doctors.api";
import { getRooms } from "../services/admin.rooms.api";
import { getCategories } from "../services/admin.categories.api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { CalendarDays, Plus, X, Users, Clock, AlertCircle, Filter, Trash2, Sparkles, MapPin, Edit } from "lucide-react";

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
  const { showSuccess, showError, showWarning, confirm } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    work_date: "",
    end_date: "",
    start_time: "08:00:00",
    end_time: "17:00:00",
    max_patients: 10,
    room_id: "",
  });

  const [selectedDoctorIds, setSelectedDoctorIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [filterCategory, setFilterCategory] = useState("");
  const [searchDoctor, setSearchDoctor] = useState("");

  const [smartSuggestions, setSmartSuggestions] = useState(null);

  const handleFindSmartSlots = () => {
    if (!formData.work_date) {
      showError("Vui lòng chọn Ngày làm việc để tìm phòng!");
      return;
    }
    const targetDate = formData.work_date;
    let catId = filterCategory;
    
    // Tự động lấy chuyên khoa của bác sĩ nếu chưa chọn chuyên khoa
    if (!catId && selectedDoctorIds.length === 1) {
       const selectedDoc = doctors.find(d => d.id === selectedDoctorIds[0]);
       if (selectedDoc?.category?.id) {
          catId = selectedDoc.category.id;
       }
    }

    // Lọc các phòng thuộc chuyên khoa (nếu có chọn)
    let candidateRooms = rooms;
    if (catId) {
      candidateRooms = candidateRooms.filter(r => String(r.category?.id) === String(catId));
    }

    // Lọc các lịch trùng ngày
    const schedulesOnDate = schedules.filter(s => {
       // s.work_date có thể là '2026-06-11' hoặc '2026-06-11T00:00:00Z'
       const sDate = s.work_date ? String(s.work_date).split('T')[0] : '';
       return sDate === targetDate;
    });

    const suggestions = [];

    candidateRooms.forEach(room => {
       // Lấy lịch của phòng này trong ngày đó
       const roomSchedules = schedulesOnDate.filter(s => String(s.room?.id) === String(room.id));
       
       let morningOccupied = false;
       let afternoonOccupied = false;

       roomSchedules.forEach(s => {
          // s.start_time và s.end_time là dạng "07:00:00"
          const startStr = String(s.start_time);
          const endStr = String(s.end_time);
          const startHr = parseInt(startStr.split(':')[0], 10);
          const endHr = parseInt(endStr.split(':')[0], 10);
          
          if (startHr < 12) morningOccupied = true; // Chiếm buổi sáng
          if (endHr > 12) afternoonOccupied = true; // Chiếm buổi chiều
       });

       if (!morningOccupied) {
          suggestions.push({ room, shift: "morning", label: `Sáng (07:00-11:30) - ${room.name}` });
       }
       if (!afternoonOccupied) {
          suggestions.push({ room, shift: "afternoon", label: `Chiều (13:00-17:00) - ${room.name}` });
       }
    });

    setSmartSuggestions(suggestions);
  };

  const handleSelectSuggestion = (sug) => {
    setFormData(prev => ({
      ...prev,
      room_id: sug.room.id,
      start_time: sug.shift === "morning" ? "07:00:00" : "13:00:00",
      end_time: sug.shift === "morning" ? "11:30:00" : "17:00:00"
    }));
  };
  // Filters cho View Lịch (Calendar)
  const [viewFilterCategory, setViewFilterCategory] = useState("");
  const [viewSearchDoctor, setViewSearchDoctor] = useState("");
  const [viewStatus, setViewStatus] = useState("all");

  // Details Modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [editFormData, setEditFormData] = useState({
    room_id: "",
    start_time: "",
    end_time: "",
    max_patients: ""
  });
  const [editRooms, setEditRooms] = useState([]);

  // Day View Modal states
  const [isDayViewModalOpen, setIsDayViewModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

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
    loadCategories();
  }, [user?.hospital_id]);

  const loadCategories = async () => {
    try {
      const hospId = user?.role === 'admin_hospital' ? user?.hospital_id : null;
      const data = await getCategories(hospId);
      setCategories(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      console.error("Load categories error:", e);
    }
  };

  const loadDoctors = async () => {
    try {
      // Pass user's hospital_id if they are admin_hospital, else null
      const hospId = user?.role === 'admin_hospital' ? user?.hospital_id : null;
      const responseData = await getDoctors(hospId, 1, 100);
      let actualDoctors = responseData?.data ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      
      const normalizedRole = (user?.role || user?.userRole || user?.user_role || "patient").toLowerCase();
      if (normalizedRole === 'admin_hospital' && hospId) {
        actualDoctors = actualDoctors.filter(d => 
          Number(d.hospital_id) === Number(hospId) || 
          (d.hospitals && d.hospitals.some(h => Number(h.id) === Number(hospId)))
        );
      }
      
      setDoctors(actualDoctors);
    } catch (e) {
      console.error("Load doctors error:", e);
    }
  };

  useEffect(() => {
    const loadRooms = async () => {
      try {
        let hospId = user?.role === 'admin_hospital' ? user?.hospital_id : null;
        let catId = filterCategory || null;

        if (selectedDoctorIds.length > 0) {
           const selectedDoc = doctors.find(d => d.id === selectedDoctorIds[0]);
           if (selectedDoc) {
             if (!hospId) hospId = selectedDoc.hospitals?.[0]?.id || null;
             // Tự lấy chuyên khoa của bác sĩ nếu chưa lọc
             if (!catId && selectedDoctorIds.length === 1) {
               catId = selectedDoc.category?.id || null;
             }
           }
        }

        if (hospId) {
          const fetchedRooms = await getRooms(hospId, catId);
          setRooms(Array.isArray(fetchedRooms) ? fetchedRooms : (fetchedRooms?.data || []));
        } else {
           setRooms([]);
        }
      } catch (e) {
        console.error("Load rooms error:", e);
      }
    };
    loadRooms();
  }, [selectedDoctorIds, filterCategory, doctors, user]);

  const availableRooms = useMemo(() => {
    if (!formData.work_date || !formData.start_time || !formData.end_time) return rooms;
    
    return rooms.filter(room => {
      const isOccupied = schedules.some(sch => {
        if (sch.room?.id !== room.id && sch.room_id !== room.id) return false;
        if (sch.work_date !== formData.work_date) return false;
        // Check time overlap
        return (sch.start_time < formData.end_time) && (sch.end_time > formData.start_time);
      });
      return !isOccupied;
    });
  }, [rooms, schedules, formData.work_date, formData.start_time, formData.end_time]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (selectedDoctorIds.length === 0 && !selectAll) {
      showWarning("Vui lòng chọn ít nhất một bác sĩ!");
      return;
    }
    if (!formData.work_date) {
      showWarning("Vui lòng chọn ngày trực!");
      return;
    }
    
    let hospitalId = user?.hospital_id;

    // Lấy hospitalId từ bác sĩ đầu tiên nếu chưa có
    if (!hospitalId && selectedDoctorIds.length > 0) {
      const firstDoc = doctors.find(d => d.id === selectedDoctorIds[0]);
      if (firstDoc && firstDoc.hospitals && firstDoc.hospitals.length > 0) {
        hospitalId = firstDoc.hospitals[0].id;
      }
    } else if (!hospitalId && selectAll) {
      showError("Super Admin không thể chọn 'Áp dụng cho tất cả' mà không có cơ sở y tế mặc định.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        ...formData,
        max_patients: parseInt(formData.max_patients),
        hospital_id: hospitalId,
      };
      
      if (payload.room_id) {
        payload.room_id = parseInt(payload.room_id);
      } else {
        delete payload.room_id; // Avoid sending empty string
      }
      
      if (!payload.end_date) {
        delete payload.end_date;
      }

      if (selectAll && !filterCategory && !searchDoctor) {
        payload.apply_to_all_doctors = true;
      } else {
        payload.doctor_ids = selectedDoctorIds;
      }

      const response = await createSchedule(payload);
      
      if (response && response.success_count === 0) {
        showError(`Không thể tạo lịch: ${response.failed?.[0]?.reason || 'Trùng lịch'}`);
        return; // Dừng lại, không đóng Modal để user sửa
      } else if (response && response.failed_count > 0) {
        showWarning(`Tạo thành công ${response.success_count} ca. Thất bại ${response.failed_count} ca do trùng lịch.`);
      } else if (response && response.message) {
        showSuccess(response.message);
      } else {
        showSuccess("Tạo lịch thành công!");
      }
      setIsModalOpen(false);
      loadSchedules();
    } catch (error) {
      showError(error.message || "Tạo lịch thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
    setIsEditingSchedule(false);
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

  const handleSelectSlot = ({ start }) => {
    // Tìm tất cả các sự kiện trong ngày này
    const dayEvents = events.filter(e => 
      e.start.getDate() === start.getDate() && 
      e.start.getMonth() === start.getMonth() && 
      e.start.getFullYear() === start.getFullYear()
    );
    
    setSelectedDayDate(start);
    setSelectedDayEvents(dayEvents);
    setIsDayViewModalOpen(true);
  };

  const handleShowMore = (events, date) => {
    setSelectedDayDate(date);
    setSelectedDayEvents(events);
    setIsDayViewModalOpen(true);
  };

  const handleDrillDown = (date, view) => {
    const dayEvents = events.filter(e => 
      e.start.getDate() === date.getDate() && 
      e.start.getMonth() === date.getMonth() && 
      e.start.getFullYear() === date.getFullYear()
    );
    setSelectedDayDate(date);
    setSelectedDayEvents(dayEvents);
    setIsDayViewModalOpen(true);
  };

  const toggleScheduleStatus = async () => {
    if (!selectedEvent) return;
    try {
      const currentStatus = selectedEvent.resource.is_available;
      const newStatus = !currentStatus;
      await updateScheduleStatus(selectedEvent.id, newStatus);
      
      const updatedEvent = {
        ...selectedEvent,
        resource: {
          ...selectedEvent.resource,
          is_available: newStatus
        }
      };
      setSelectedEvent(updatedEvent);
      
      showSuccess(`Đã ${newStatus ? 'mở' : 'khóa'} ca trực thành công!`);
      loadSchedules();
    } catch (error) {
      console.error(error);
      showError(error.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteSchedule = async () => {
    const isConfirm = await confirm(
      "Xác nhận xóa ca trực",
      "Bạn có chắc chắn muốn xóa ca trực này? Tất cả các lịch hẹn trong ca này có thể bị ảnh hưởng!",
      { variant: "danger", confirmText: "Xóa ca trực" }
    );
    
    if (!isConfirm) {
      return;
    }
    
    try {
      await deleteSchedule(selectedEvent.id);
      
      // Update local state
      setSchedules(prev => prev.filter(s => s.id !== selectedEvent.id));
      setIsDetailsModalOpen(false);
      setSelectedEvent(null);
      
      showSuccess("Đã xóa ca trực thành công!");
    } catch (error) {
      console.error(error);
      showError(error.message || "Không thể xóa lịch trực");
    }
  };

  const handleEditScheduleClick = async () => {
     setEditFormData({
        room_id: selectedEvent.resource.schedule.room_id || "",
        start_time: selectedEvent.resource.schedule.start_time || "08:00:00",
        end_time: selectedEvent.resource.schedule.end_time || "17:00:00",
        max_patients: selectedEvent.resource.schedule.max_patients || 10
     });
     setIsEditingSchedule(true);

     try {
       const sch = selectedEvent.resource.schedule;
       const docCatId = sch.doctor?.category?.id || sch.doctor?.category_id || null;
       const docHospId = sch.hospital?.id || sch.hospital_id || user?.hospital_id || null;
       if (docHospId) {
         const fetchedRooms = await getRooms(docHospId, docCatId);
         setEditRooms(Array.isArray(fetchedRooms) ? fetchedRooms : (fetchedRooms?.data || []));
       } else {
         setEditRooms([]);
       }
     } catch (e) {
       console.error("Lỗi tải phòng lúc sửa:", e);
     }
  };

  const handleSaveEditSchedule = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        max_patients: parseInt(editFormData.max_patients),
        room_id: editFormData.room_id ? parseInt(editFormData.room_id) : null
      };
      
      await updateSchedule(selectedEvent.id, payload);
      showSuccess("Cập nhật lịch trực thành công!");
      setIsEditingSchedule(false);
      setIsDetailsModalOpen(false);
      loadSchedules();
    } catch(err) {
      showError(err.message || "Lỗi cập nhật lịch trực");
    } finally {
      setIsSubmitting(false);
    }
  };

  const events = useMemo(() => {
    const filteredSchedules = schedules.filter(sch => {
      if (viewFilterCategory) {
        const catId = sch.doctor?.category?.id || sch.doctor?.category_id;
        if (String(catId) !== String(viewFilterCategory)) return false;
      }
      if (viewSearchDoctor) {
        const docName = sch.doctor?.user?.full_name || `ID: ${sch.doctor?.id}`;
        if (!docName.toLowerCase().includes(viewSearchDoctor.toLowerCase())) return false;
      }
      if (viewStatus !== "all") {
        if (viewStatus === "open" && (!sch.is_available || sch.approval_status !== "approved")) return false;
        if (viewStatus === "closed" && (sch.is_available && sch.approval_status === "approved")) return false;
        if (viewStatus === "pending" && sch.approval_status !== "pending") return false;
      }
      return true;
    });

    return filteredSchedules.map((sch) => {
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
        title: `BS. ${docName} (${sch.room?.name || 'CX'} - ${sch.max_patients}bn)`,
        start: startDate,
        end: endDate,
        resource: {
          doctor: docName,
          category: sch.doctor?.category?.name || 'Không có chuyên khoa',
          hospital: hospName,
          room: sch.room?.name || 'Chưa xếp phòng',
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
        opacity: 0.95,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "13px",
        padding: "4px 8px",
        fontWeight: "500",
        minHeight: "28px"
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

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
        {/* Bộ lọc xem lịch */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-600 font-medium mr-2">
            <Filter className="w-4 h-4" /> Lọc Lịch:
          </div>
          
          <select
            value={viewFilterCategory}
            onChange={(e) => setViewFilterCategory(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">-- Tất cả chuyên khoa --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tìm theo tên bác sĩ..."
            value={viewSearchDoctor}
            onChange={(e) => setViewSearchDoctor(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white min-w-[200px]"
          />

          <select
            value={viewStatus}
            onChange={(e) => setViewStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="all">-- Tất cả trạng thái --</option>
            <option value="open">Đang mở (Nhận khách)</option>
            <option value="closed">Đã đóng / Tạm ngưng</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </div>

        <div className="flex-1 overflow-x-auto pb-2">
          {/* Cố định chiều cao để ép react-big-calendar hiện nút "+ Xem thêm" */}
          <div className="min-w-[900px] h-[650px]">
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
              selectable={true}
              onSelectSlot={handleSelectSlot}
              popup={false} // Disable default popup
              onShowMore={handleShowMore}
              onDrillDown={handleDrillDown}
              messages={{
                next: "Tiếp",
                previous: "Trước",
                today: "Hôm nay",
                month: "Tháng",
                week: "Tuần",
                day: "Ngày",
                agenda: "Lịch trình",
                showMore: (total) => `+ Xem thêm ${total}`,
                noEventsInRange: "Không có lịch trực nào trong khoảng thời gian này.",
              }}
              tooltipAccessor={(e) => `Bác sĩ: ${e.resource.doctor}\nBệnh viện: ${e.resource.hospital}\nTối đa: ${e.resource.max} bệnh nhân`}
              onSelectEvent={handleSelectEvent}
            />
          )}
          </div>
        </div>
      </div>

      {/* Modal Tạo Lịch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" /> Tạo Lịch Trực Mới
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSchedule} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Cột trái: Chọn Bác sĩ */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 border-b pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Thông tin Bác sĩ
                  </h4>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lọc theo Chuyên Khoa</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFormData({...formData, doctor_id: ""});
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3"
                >
                  <option value="">-- Tất cả chuyên khoa --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-slate-700 mb-1">Tìm kiếm Bác sĩ</label>
                <input
                  type="text"
                  placeholder="Nhập tên bác sĩ..."
                  value={searchDoctor}
                  onChange={(e) => setSearchDoctor(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3"
                />

                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Bác sĩ</label>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto p-2 bg-slate-50">
                  {/* Select All */}
                  <label className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer border-b border-slate-200 mb-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      checked={selectAll}
                      onChange={(e) => {
                        setSelectAll(e.target.checked);
                        if (e.target.checked) {
                          const filteredIds = doctors
                            .filter(doc => !filterCategory || String(doc.category?.id) === String(filterCategory))
                            .filter(doc => !searchDoctor || (doc.user?.full_name || "").toLowerCase().includes(searchDoctor.toLowerCase()))
                            .map(doc => doc.id);
                          setSelectedDoctorIds(filteredIds);
                        } else {
                          setSelectedDoctorIds([]);
                        }
                      }}
                    />
                    <span className="font-semibold text-blue-700">Chọn tất cả trong danh sách lọc</span>
                  </label>

                  {doctors
                    .filter(doc => !filterCategory || String(doc.category?.id) === String(filterCategory))
                    .filter(doc => !searchDoctor || (doc.user?.full_name || "").toLowerCase().includes(searchDoctor.toLowerCase()))
                    .map(doc => (
                    <label key={doc.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        checked={selectedDoctorIds.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDoctorIds(prev => [...prev, doc.id]);
                          } else {
                            setSelectedDoctorIds(prev => prev.filter(id => id !== doc.id));
                            setSelectAll(false);
                          }
                        }}
                      />
                      <span className="text-slate-700 text-sm">
                        BS. {doc.user?.full_name || `ID: ${doc.id}`} - {doc.specialty}
                      </span>
                    </label>
                  ))}
                  {doctors.filter(doc => !filterCategory || String(doc.category?.id) === String(filterCategory)).filter(doc => !searchDoctor || (doc.user?.full_name || "").toLowerCase().includes(searchDoctor.toLowerCase())).length === 0 && (
                    <div className="p-3 text-center text-slate-500 text-sm">Không tìm thấy bác sĩ nào</div>
                  )}
                </div>
              </div>

              {/* Cột phải: Thời gian & Địa điểm */}
              <div className="space-y-4">
                
                {/* Lọc lịch thông minh */}
                {selectedDoctorIds.length > 1 || selectAll ? (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-2 text-amber-800 text-sm">
                    <div className="flex items-start gap-2 font-semibold">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>Chế độ Lên lịch Hàng loạt</span>
                    </div>
                    <p className="ml-7">
                      Tính năng Gợi ý Giờ Trống theo phòng bị vô hiệu hóa khi lên lịch cho nhiều bác sĩ cùng lúc. 
                      Hệ thống sẽ tự động quét các phòng còn trống (theo đúng chuyên khoa) và <strong>gắn ngẫu nhiên</strong> vào phòng trống. 
                      Bạn vui lòng chọn ngày và giờ ở bên dưới. Admin có thể chỉnh sửa lại phòng sau nếu muốn.
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <h4 className="font-semibold text-emerald-800 flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4" /> Gợi ý Phòng & Giờ Trống
                    </h4>
                    <p className="text-xs text-emerald-600 mb-3">
                      Chọn một ngày để hệ thống quét các phòng trống (Ca sáng: 07:00-11:30, Ca chiều: 13:00-17:00).
                    </p>
                    <div className="flex gap-2 mb-1">
                      <input 
                        type="date"
                        value={formData.work_date}
                        onChange={(e) => {
                           setFormData({...formData, work_date: e.target.value});
                           setSmartSuggestions(null); // reset
                        }}
                        className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 bg-white text-sm"
                      />
                      <button 
                        type="button"
                        onClick={handleFindSmartSlots}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
                      >
                        Tìm kiếm
                      </button>
                    </div>
                    
                    {smartSuggestions && (
                      <div className="mt-3 bg-white p-2 rounded-lg border border-emerald-100 max-h-40 overflow-y-auto">
                         {smartSuggestions.length === 0 ? (
                           <div className="text-center text-sm text-slate-500 p-2">Không còn phòng trống nào trong ngày này.</div>
                         ) : (
                           <div className="flex flex-wrap gap-2">
                             {smartSuggestions.map((sug, idx) => (
                               <button
                                 key={idx}
                                 type="button"
                                 onClick={() => handleSelectSuggestion(sug)}
                                 className={`px-3 py-1.5 border text-xs font-medium rounded-md transition-colors text-left
                                   ${formData.room_id == sug.room.id && (formData.start_time.startsWith(sug.shift === "morning" ? "07" : "13")) 
                                     ? 'bg-emerald-600 text-white border-emerald-600' 
                                     : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'}`}
                               >
                                 {sug.label}
                               </button>
                             ))}
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                )}

                <h4 className="font-semibold text-slate-700 border-b pb-2 flex items-center gap-2 mt-4">
                  <Clock className="w-4 h-4 text-emerald-500" /> Tùy chỉnh Chi tiết Lịch
                </h4>
                  {selectedDoctorIds.length === 1 && !selectAll && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                        <span>Chọn Phòng Khám</span>
                        {formData.work_date && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Lọc thông minh: Chỉ hiện phòng trống</span>}
                      </label>
                      <select 
                        value={formData.room_id}
                        onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Có thể để trống --</option>
                        {availableRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} {room.category?.name ? `(${room.category.name})` : ''}
                          </option>
                        ))}
                      </select>
                      {rooms.length > 0 && availableRooms.length === 0 && formData.work_date && (
                        <p className="text-xs text-red-500 mt-1">Không có phòng nào trống trong khoảng thời gian này!</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                      <input 
                        type="date"
                        required
                        value={formData.work_date}
                        onChange={(e) => {
                          setFormData({...formData, work_date: e.target.value});
                          setSmartSuggestions(null);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
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
                </div>
              </div>
            </div>
              <div className="p-5 border-t border-slate-100 bg-white flex gap-4 justify-end shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận Tạo Lịch"}
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
              {!isEditingSchedule ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-800 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">Bác sĩ phụ trách</span>
                      </div>
                      <p className="text-slate-700 font-semibold">{selectedEvent.resource.doctor}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{selectedEvent.resource.category}</p>
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
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 text-purple-800 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">Phòng Khám</span>
                      </div>
                      <p className="text-slate-700 font-semibold">{selectedEvent.resource.room}</p>
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
                  <button 
                    onClick={handleEditScheduleClick}
                    className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-200"
                    title="Chỉnh sửa ca trực"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleDeleteSchedule}
                    className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-200"
                    title="Xóa ca trực"
                  >
                    <Trash2 className="w-5 h-5" />
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
              </>
              ) : (
                <form id="edit-schedule-form" onSubmit={handleSaveEditSchedule} className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-500 mb-4">Đang chỉnh sửa ca trực ngày: <span className="font-semibold text-slate-800">{format(selectedEvent.start, 'dd/MM/yyyy')}</span> - Bác sĩ: <span className="font-semibold text-slate-800">{selectedEvent.resource.doctor}</span></p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Giờ bắt đầu</label>
                        <input 
                          type="time" required step="2"
                          value={editFormData.start_time}
                          onChange={(e) => setEditFormData({...editFormData, start_time: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Giờ kết thúc</label>
                        <input 
                          type="time" required step="2"
                          value={editFormData.end_time}
                          onChange={(e) => setEditFormData({...editFormData, end_time: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phòng Khám</label>
                        <select 
                          value={editFormData.room_id}
                          onChange={(e) => setEditFormData({...editFormData, room_id: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        >
                          <option value="">-- Để trống --</option>
                          {editRooms.map(room => (
                            <option key={room.id} value={room.id}>{room.name} {room.category?.name ? `(${room.category.name})` : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bệnh nhân tối đa</label>
                        <input 
                          type="number" min="1" required
                          value={editFormData.max_patients}
                          onChange={(e) => setEditFormData({...editFormData, max_patients: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-4 justify-end shrink-0">
              {isEditingSchedule && (
                 <>
                   <button 
                     type="button"
                     onClick={() => setIsEditingSchedule(false)}
                     className="px-6 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-white transition-colors"
                   >
                     Hủy sửa
                   </button>
                   <button 
                     type="submit"
                     form="edit-schedule-form"
                     disabled={isSubmitting}
                     className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                   >
                     {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                   </button>
                 </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết danh sách bác sĩ trong ngày */}
      {isDayViewModalOpen && selectedDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" /> 
                Ca trực ngày {format(selectedDayDate, 'dd/MM/yyyy')}
              </h3>
              <button 
                onClick={() => setIsDayViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-3 bg-slate-50">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 mb-4">Không có ca trực nào trong ngày này.</p>
                  <button 
                    onClick={() => {
                      setIsDayViewModalOpen(false);
                      setFormData(prev => ({...prev, work_date: format(selectedDayDate, 'yyyy-MM-dd')}));
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                  >
                    + Tạo lịch mới
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button 
                      onClick={() => {
                        setIsDayViewModalOpen(false);
                        setFormData(prev => ({...prev, work_date: format(selectedDayDate, 'yyyy-MM-dd')}));
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Thêm lịch
                    </button>
                  </div>
                  {selectedDayEvents.map(event => (
                    <div 
                      key={event.id} 
                      onClick={() => {
                        setIsDayViewModalOpen(false);
                        handleSelectEvent(event);
                      }}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {event.resource.doctor.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {event.title}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                            <Clock className="w-3.5 h-3.5" /> 
                            {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                            <span className="text-slate-300">|</span>
                            <span>{event.resource.hospital} - {event.resource.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          event.resource.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {event.resource.is_available ? 'Đang mở' : 'Đã đóng'}
                        </span>
                        <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
