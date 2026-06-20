import React, { useState } from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meetingDate: "",
    startTime: "",
    endTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Basic frontend validation to prevent stupid requests
    if (formData.startTime >= formData.endTime) {
      setError("End time must be after start time.");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/meetings/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId,
            ...formData,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule meeting");
      }

      alert("Meeting requested successfully!");
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Schedule Meeting with {receiverName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Meeting Title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Initial Investment Pitch"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agenda / Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="What will you discuss?"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Date"
                type="date"
                name="meetingDate"
                required
                value={formData.meetingDate}
                onChange={handleChange}
                startAdornment={<CalendarIcon size={16} />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  startAdornment={<Clock size={16} />}
                />
                <Input
                  label="End Time"
                  type="time"
                  name="endTime"
                  required
                  value={formData.endTime}
                  onChange={handleChange}
                  startAdornment={<Clock size={16} />}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending Request..." : "Send Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
