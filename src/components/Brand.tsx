import { Orbit } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <Orbit size={21} strokeWidth={2.5} />
      </span>
      <span>
        کیو<span className="brand-accent">پایلوت</span>
      </span>
    </div>
  );
}
