"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Calendar, Clock, Target, Check, Loader2 } from "lucide-react";
import { getAICalendarSuggestions, createEventFromSuggestion, createEventsFromSuggestions } from "@/app/actions/ai-calendar";

interface CalendarSuggestion {
  title: string;
  description: string;
  suggestedDate: string;
  suggestedTime: string;
  durationMinutes: number;
  reasoning: string;
  relatedGoalId?: number;
  priority: "high" | "medium" | "low";
}

export function AICalendarSuggestions() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CalendarSuggestion[]>([]);
  const [strategy, setStrategy] = useState("");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await getAICalendarSuggestions();
      
      if (result.success) {
        setSuggestions(result.suggestions);
        setStrategy(result.strategy);
        // Select all suggestions by default
        setSelectedSuggestions(new Set(result.suggestions.map((_, i) => i)));
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to generate suggestions",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to generate suggestions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleCreateEvents = async () => {
    setCreating(true);
    setMessage(null);

    try {
      const selectedSuggestionsList = suggestions.filter((_, i) => 
        selectedSuggestions.has(i)
      );

      const result = await createEventsFromSuggestions(selectedSuggestionsList);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message,
        });
        
        // Clear selections and close after a delay
        setTimeout(() => {
          setOpen(false);
          setSuggestions([]);
          setSelectedSuggestions(new Set());
          setMessage(null);
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: "Failed to create events",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to create events",
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setOpen(true);
            if (suggestions.length === 0) {
              handleGetSuggestions();
            }
          }}
        >
          <Sparkles className="h-4 w-4" />
          AI Calendar Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Calendar Suggestions
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-sm text-gray-600">Analyzing your goals and schedule...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Get AI-powered suggestions for scheduling time to work on your goals
            </p>
            <Button onClick={handleGetSuggestions} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {strategy && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  <strong>Strategy:</strong> {strategy}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSuggestions.has(index)
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleToggleSuggestion(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center justify-center w-6 h-6 rounded border-2 ${
                          selectedSuggestions.has(index)
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-300"
                        }`}>
                          {selectedSuggestions.has(index) && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 ml-8">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 ml-8">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(suggestion.suggestedDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {suggestion.suggestedTime} ({suggestion.durationMinutes}min)
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500 ml-8 bg-gray-50 p-2 rounded">
                        <strong>Why:</strong> {suggestion.reasoning}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                {selectedSuggestions.size} of {suggestions.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuggestions([]);
                    setSelectedSuggestions(new Set());
                    handleGetSuggestions();
                  }}
                  disabled={creating}
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleCreateEvents}
                  disabled={selectedSuggestions.size === 0 || creating}
                  className="gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      Add {selectedSuggestions.size} to Calendar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
