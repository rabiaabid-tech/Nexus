import React, { useState, useEffect } from "react";
import { Calendar, Clock, Check, X, Video } from "lucide-react"; 
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";

export const MeetingWidget: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/meetings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/meetings/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        fetchMeetings(); // Refresh the list automatically
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Network error while updating status.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading your schedule...
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">No meetings scheduled yet.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800",
    Accepted: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
    Canceled: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        // Logic to dynamically determine who is the "other person" in the meeting
        const isReceiver = String(user?.id) === String(meeting.receiverId);
        const otherPartyName = isReceiver
          ? meeting.senderName
          : meeting.receiverName;
        const otherPartyAvatar = isReceiver
          ? meeting.senderAvatar
          : meeting.receiverAvatar;

        const checkIsMeetingActive = () => {
          const now = new Date();
          // Extract just the YYYY-MM-DD part safely
          const datePart = new Date(meeting.meetingDate)
            .toISOString()
            .split("T")[0];

          const meetingStart = new Date(`${datePart}T${meeting.startTime}`);
          const meetingEnd = new Date(`${datePart}T${meeting.endTime}`);

          // open room before 5 mint earlier
          const windowStart = new Date(meetingStart.getTime() - 5 * 60000);

          return now >= windowStart && now <= meetingEnd;
        };

        const isMeetingActive = checkIsMeetingActive();

        return (
          <div
            key={meeting.id}
            className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <Avatar src={otherPartyAvatar} alt={otherPartyName} size="lg" />
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  {meeting.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {meeting.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3 font-medium">
                  <span className="flex items-center gap-1">
                    <UserCircle size={16} className="text-primary-600" />{" "}
                    {otherPartyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} className="text-primary-600" />{" "}
                    {new Date(meeting.meetingDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} className="text-primary-600" />{" "}
                    {meeting.startTime} - {meeting.endTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full md:w-auto">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusColors[meeting.status] || "bg-gray-100"}`}
              >
                {meeting.status}
              </span>

              {/* Action Buttons: If logged-in user received the request and it's pending */}
              {meeting.status === "Pending" && isReceiver && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(meeting.id, "Rejected")}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X size={16} className="mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatus(meeting.id, "Accepted")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check size={16} className="mr-1" /> Accept
                  </Button>
                </div>
              )}

              {/* Action Buttons: If logged-in user sent the request and it's pending */}
              {meeting.status === "Pending" && !isReceiver && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus(meeting.id, "Canceled")}
                  className="text-gray-600"
                >
                  Cancel Request
                </Button>
              )}
              {meeting.status === "Accepted" && (
                <>
                  {isMeetingActive ? (
                    <Link to={`/room/${meeting.id}`}>
                      <Button
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                      >
                        <Video size={16} className="mr-2" /> Join Video Call
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-2 rounded-md border border-gray-200">
                      <Clock size={14} className="inline mr-1" />
                      Room opens 5 mins early
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function UserCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}
