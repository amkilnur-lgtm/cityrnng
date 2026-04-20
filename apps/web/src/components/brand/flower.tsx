import Image from "next/image";
import { cn } from "@/lib/utils";

interface FlowerProps {
  /** Pixel size for both width and height. Defaults to 24. */
  size?: number;
  className?: string;
  /** Optional rotation in degrees — adds organic variation between instances. */
  rotate?: number;
  alt?: string;
}

/**
 * Real brand flower (cropped from the t-shirt print).
 * Static asset — zero runtime cost, scales cleanly with `size`.
 */
export function Flower({ size = 24, className, rotate = 0, alt = "" }: FlowerProps) {
  return (
    <span
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
      aria-hidden={alt === ""}
    >
      <Image
        src="/brand/flower.png"
        alt={alt}
        width={size}
        height={size}
        priority={size >= 64}
      />
    </span>
  );
}
