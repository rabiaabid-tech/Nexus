import React from "react";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { Avatar } from "../ui/Avatar";

// Message structure that comes from db
interface ChatMessageProps {
  message: any;
  isCurrentUser: boolean;
  currentUserAvatar: string;
  otherUserAvatar: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  currentUserAvatar,
  otherUserAvatar,
}) => {
  // Determine which avatar to show
  const avatarToUse = isCurrentUser ? currentUserAvatar : otherUserAvatar;

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4 animate-fade-in`}
    >
      {!isCurrentUser && (
        <Avatar
          src={avatarToUse}
          alt="User"
          size="sm"
          className="mr-2 self-end"
        />
      )}

      <div
        className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
            isCurrentUser
              ? "bg-primary-600 text-white rounded-br-none"
              : "bg-gray-100 text-gray-800 rounded-bl-none"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        <span className="text-xs text-gray-500 mt-1">
          {(() => {
            if (!message.created_at) return "Just now";

            const messageDate = new Date(message.created_at);
            const secondsDiff = differenceInSeconds(new Date(), messageDate);

            if (secondsDiff < 60) {
              return "Just now";
            }
            return formatDistanceToNow(messageDate, { addSuffix: true });
          })()}
        </span>
      </div>

      {isCurrentUser && (
        <Avatar
          src={avatarToUse}
          alt="Me"
          size="sm"
          className="ml-2 self-end"
        />
      )}
    </div>
  );
};
