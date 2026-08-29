import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Upload, FileText, X } from "lucide-react";
import "./UploadCard.css";

interface UploadCardProps {
    title: string;
    accent?: boolean;
    selectedFile?: File | null;
    onFileSelect?: (file: File) => void;
    onFileRemove?: () => void;
}

function UploadCard({
    title,
    accent = false,
    selectedFile = null,
    onFileSelect,
    onFileRemove,
}: UploadCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!selectedFile && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                onFileSelect?.(file);
            } else {
                alert("Please upload a PDF file only.");
            }
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    if (selectedFile) {
        return (
            <div className="upload-card upload-card-filled">
                <div className="file-preview-card">
                    <div className="pdf-tag">PDF</div>
                    <div className="file-details">
                        <span className="file-name" title={selectedFile.name}>
                            {selectedFile.name}
                        </span>
                        <span className="file-meta">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <button
                        type="button"
                        className="file-remove-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFileRemove?.();
                            if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-card" onClick={handleClick}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                style={{ display: "none" }}
            />
            <div className="upload-icon">
                <FileText size={20} />
            </div>
            <div className="upload-title">
                Upload <span className={accent ? "accent-text" : ""}>{title}</span>
            </div>
            <div className="upload-action">
                <Upload size={14} />
                <span>Click to upload</span>
            </div>
            <div className="upload-limit">PDF only • Max 10MB</div>
        </div>
    );
}

export default UploadCard;