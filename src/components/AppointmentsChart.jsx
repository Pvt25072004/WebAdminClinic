import React, { useState, useMemo } from 'react';

export default function AppointmentsChart({ appointments = [], hospitals = [], doctors = [], role = "admin" }) {
  const [timeRange, setTimeRange] = useState('month');

  // Lọc dữ liệu theo khoảng thời gian
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return appointments.filter(app => {
      const dateString = app.date || app.appointment_date || app.appointmentDate || app.created_at || app.createdAt;
      if (!dateString) return false;
      const appDate = new Date(dateString);
      if (isNaN(appDate.getTime())) return false;

      if (timeRange === 'all') return true;
      if (timeRange === 'year') return appDate.getFullYear() === now.getFullYear();
      if (timeRange === 'month') return appDate.getFullYear() === now.getFullYear() && appDate.getMonth() === now.getMonth();
      if (timeRange === 'week') {
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        return appDate >= firstDayOfWeek && appDate <= lastDayOfWeek;
      }
      return true;
    });
  }, [appointments, timeRange]);

  const isHospitalAdmin = role === 'admin_hospital';

  // Đếm số lịch hẹn theo từng bệnh viện hoặc bác sĩ
  const chartData = useMemo(() => {
    const counts = {};
    const entities = isHospitalAdmin ? doctors : hospitals;
    
    if (!entities || entities.length === 0) return [];
    
    entities.forEach(e => counts[e.id] = 0);

    filteredAppointments.forEach(app => {
      const eId = isHospitalAdmin ? (app.doctor_id || app.doctorId || app.doctor?.id) : (app.hospital_id || app.hospitalId || app.hospital?.id);
      if (eId && counts[eId] !== undefined) {
        counts[eId]++;
      }
    });

    return entities
      .map(e => ({
        label: e.name || e.full_name || e.user?.full_name || 'Không xác định',
        fullName: e.name || e.full_name || e.user?.full_name || 'Không xác định',
        count: counts[e.id] || 0
      }))
      .map(e => ({ ...e, label: e.label.substring(0, 15) + (e.label.length > 15 ? '...' : '') }))
      .sort((a, b) => b.count - a.count);
  }, [filteredAppointments, hospitals, doctors, isHospitalAdmin]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1); // Tránh chia cho 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lượt khám theo {isHospitalAdmin ? 'Bác sĩ' : 'Bệnh viện'}</h3>
          <p className="text-sm text-slate-500">Tổng số lượng khám {isHospitalAdmin ? 'đặt với bác sĩ' : 'khi patient đặt'}</p>
        </div>
        
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 min-w-[140px] bg-white"
        >
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
          <option value="all">Tất cả thời gian</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
          Chưa có dữ liệu lịch hẹn
        </div>
      ) : (
        <div className="flex items-end justify-between h-[240px] gap-2 pt-10 overflow-x-auto overflow-y-visible pb-2 scrollbar-thin">
          {chartData.map((data, index) => {
            const heightPercent = (data.count / maxCount) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1 group min-w-[70px] relative h-full justify-end">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-md border border-slate-100 text-slate-800 text-sm py-3 px-4 rounded-2xl absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap text-center shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                  <div className="font-semibold text-slate-700 mb-1">{data.fullName}</div>
                  <div className="text-emerald-600 font-bold">{data.count} lượt khám</div>
                  {/* Mũi tên */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-100 rotate-45"></div>
                </div>
                
                {/* Bar Container - flex-1 để chiếm hết chiều cao còn lại sau khi chừa chỗ cho text */}
                <div className="w-full max-w-[48px] flex-1 flex flex-col justify-end items-center relative">
                  {/* Text luôn hiển thị trên đỉnh cột */}
                  <span className="text-xs font-bold text-emerald-600 mb-1.5 transition-all">
                    {data.count}
                  </span>
                  
                  {/* Cột */}
                  <div className="w-full bg-emerald-50 rounded-t-lg relative flex items-end justify-center overflow-hidden h-full">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 ease-out"
                      style={{ height: `${Math.max(heightPercent, 2)}%` }} // Tối thiểu 2% để luôn thấy cột
                    />
                  </div>
                </div>
                
                {/* Label (Tên bệnh viện) */}
                <span className="text-xs font-medium text-slate-500 text-center truncate w-full px-1 mt-2 mb-1" title={data.fullName}>
                  {data.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
