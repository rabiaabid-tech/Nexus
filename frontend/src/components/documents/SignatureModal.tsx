import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X } from "lucide-react";
import { Button } from "../ui/Button";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  onSuccess: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  documentId,
  onSuccess,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }

    setIsSaving(true);
    console.log("[FRONTEND] 1. Starting signature save process...");

    try {
      console.log("[FRONTEND] 2. Extracting base64 image from canvas...");
      const canvasElement = sigCanvas.current.getCanvas();
      const signatureData = canvasElement.toDataURL("image/png");
      console.log(
        `[FRONTEND] 3. Image extracted! Data length: ${signatureData.length} characters`,
      );

      const token = localStorage.getItem("business_nexus_token");
      console.log(
        `[FRONTEND] 4. Sending request to backend for Document ID: ${documentId}...`,
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/documents/${documentId}/sign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ signatureData }),
        },
      );

      console.log(
        "[FRONTEND] 5. Backend responded with status:",
        response.status,
      );

      if (response.ok) {
        alert("Document digitally signed successfully!");
        onSuccess(); // Refresh the list
        onClose();
      } else {
        const data = await response.json();
        alert(`Backend Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(
        `The real error is: ${error.message || "Unknown error occurred"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            E-Signature Required
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-2">
            Please draw your official signature below:
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-md bg-gray-50 cursor-crosshair">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "w-full h-48 rounded-md",
              }}
            />
          </div>

          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear Pad
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Processing..." : "Sign Document"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
