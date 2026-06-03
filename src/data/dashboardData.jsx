import {
  FaCommentDots,
  FaHome,
  FaUserCircle,
  FaWallet,
  FaUserInjured,
  FaRegFileImage,
  FaRegHospital,
  FaUserMd,
  FaRegListAlt,
  FaGlobeAmericas,
  FaRegNewspaper,
  FaRegCalendarAlt,
  FaBriefcaseMedical,
  FaBell,
} from "react-icons/fa";

export const adminNavItems = [
  { label: "Dashboard", Icon: FaHome, active: false, url: "/dashboard" },
  { label: "Hospitals", Icon: FaRegHospital, active: false, url: "/hospital" },
  { label: "Hospital Regs", Icon: FaRegFileImage, active: false, url: "/hospital-registrations" },
  { label: "Categories", Icon: FaRegListAlt, active: false, url: "/category" },
  { label: "Banners", Icon: FaRegFileImage, active: false, url: "/banner" },
  { label: "Packages", Icon: FaBriefcaseMedical, active: false, url: "/service-packages" },
  { label: "Appointments", Icon: FaRegCalendarAlt, active: false, url: "/appointment" },
  { label: "News", Icon: FaRegNewspaper, active: false, url: "/news" },
  { label: "Socials", Icon: FaGlobeAmericas, active: false, url: "/social" },
  { label: "Payments", Icon: FaWallet, active: false, url: "/payment" },
  { label: "Schedules", Icon: FaRegListAlt, active: false, url: "/schedules" },
  { label: "Notifications", Icon: FaBell, active: false, url: "/notifications" },
  { label: "Users", Icon: FaUserCircle, active: false, url: "/users" },
];

export const hospitalAdminNavItems = [
  { label: "Dashboard", Icon: FaHome, active: false, url: "/dashboard" },
  { label: "Doctors", Icon: FaUserMd, active: false, url: "/doctor" },
  { label: "Patients", Icon: FaUserInjured, active: false, url: "/patient" },
  { label: "Packages", Icon: FaBriefcaseMedical, active: false, url: "/service-packages" },
  { label: "Appointments", Icon: FaRegCalendarAlt, active: false, url: "/appointment" },
  { label: "Schedules", Icon: FaRegListAlt, active: false, url: "/schedules" },
  { label: "Reviews", Icon: FaCommentDots, active: false, url: "/review" },
  { label: "Requests", Icon: FaRegFileImage, active: false, url: "/doctor-requests" },
  { label: "Notifications", Icon: FaBell, active: false, url: "/notifications" },
];

