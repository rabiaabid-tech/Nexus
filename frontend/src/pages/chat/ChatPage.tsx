import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Send,
  Phone,
  Video,
  Info,
  Smile,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { ChatMessage } from "../../components/chat/ChatMessage";
import { ChatUserList } from "../../components/chat/ChatUserList";
import { useAuth } from "../../context/AuthContext";
import { io, Socket } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  // States for DB Data & WebSockets
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  // Independent state for real-time online presence (kept separate from DB contacts
  // so the slow HTTP response can never overwrite the live socket data)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Separate loading state for the active chat window, so a failed/slow
  // history fetch can never leave the UI permanently stuck on "Loading..."
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 1. CORE LIFECYCLE: Fetch Contacts & Global Socket Connection
  useEffect(() => {
    if (!currentUser) return;

    // Fetch Sidebar Contacts
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("business_nexus_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/messages/contacts`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchContacts();

    //  Strip '/api' from URL to connect to the global WebSocket room
    const socketUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
      : "http://localhost:5000";

    const newSocket = io(socketUrl);
    setSocket(newSocket);
    // online list is never missed (fixes the Disjointed Listener Trap)
    newSocket.on("online-users-list", (onlineIds: string[]) => {
      setOnlineUserIds(onlineIds.map(String));
    });

    newSocket.on(
      "user-status-change",
      ({
        userId: changedUserId,
        isOnline,
      }: {
        userId: string;
        isOnline: boolean;
      }) => {
        setOnlineUserIds((prev) => {
          if (isOnline) {
            return [...new Set([...prev, String(changedUserId)])];
          } else {
            return prev.filter((id) => id !== String(changedUserId));
          }
        });
      },
    );

    // Auto-register on connect & reconnect
    newSocket.on("connect", () => {
      newSocket.emit("register-user", currentUser.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // 2. CHAT WINDOW LIFECYCLE: Load Active History & Live Message Listener
  useEffect(() => {
    if (!currentUser || !userId) return;

    const fetchChatHistory = async () => {
      setIsLoadingMessages(true);
      try {
        const token = localStorage.getItem("business_nexus_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/messages/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          // Backend se empty array aaye ya data, dono safely handle honge
          setMessages(Array.isArray(data) ? data : []);
        } else {
          setMessages([]); // Error ho toh empty list, UI hang nahi hogi
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setMessages([]); // Crash na ho, bas empty dikhaye
      } finally {
        setIsLoadingMessages(false); // Loading state hamesha resolve hogi
      }
    };

    fetchChatHistory();

    if (!socket) return;

    const handleReceiveMessage = (data: any) => {
      // Safety check: yeh message current active conversation ke liye hai?
      if (
        String(data.senderId) === String(userId) ||
        String(data.receiverId) === String(userId)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            sender_id: data.senderId,
            receiver_id: data.receiverId,
            content: data.content,
            created_at: data.created_at || new Date().toISOString(),
          },
        ]);
      }
    };

    socket.on("receive-private-message", handleReceiveMessage);

    return () => {
      socket.off("receive-private-message", handleReceiveMessage);
    };
  }, [currentUser, userId, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send Message Logic
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId || !socket) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setShowEmojiPicker(false);

    // Optimistic update for UI speed
    const optimisticMsg = {
      id: Date.now(),
      sender_id: currentUser.id,
      receiver_id: userId,
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Single source of truth for sending message: Socket handles DB save AND delivery
    socket.emit("send-private-message", {
      senderId: currentUser.id,
      receiverId: userId,
      content: messageContent,
      created_at: optimisticMsg.created_at,
    });
  };

  if (!currentUser) return null;

  // online status comes from the independent live socket state
  const partnerInfo = contacts.find((c) => String(c.id) === String(userId));
  const isPartnerOnline = onlineUserIds.includes(String(userId));

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        {isLoadingContacts ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={24} />
          </div>
        ) : (
          <ChatUserList
            contacts={contacts.map((c) => ({
              ...c,
              isOnline: onlineUserIds.includes(String(c.id)),
            }))}
          />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {userId ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={
                    partnerInfo?.avatar_url ||
                    `https://ui-avatars.com/api/?name=User`
                  }
                  alt={partnerInfo?.name || "User"}
                  size="md"
                  status={isPartnerOnline ? "online" : undefined}
                  className="mr-3"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {isLoadingContacts
                      ? "Loading..."
                      : partnerInfo?.name || "Unknown User"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isPartnerOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Voice call"
                >
                  <Phone size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Video call"
                >
                  <Video size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Info"
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2
                    className="animate-spin text-primary-600"
                    size={24}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isCurrentUser={
                        String(message.sender_id) === String(currentUser.id)
                      }
                      currentUserAvatar={currentUser.avatarUrl || ""}
                      otherUserAvatar={partnerInfo?.avatar_url || ""}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Professional WhatsApp Style Input Area */}
            <div className="border-t border-gray-200 p-3 bg-[#f0f2f5] relative">
              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-lg overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={(emojiObject) => {
                      setNewMessage((prev) => prev + emojiObject.emoji);
                    }}
                    width={320}
                    height={400}
                  />
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-200"
                  aria-label="Toggle emoji"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={26} />
                </Button>

                {/* Clean, rounded native input replacing the ugly component */}
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    fontFamily:
                      "'Inter', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif",
                  }}
                  className="flex-1 rounded-full border-0 px-5 py-3 focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm text-sm text-gray-800"
                  autoComplete="off"
                />

                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="rounded-full w-11 h-11 flex items-center justify-center shadow-sm disabled:opacity-50 transition-transform active:scale-95"
                >
                  <Send size={20} className="ml-1" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">
              Select a conversation
            </h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
