import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageCircle,
  UserPlus,
  DollarSign,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { Card, CardBody } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch notifications from backend (no socket here — global socket lives in DashboardLayout)
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        const formatted = data.map((n: any) => {
          const notifDate = new Date(n.created_at);
          const secondsDiff = differenceInSeconds(new Date(), notifDate);

          const timeDisplay =
            secondsDiff < 60
              ? "Just now"
              : formatDistanceToNow(notifDate, { addSuffix: true });

          return {
            id: n.id,
            type: n.type || "message",
            user: {
              id: n.sender_id,
              name: n.sender_name || "System",
              avatar:
                n.sender_avatar || "https://ui-avatars.com/api/?name=System",
            },
            content: n.message,
            time: timeDisplay,
            unread: !n.is_read,
          };
        });

        setNotifications(formatted);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  // Mark all notifications as read (optimistic update + backend sync)
  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);

    // Optimistic UI update
    const previousState = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/read`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to mark as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      setNotifications(previousState);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle size={16} className="text-primary-600" />;
      case "connection":
        return <UserPlus size={16} className="text-secondary-600" />;
      case "investment":
        return <DollarSign size={16} className="text-accent-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const hasUnread = notifications.some((n) => n.unread);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your network activity
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markingAll || !hasUnread}
        >
          {markingAll ? "Marking..." : "Mark all as read"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => {
                  if (notification.type === "message" && notification.user.id) {
                    navigate(`/chat/${notification.user.id}`);
                  }
                }}
                className={`transition-colors duration-200 cursor-pointer hover:bg-gray-50 ${
                  notification.unread ? "bg-primary-50" : ""
                }`}
              >
                <CardBody className="flex items-start p-4">
                  <Avatar
                    src={notification.user.avatar}
                    alt={notification.user.name}
                    size="md"
                    className="flex-shrink-0 mr-4"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {notification.user.name}
                      </span>
                      {notification.unread && (
                        <Badge variant="primary" size="sm" rounded>
                          New
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mt-1">{notification.content}</p>

                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      {getNotificationIcon(notification.type)}
                      <span>{notification.time}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">
              No notifications yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
