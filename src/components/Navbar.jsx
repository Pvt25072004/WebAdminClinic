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
                "mb-2 flex items-center rounded-xl px-5 py-3.5 text-[15px] font-medium transition-all duration-300 hover:translate-x-2 hover:bg-slate-800/50 hover:text-emerald-400 relative overflow-hidden group",
                "max-lg:justify-center max-lg:px-0 max-lg:py-4 max-lg:hover:translate-x-0",
                isActive
                  ? "bg-emerald-500/10 font-semibold text-emerald-400"
                  : "text-slate-400",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 transition-all duration-300 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 group-hover:opacity-50 group-hover:scale-y-75'}`} />
                <Icon className={`mr-4 w-6 text-lg max-lg:mr-0 max-lg:text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="max-lg:hidden">{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
