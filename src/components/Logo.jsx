export default function Logo() {
  return (
    <svg width="100" height="40" viewBox="0 0 100 40" className="h-10 w-auto">
      <path d="M12,15 L30,15 L24,27 L12,27 Z" fill="#4270F4" />
      <text
        x="38"
        y="27"
        fill="#262A39"
        fontSize="20"
        fontWeight="bold"
        className="max-lg:hidden"
      >
        Clinic
      </text>
    </svg>
  );
}
