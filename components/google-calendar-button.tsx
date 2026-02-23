"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Check } from "lucide-react";
import { isGoogleCalendarConnected } from "@/app/actions/google-calendar";

export function GoogleCalendarButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    isGoogleCalendarConnected().then(setIsConnected);
  }, []);

  useEffect(() => {
    // Check for success/error messages in URL params after redirect
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const synced = searchParams.get("synced");
    const skipped = searchParams.get("skipped");

    let timeoutId: NodeJS.Timeout | undefined;

    if (success === "calendar_synced") {
      setIsConnected(true);
      setMessage({
        type: "success",
        text: `Calendar synced! ${synced || 0} event(s) added. ${skipped || 0} duplicate(s) skipped.`,
      });

      // Clean up URL params after showing message
      timeoutId = setTimeout(() => {
        window.history.replaceState({}, "", window.location.pathname);
        setMessage(null);
      }, 5000);
    }

    if (error) {
      let errorMessage = "Failed to sync calendar";

      switch (error) {
        case "oauth_denied":
          errorMessage = "You denied access to your Google Calendar";
          break;
        case "oauth_setup_failed":
          errorMessage = "Failed to set up OAuth connection";
          break;
        case "missing_code":
          errorMessage = "Missing authorization code";
          break;
        case "token_exchange_failed":
          errorMessage = "Failed to exchange authorization code";
          break;
        case "sync_failed":
          errorMessage = "Failed to sync calendar events";
          break;
        default:
          errorMessage = decodeURIComponent(error);
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });

      // Clean up URL params after showing message
      timeoutId = setTimeout(() => {
        window.history.replaceState({}, "", window.location.pathname);
        setMessage(null);
      }, 5000);
    }

    // Cleanup function to clear timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams]);

  const handleSyncCalendar = () => {
    setIsLoading(true);
    window.location.href = "/api/google/calendar/connect";
  };

  const buttonLabel = isLoading
    ? "Connecting..."
    : isConnected
      ? "Connected"
      : "Sync Google Calendar";

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleSyncCalendar}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className={`gap-2 ${isConnected ? "border-green-500 text-green-600 hover:bg-green-50" : ""}`}
      >
        {isConnected ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Calendar className="h-4 w-4" />
        )}
        {buttonLabel}
      </Button>
      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
