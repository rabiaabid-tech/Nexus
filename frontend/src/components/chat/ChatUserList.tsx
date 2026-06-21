import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { useAuth } from "../../context/AuthContext";

interface ChatUserListProps {
  contacts: any[]; 
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ contacts }) => {
  const navigate = useNavigate();
  const { userId: activeUserId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const handleUserClick = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white border-r border-gray-200 w-full md:w-64 overflow-y-auto">
      <div className="py-4">
        <h2 className="px-4 text-lg font-semibold text-gray-800 mb-4">
          Messages
        </h2>

        <div className="space-y-1">
          {contacts.length > 0 ? (
            contacts.map((contact) => {
              // Exact match IDs to highlight active chat
              const isActive = String(activeUserId) === String(contact.id);

              // Backend might send lastMessage object in future, safely extract it
              const lastMessage = contact.lastMessage || null;

              return (
                <div
                  key={contact.id}
                  className={`px-4 py-3 flex cursor-pointer transition-colors duration-200 ${
                    isActive
                      ? "bg-primary-50 border-l-4 border-primary-600"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                  onClick={() => handleUserClick(contact.id)}
                >
                  <Avatar
                    src={
                      contact.avatar_url ||
                      `https://ui-avatars.com/api/?name=${contact.name}`
                    }
                    alt={contact.name}
                    size="md"
                    // Placeholder for online status integration via Socket.io later
                    status={contact.isOnline ? "online" : undefined}
                    className="mr-3 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                      </h3>

                      {/* CRITICAL: Restored Time logic */}
                      {lastMessage && lastMessage.created_at && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(lastMessage.created_at),
                            { addSuffix: false },
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      {/* CRITICAL: Restored Last Message "You:" prefix logic */}
                      {lastMessage ? (
                        <p className="text-xs text-gray-600 truncate">
                          {String(lastMessage.sender_id) ===
                          String(currentUser.id)
                            ? "You: "
                            : ""}
                          {lastMessage.content}
                        </p>
                      ) : (
                        // Fallback design if no last message exists
                        <p className="text-xs text-gray-400 truncate capitalize">
                          {contact.role}
                        </p>
                      )}

                      {/* CRITICAL: Restored Unread Badge logic */}
                      {lastMessage &&
                        !lastMessage.is_read &&
                        String(lastMessage.sender_id) !==
                          String(currentUser.id) && (
                          <Badge variant="primary" size="sm" rounded>
                            New
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
