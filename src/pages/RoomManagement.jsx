import React, { useState, useEffect } from "react";
import { getRooms, createBulkRooms } from "../services/admin.rooms.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { getCategories } from "../services/admin.categories.api";
import { useAuth } from "../contexts/AuthContext";
import { Building, Plus, Layers, Stethoscope, Hash, ListFilter } from "lucide-react";

export default function RoomManagement() {
  const { user } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [filterHospId, setFilterHospId] = useState("");
  const [filterCatId, setFilterCatId] = useState("");
  
  const [formData, setFormData] = useState({
    hospital_id: "",
    category_id: "",
    floor: "1",
    roomCount: "5"
  });

  const isAdminSystem = user?.role === "admin_system";
  const userHospId = user?.role === "admin_hospital" ? user?.hospital_id : null;

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    loadRooms();
  }, [filterHospId, filterCatId, userHospId]);

  const loadInitialData = async () => {
    try {
      if (isAdminSystem) {
        const hospRes = await getHospitals();
        setHospitals(Array.isArray(hospRes) ? hospRes : hospRes?.data || []);
      }
      const catRes = await getCategories();
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || []);
      
      // Init form data with user's hospital if not admin_system
      if (!isAdminSystem && userHospId) {
        setFormData(prev => ({ ...prev, hospital_id: userHospId }));
        setFilterHospId(userHospId);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const hId = isAdminSystem ? filterHospId : userHospId;
      const res = await getRooms(hId || null, filterCatId || null);
      setRooms(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    if (!formData.hospital_id || !formData.category_id || !formData.floor || !formData.roomCount) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const count = parseInt(formData.roomCount);
    if (isNaN(count) || count <= 0 || count > 100) {
      alert("Số lượng phòng phải từ 1 đến 100");
      return;
    }

    const floor = formData.floor.trim();
    const newRooms = [];
    
    for (let i = 1; i <= count; i++) {
      // Format: T[floor][01, 02...] -> e.g. T101, T205
      const roomNumber = i.toString().padStart(2, "0");
      const roomName = `T${floor}${roomNumber}`;
      
      newRooms.push({
        name: roomName,
        hospital_id: parseInt(formData.hospital_id),
        category_id: parseInt(formData.category_id),
      });
    }

    if (!window.confirm(`Bạn sắp tạo ${count} phòng (từ T${floor}01 đến T${floor}${count.toString().padStart(2, "0")}). Xác nhận?`)) {
      return;
    }

    setSubmitLoading(true);
    try {
      await createBulkRooms(newRooms);
      alert("Tạo phòng hàng loạt thành công!");
      loadRooms();
    } catch (error) {
      alert(error.message || "Lỗi khi tạo phòng");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-600" /> Quản lý Phòng Khám
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tạo Hàng Loạt */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-1 h-fit sticky top-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
            <Plus className="w-5 h-5 text-green-600" /> Tạo nhanh phòng khám
          </h2>
          
          <form onSubmit={handleBulkCreate} className="space-y-4">
            {isAdminSystem && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-4 h-4" /> Chọn Bệnh viện
                </label>
                <select
                  required
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn bệnh viện --</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Stethoscope className="w-4 h-4" /> Gán cho Chuyên khoa
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Chọn chuyên khoa --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Layers className="w-4 h-4" /> Số Tầng
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 1, 2"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-4 h-4" /> Số lượng
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.roomCount}
                  onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2 text-sm text-blue-800">
              <span className="font-semibold">Mẫu sinh tên:</span> T[tầng][số_thứ_tự] <br />
              <span className="text-xs text-blue-600">Ví dụ: Tầng {formData.floor || "1"}, {formData.roomCount || "5"} phòng ➔ T{formData.floor || "1"}01 đến T{formData.floor || "1"}{String(formData.roomCount || "5").padStart(2, '0')}</span>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:bg-blue-400"
            >
              {submitLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <><Plus className="w-5 h-5" /> Tạo Tự Động</>
              )}
            </button>
          </form>
        </div>

        {/* Danh sách phòng */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b pb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-indigo-600" /> Danh sách Phòng đã có
            </h2>
            <div className="flex gap-2">
              {isAdminSystem && (
                <select
                  value={filterHospId}
                  onChange={(e) => setFilterHospId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">-- Tất cả bệnh viện --</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              )}
              <select
                value={filterCatId}
                onChange={(e) => setFilterCatId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">-- Tất cả chuyên khoa --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 flex justify-center items-center gap-2">
              <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              Đang tải danh sách...
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Không tìm thấy phòng khám nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-sm">
                    <th className="py-3 px-4 font-semibold w-16">ID</th>
                    <th className="py-3 px-4 font-semibold">Số / Tên Phòng</th>
                    <th className="py-3 px-4 font-semibold">Chuyên Khoa</th>
                    {isAdminSystem && <th className="py-3 px-4 font-semibold">Cơ sở</th>}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 text-sm">#{room.id}</td>
                      <td className="py-3 px-4 font-bold text-blue-700">
                        <div className="bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100">
                          {room.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {room.category?.name || <span className="text-slate-400 italic">Chưa gán</span>}
                      </td>
                      {isAdminSystem && (
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {room.hospital?.name || "-"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
