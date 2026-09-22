import React from "react";

export default function WorkforceLogo({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="14" fill="var(--accent-black)" />
      <path
        d="M13 16L19.5 32L24 21L28.5 32L35 16"
        stroke="var(--bg-main)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="14" r="3" fill="var(--bg-main)" />
    </svg>
  );
}
