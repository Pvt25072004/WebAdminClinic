import React, { useState, useEffect } from "react";
import { getRooms, createBulkRooms, updateRoom, deleteRoom } from "../services/admin.rooms.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { getCategories } from "../services/admin.categories.api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import Pagination from "../components/Pagination";
import { Building, Plus, Layers, Stethoscope, Hash, ListFilter, Edit, Trash2, X } from "lucide-react";

export default function RoomManagement() {
  const { user } = useAuth();
  const { confirm, showSuccess, showError } = useNotification();
  
  const [rooms, setRooms] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [filterHospId, setFilterHospId] = useState("");
  const [filterCatId, setFilterCatId] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    hospital_id: "",
    category_id: "",
    floor: "1",
    roomCount: "5",
    manualRoomName: "",
  });

  const [creationMode, setCreationMode] = useState("auto"); // "auto" or "manual"

  const [editingRoom, setEditingRoom] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", category_id: "", hospital_id: "" });
  const [editLoading, setEditLoading] = useState(false);

  const isAdminSystem = user?.role === "admin_system";
  const userHospId = user?.role === "admin_hospital" ? user?.hospital_id : null;

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterHospId, filterCatId, userHospId]);

  useEffect(() => {
    loadRooms();
  }, [filterHospId, filterCatId, userHospId, currentPage]);

  const loadInitialData = async () => {
    try {
      if (isAdminSystem) {
        const hospRes = await getHospitals();
        setHospitals(Array.isArray(hospRes) ? hospRes : hospRes?.data || []);
      }
      
      let initHospId = null;
      if (!isAdminSystem && userHospId) {
        setFormData(prev => ({ ...prev, hospital_id: userHospId }));
        setFilterHospId(userHospId);
        initHospId = userHospId;
      }
      
      const catRes = await getCategories(initHospId);
      setCategories(Array.isArray(catRes) ? catRes : catRes?.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const hId = formData.hospital_id || filterHospId || userHospId;
      try {
        const catRes = await getCategories(hId);
        setCategories(Array.isArray(catRes) ? catRes : catRes?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, [formData.hospital_id, filterHospId]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const hId = isAdminSystem ? filterHospId : userHospId;
      const res = await getRooms(hId || null, filterCatId || null, currentPage, limit);
      if (res && typeof res === 'object' && 'data' in res) {
        setRooms(res.data);
        setTotalItems(res.total);
        setTotalPages(res.totalPages);
      } else {
        const roomsArr = Array.isArray(res) ? res : [];
        setRooms(roomsArr);
        setTotalItems(roomsArr.length);
        setTotalPages(Math.ceil(roomsArr.length / limit));
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    if (!formData.hospital_id || !formData.category_id) {
      showError("Vui lòng điền Bệnh viện và Chuyên khoa");
      return;
    }

    const newRooms = [];
    let message = "";

    if (creationMode === "auto") {
      if (!formData.floor || !formData.roomCount) {
        showError("Vui lòng điền Tầng và Số lượng");
        return;
      }
      const count = parseInt(formData.roomCount);
      if (isNaN(count) || count <= 0 || count > 100) {
        showError("Số lượng phòng phải từ 1 đến 100");
        return;
      }

      const floor = formData.floor.trim();
      
      // Tìm số thứ tự lớn nhất hiện có cho tầng này
      const floorRooms = rooms.filter(r => 
        String(r.hospital_id) === String(formData.hospital_id) && 
        r.name.startsWith(`T${floor}`)
      );
      
      let maxNum = 0;
      floorRooms.forEach(r => {
        // T105 -> lấy "05"
        const numPart = r.name.replace(`T${floor}`, '');
        const n = parseInt(numPart);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      });

      for (let i = 1; i <= count; i++) {
        const nextNum = maxNum + i;
        const roomNumber = nextNum.toString().padStart(2, "0");
        const roomName = `T${floor}${roomNumber}`;
        
        newRooms.push({
          name: roomName,
          hospital_id: parseInt(formData.hospital_id),
          category_id: parseInt(formData.category_id),
        });
      }
      
      message = `Bạn sắp tạo ${count} phòng (từ T${floor}${String(maxNum + 1).padStart(2, '0')} đến T${floor}${String(maxNum + count).padStart(2, "0")}). Xác nhận?`;
    } else {
      if (!formData.manualRoomName.trim()) {
        showError("Vui lòng nhập tên phòng");
        return;
      }
      newRooms.push({
        name: formData.manualRoomName.trim(),
        hospital_id: parseInt(formData.hospital_id),
        category_id: parseInt(formData.category_id),
      });
      message = `Bạn sắp tạo phòng khám: ${formData.manualRoomName}. Xác nhận?`;
    }

    const isConfirm = await confirm("Xác nhận tạo phòng", message);
    if (!isConfirm) {
      return;
    }

    setSubmitLoading(true);
    try {
      await createBulkRooms(newRooms);
      showSuccess("Tạo phòng thành công!");
      if (creationMode === "manual") setFormData(prev => ({...prev, manualRoomName: ""}));
      loadRooms();
    } catch (error) {
      showError(error.message || "Lỗi khi tạo phòng");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name,
      category_id: room.category?.id || "",
      hospital_id: room.hospital_id || "",
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      showError("Tên phòng không được để trống!");
      return;
    }
    setEditLoading(true);
    try {
      const payload = { ...editFormData };
      if (payload.hospital_id) payload.hospital_id = parseInt(payload.hospital_id);
      if (payload.category_id) payload.category_id = parseInt(payload.category_id);
      
      await updateRoom(editingRoom.id, payload);
      showSuccess("Cập nhật phòng thành công!");
      setEditingRoom(null);
      loadRooms();
    } catch (error) {
      showError(error.message || "Lỗi khi cập nhật phòng");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteRoom = async (id, name) => {
    const isConfirm = await confirm(
      "Xác nhận xóa phòng",
      `Bạn có chắc chắn muốn xóa phòng [${name}]? Hành động này không thể hoàn tác.`,
      { variant: "danger", confirmText: "Xóa" }
    );
    if (!isConfirm) return;
    
    try {
      await deleteRoom(id);
      showSuccess("Đã xóa phòng thành công!");
      loadRooms();
    } catch (error) {
      showError(error.message || "Lỗi khi xóa phòng");
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
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" /> Tạo phòng khám
            </h2>
          </div>
          
          <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setCreationMode("auto")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${creationMode === "auto" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >Tự động</button>
            <button 
              onClick={() => setCreationMode("manual")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${creationMode === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >Thủ công</button>
          </div>

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

            {creationMode === "auto" ? (
              <>
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
                  <span className="font-semibold">Cơ chế thông minh:</span> Sẽ tự nối tiếp số thứ tự phòng đang có ở tầng đó. Tránh trùng tên. <br />
                  <span className="text-xs text-blue-600">Mẫu: T[tầng][số thứ tự]</span>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-4 h-4" /> Tên phòng khám
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: P.Khám Răng Đặc Biệt"
                  value={formData.manualRoomName}
                  onChange={(e) => setFormData({ ...formData, manualRoomName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:bg-blue-400"
            >
              {submitLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <><Plus className="w-5 h-5" /> {creationMode === "auto" ? "Tạo Tự Động" : "Tạo Phòng Khám"}</>
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
                    <th className="py-3 px-4 font-semibold text-center w-24">Hành động</th>
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
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(room)}
                            className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && rooms.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={limit}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg text-slate-800">Chỉnh sửa phòng khám</h3>
              <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4">
              {isAdminSystem && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bệnh viện</label>
                  <select
                    required
                    value={editFormData.hospital_id}
                    onChange={(e) => setEditFormData({ ...editFormData, hospital_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn bệnh viện --</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chuyên khoa</label>
                <select
                  required
                  value={editFormData.category_id}
                  onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn chuyên khoa --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên phòng</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 flex justify-center items-center gap-2"
                >
                  {editLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
