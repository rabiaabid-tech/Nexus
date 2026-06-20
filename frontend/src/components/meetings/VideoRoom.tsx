import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Peer from "peerjs";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const VideoRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Connect to our Backend Socket.io
    socketRef.current = io(
      import.meta.env.VITE_API_BASE_URL.replace("/api", ""),
    );

    // 2. Initialize PeerJS (For WebRTC stream exchange)
    peerRef.current = new Peer(String(user.id));

    // 3. Get User Media (Camera & Mic)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        // 4. Answer incoming calls
        peerRef.current?.on("call", (call) => {
          call.answer(stream);
          call.on("stream", (userVideoStream) => {
            if (peerVideoRef.current) {
              peerVideoRef.current.srcObject = userVideoStream;
            }
          });
        });

        // 5. Let backend know we joined the room
        peerRef.current?.on("open", (id) => {
          socketRef.current.emit("join-room", roomId, id);
        });

        // 6. When a new user connects, call them
        socketRef.current.on("user-connected", (userId: string) => {
          const call = peerRef.current?.call(userId, stream);
          call?.on("stream", (userVideoStream) => {
            if (peerVideoRef.current) {
              peerVideoRef.current.srcObject = userVideoStream;
            }
          });
        });

        // 7. When user disconnects, clear video
        socketRef.current.on("user-disconnected", () => {
          if (peerVideoRef.current) {
            peerVideoRef.current.srcObject = null;
          }
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
        alert("Camera/Microphone permission denied.");
      });

    return () => {
      // Cleanup on component unmount (End call)
      streamRef.current?.getTracks().forEach((track) => track.stop());
      socketRef.current?.disconnect();
      peerRef.current?.destroy();
    };
  }, [roomId, user]);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    navigate("/dashboard/entrepreneur"); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Video */}
        <div className="relative bg-black rounded-lg overflow-hidden border-2 border-gray-700 aspect-video">
          <video
            ref={myVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
            You
          </div>
        </div>

        {/* Peer Video */}
        <div className="relative bg-black rounded-lg overflow-hidden border-2 border-gray-700 aspect-video flex items-center justify-center">
          <video
            ref={peerVideoRef}
            autoPlay
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          {!peerVideoRef.current?.srcObject && (
            <div className="absolute text-gray-400">
              Waiting for others to join...
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div className="mt-8 flex gap-4 bg-gray-800 p-4 rounded-full">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"} text-white transition`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"} text-white transition`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
