import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        borderRadius: "40px",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
        <path
          d="M22 8C22 8 18 8 16 10C14 12 12 16 12 16C12 16 10 20 10 22C10 24 12 26 14 26"
          stroke="#e85a2c"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M10 6C12 6 14 8 14 10"
          stroke="#e85a2c"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M18 22C18 24 20 26 22 26"
          stroke="#e85a2c"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>
    </div>,
    {
      ...size,
    }
  );
}
