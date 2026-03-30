"use client";

import { MessageCircleMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export function WhatsAppButton({
  phoneNumber = "+880123456789",
  message = "Hello! I'm interested in your services.",
  className,
}: WhatsAppButtonProps) {
  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      onClick={handleClick}
      size="icon-lg"
      variant="outline"
      className={cn(
        "fixed right-6 rounded-full shadow-lg z-100 transition-all duration-300 ease-in-out hover:scale-110 bg-[#25D366] hover:bg-[#22c35e] text-white border-none",
        "bottom-20 md:bottom-6",
        className
      )}
    >
      <MessageCircleMore />
      <span className="sr-only">Contact on WhatsApp</span>
    </Button>
  );
}
