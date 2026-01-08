import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function SidePanelSection({ children, title, className }: { children: ReactNode, title?: string, className?: string }) {
  return (
    <div className={cn("bg-muted p-2 rounded-lg flex flex-col gap-2", className)}>
      {title ?? <h3>{title}</h3>}
      {children}
    </div >
  )
}
