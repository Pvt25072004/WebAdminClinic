import { NavLink } from "react-router-dom";

export default function Navbar({ navItems }) {
  return (
    <nav className="flex flex-1 flex-col px-4">
      {navItems.map(({ label, Icon, url }) => {
        return (
          <NavLink
            key={label}
            to={url || "/"}
            className={({ isActive }) =>
              [
                "mb-2 flex items-center rounded-xl border-l-[3px] px-5 py-3.5 text-[15px] font-medium transition-all duration-300 hover:translate-x-1 hover:bg-[#edf0fb] hover:text-emerald-500",
                "max-lg:justify-center max-lg:px-0 max-lg:py-4",
                isActive
                  ? "border-emerald-500 bg-[#edf0fb] font-semibold text-emerald-500"
                  : "border-transparent text-[#6c7380]",
              ].join(" ")
            }
          >
            <Icon className="mr-4 w-6 text-lg max-lg:mr-0 max-lg:text-xl" />
            <span className="max-lg:hidden">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
