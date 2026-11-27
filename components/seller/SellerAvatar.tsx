"use client";

import { useState } from "react";

type SellerAvatarProps = {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-lg",
  lg: "h-28 w-28 text-3xl",
};

export default function SellerAvatar({
  src,
  name,
  size = "md",
}: SellerAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map((word) => Array.from(word)[0]).join("").toUpperCase() || "KD";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 font-bold text-orange-700 ${sizes[size]}`}
    >
      {src && failedSrc !== src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={`Foto atau logo ${name}`}
          className="h-full w-full bg-white object-contain p-1"
          width={112}
          height={112}
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span role="img" aria-label={`Avatar lalai ${name}`}>
          {initials}
        </span>
      )}
    </span>
  );
}
