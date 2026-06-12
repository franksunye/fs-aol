import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7c3aed",
          borderRadius: 8,
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size }
  );
}
