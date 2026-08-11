export function PenguinIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Feet */}
      <path d="M10 27C8.5 27 7.5 28 8 29.5C8.5 30 10 30 11.5 29.5C12.5 29 12 27.5 11 27H10Z" fill="#FB923C" />
      <path d="M22 27C23.5 27 24.5 28 24 29.5C23.5 30 22 30 20.5 29.5C19.5 29 20 27.5 21 27H22Z" fill="#FB923C" />

      {/* Body */}
      <path
        d="M16 2C10.5 2 6 6.5 6 12V19C6 24.5 10.5 29 16 29C21.5 29 26 24.5 26 19V12C26 6.5 21.5 2 16 2Z"
        fill="#1E1B4B"
      />

      {/* Wings */}
      <path d="M6 13C4.5 14 3.5 16 3.5 18.5C3.5 20.5 4.5 22 6 21V13Z" fill="#312E81" />
      <path d="M26 13C27.5 14 28.5 16 28.5 18.5C28.5 20.5 27.5 22 26 21V13Z" fill="#312E81" />

      {/* White Tummy */}
      <path
        d="M16 11C12.5 11 9.5 14 9.5 18.5C9.5 23 12.5 27 16 27C19.5 27 22.5 23 22.5 18.5C22.5 14 19.5 11 16 11Z"
        fill="#F8FAFC"
      />

      {/* Eyes Outer */}
      <circle cx="12" cy="9.5" r="2.5" fill="white" />
      <circle cx="20" cy="9.5" r="2.5" fill="white" />

      {/* Pupils */}
      <circle cx="12.5" cy="9.5" r="1.3" fill="#0F172A" />
      <circle cx="19.5" cy="9.5" r="1.3" fill="#0F172A" />
      <circle cx="13" cy="9" r="0.4" fill="white" />
      <circle cx="20" cy="9" r="0.4" fill="white" />

      {/* Cute Blush */}
      <ellipse cx="10" cy="12" rx="1.2" ry="0.7" fill="#F472B6" opacity="0.6" />
      <ellipse cx="22" cy="12" rx="1.2" ry="0.7" fill="#F472B6" opacity="0.6" />

      {/* Beak */}
      <path d="M16 10.5L13.5 13.5C14.5 14.5 17.5 14.5 18.5 13.5L16 10.5Z" fill="#F97316" />
    </svg>
  );
}
