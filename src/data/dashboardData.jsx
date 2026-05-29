import {
  FaChartLine,
  FaCommentDots,
  FaCreditCard,
  FaExchangeAlt,
  FaHamburger,
  FaHome,
  FaLifeRing,
  FaSlidersH,
  FaTshirt,
  FaUniversity,
  FaUserCircle,
  FaWallet,
  FaUserInjured,
  FaRegFileImage,
  FaRegHospital,
  FaUserMd,
  FaRegListAlt,
  FaGlobeAmericas,
  FaRegNewspaper,
} from "react-icons/fa";

export const adminNavItems = [
  { label: "Dashboard", Icon: FaHome, active: false, url: "/dashboard" },
  { label: "Hospitals", Icon: FaRegHospital, active: false, url: "/hospital" },
  { label: "Hospital Regs", Icon: FaRegFileImage, active: false, url: "/hospital-registrations" },
  { label: "Categories", Icon: FaRegListAlt, active: false, url: "/category" },
  { label: "Banners", Icon: FaRegFileImage, active: false, url: "/banner" },
  { label: "News", Icon: FaRegNewspaper, active: false, url: "/news" },
  { label: "Socials", Icon: FaGlobeAmericas, active: false, url: "/social" },
  { label: "Payments", Icon: FaWallet, active: false, url: "/payment" },
  { label: "Users", Icon: FaUserCircle, active: false, url: "/users" },
];

export const hospitalAdminNavItems = [
  { label: "Dashboard", Icon: FaHome, active: false, url: "/dashboard" },
  { label: "Doctors", Icon: FaUserMd, active: false, url: "/doctor" },
  { label: "Patients", Icon: FaUserInjured, active: false, url: "/patient" },
  { label: "Schedules", Icon: FaRegListAlt, active: false, url: "/schedules" },
  { label: "Reviews", Icon: FaCommentDots, active: false, url: "/review" },
  { label: "Requests", Icon: FaRegFileImage, active: false, url: "/doctor-requests" },
];

export const transferCards = [
  {
    title: "Digital Payments",
    amount: "$1,875",
    Icon: FaCreditCard,
  },
  {
    title: "External Transfers",
    amount: "$263",
    Icon: FaExchangeAlt,
  },
  {
    title: "Domestic Transfers",
    amount: "$394",
    Icon: FaUniversity,
  },
];

export const recentExpenses = [
  {
    title: "Dining Out",
    time: "Today, 14:45",
    amount: "-$78",
    type: "negative",
    Icon: FaHamburger,
  },
  {
    title: "Retail Purchase",
    time: "Yesterday, 16:08",
    amount: "-$125",
    type: "negative",
    Icon: FaTshirt,
  },
];

export const connections = [
  {
    title: "Lisa Johnson",
    time: "Today, 09:35",
    amount: "+$85",
    type: "positive",
    image: "https://i.pravatar.cc/100?img=12",
  },
  {
    title: "Michael Torres",
    time: "Monday, 17:45",
    amount: "-$42",
    type: "negative",
    image: "https://i.pravatar.cc/100?img=11",
  },
];

export const timeOptions = ["Daily", "Weekly", "Monthly", "Annual"];

export const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
