"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Vendors", icon: Search, href: "/vendors" },
  { label: "Post", icon: PlusCircle, href: "/post-request", isCenter: true },
  { label: "Venue", icon: MapPin, href: "/venues" },
  { label: "Profile", icon: User, href: "/user/dashboard" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down
          setIsVisible(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener("scroll", controlNavbar);

    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 h-16 px-4 flex items-center justify-between pb-safe transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-[150%]"
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.isCenter) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative -top-2 flex flex-col items-center group"
            >
              <div className="bg-primary h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-active:scale-90 border-4 border-white">
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1 transition-all active:scale-90"
          >
            <Icon className={cn(
              "h-5 w-5 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
