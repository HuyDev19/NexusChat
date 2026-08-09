import { cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: "online" | "offline" | "busy" }) => {
  return (
    <div
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background",
        status === "online" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
        status === "offline" && "bg-slate-500",
        status === "busy" && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      )}
    ></div>
  );
};

export default StatusBadge;