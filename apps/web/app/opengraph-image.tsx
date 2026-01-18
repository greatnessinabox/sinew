import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Sinew - Infrastructure Patterns for Developers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        backgroundColor: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fiber pattern background */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.15,
        }}
        viewBox="0 0 1200 630"
        fill="none"
      >
        <path
          d="M100 0 Q 150 100, 120 200 Q 90 300, 140 400 Q 190 500, 130 630"
          stroke="#e85a2c"
          strokeWidth="2"
        />
        <path
          d="M300 0 Q 350 100, 320 200 Q 290 300, 340 400 Q 390 500, 330 630"
          stroke="#e85a2c"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <path
          d="M500 0 Q 550 100, 520 200 Q 490 300, 540 400 Q 590 500, 530 630"
          stroke="#e85a2c"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M700 0 Q 750 100, 720 200 Q 690 300, 740 400 Q 790 500, 730 630"
          stroke="#e85a2c"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M900 0 Q 950 100, 920 200 Q 890 300, 940 400 Q 990 500, 930 630"
          stroke="#e85a2c"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <path
          d="M1100 0 Q 1150 100, 1120 200 Q 1090 300, 1140 400 Q 1190 500, 1130 630"
          stroke="#e85a2c"
          strokeWidth="2"
        />
      </svg>

      {/* Corner accent */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "300px",
          height: "300px",
          opacity: 0.4,
        }}
        viewBox="0 0 200 200"
      >
        <path
          d="M200 0 Q 140 30, 120 100 Q 100 170, 80 200"
          fill="none"
          stroke="#e85a2c"
          strokeWidth="2"
        />
        <path
          d="M200 30 Q 160 60, 150 120 Q 140 180, 130 200"
          fill="none"
          stroke="#e85a2c"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M170 0 Q 120 40, 100 90 Q 80 140, 40 200"
          fill="none"
          stroke="#e85a2c"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      {/* Bottom left corner */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "250px",
          height: "250px",
          opacity: 0.3,
          transform: "scaleY(-1)",
        }}
        viewBox="0 0 200 200"
      >
        <path
          d="M0 0 Q 60 30, 80 100 Q 100 170, 120 200"
          fill="none"
          stroke="#e85a2c"
          strokeWidth="2"
        />
        <path
          d="M0 30 Q 40 60, 50 120 Q 60 180, 70 200"
          fill="none"
          stroke="#e85a2c"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </svg>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#121212" />
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
          <span
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#e8e8e8",
              letterSpacing: "-0.02em",
            }}
          >
            Sinew
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#e8e8e8",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: 0,
            maxWidth: "1000px",
          }}
        >
          <div>The connective tissue</div>
          <div style={{ color: "#e85a2c", marginTop: "8px" }}>that makes apps work.</div>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "24px",
            color: "#808080",
            marginTop: "24px",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          Infrastructure patterns for databases, auth, deployment, and more. Copy. Paste. Ship.
        </p>
      </div>

      {/* Accent line at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "80px",
          right: "80px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #e85a2c, transparent)",
          opacity: 0.5,
        }}
      />
    </div>,
    {
      ...size,
    }
  );
}
