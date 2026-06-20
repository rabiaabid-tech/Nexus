import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  PenTool,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { SignatureModal } from "../../components/documents/SignatureModal";

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Real Documents from Database
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // 2. Handle File Upload via Multer
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Strict Security: Only PDF files are allowed!");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);
    formData.append("receiverId", String(user?.id));

    setIsUploading(true);
    try {
      const token = localStorage.getItem("business_nexus_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData, // Form data automatically sets multipart/form-data boundary
        },
      );

      if (response.ok) {
        alert("Document uploaded successfully!");
        fetchDocuments(); // List refresh karo
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Network error during file upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. View/Download Document
  const handleDownload = (fileUrl: string) => {
    // API URL se '/api' hata kar base URL banate hain taake public uploads folder access ho
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api", "");
    window.open(`${baseUrl}${fileUrl}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>

        {/* CRITICAL FIX: Upload Button ab asli file picker kholega */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="application/pdf"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            leftIcon={
              isUploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )
            }
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info (Kept static for UI appeal for now) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">1.2 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary-600 rounded-full"
                  style={{ width: "15%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">18.8 GB</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Quick Access
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Recent Files
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Shared with Me
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Real Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                All Documents
              </h2>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-primary-600" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-gray-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText size={24} className="text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.file_name}
                          </h3>
                          <Badge variant="secondary" size="sm">
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>PDF</span>
                          <span>
                            Uploaded{" "}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {doc.status !== "Signed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-primary-600 hover:text-primary-700"
                            aria-label="Sign Document"
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              setIsSignatureModalOpen(true);
                            }}
                          >
                            <PenTool size={18} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          aria-label="Download"
                          onClick={() => handleDownload(doc.file_url)}
                        >
                          <Download size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          aria-label="Delete"
                          onClick={() =>
                            alert("Delete API not implemented yet!")
                          }
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      {/* Signature Modal */}
      {selectedDocId && (
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          documentId={selectedDocId}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
};
