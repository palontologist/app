"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GoogleCalendarButton() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check for success/error messages in URL params after redirect
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const synced = searchParams.get("synced");
    const skipped = searchParams.get("skipped");

    if (success === "calendar_synced") {
      toast({
        title: "Calendar synced successfully!",
        description: `Synced ${synced || 0} event(s). Skipped ${skipped || 0} duplicate(s).`,
        variant: "default",
      });

      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
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

      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Clean up URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, toast]);

  const handleSyncCalendar = () => {
    setIsLoading(true);
    // Redirect to the OAuth connect endpoint
    window.location.href = "/api/google/calendar/connect";
  };

  return (
    <Button
      onClick={handleSyncCalendar}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      {isLoading ? "Connecting..." : "Sync Google Calendar"}
    </Button>
  );
}
