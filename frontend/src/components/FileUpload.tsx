import { useState } from "react";
import type { DragEvent, ReactNode } from "react";

interface FileUploadProps {
    onFileDrop: (file: File) => void;
    children: ReactNode;
    accept?: string;
}

function FileUpload({ onFileDrop, children, accept = ".pdf" }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (accept.includes(".pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
                alert("Please upload a PDF file.");
                return;
            }
            onFileDrop(file);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                width: "100%",
                borderRadius: "15px",
                outline: isDragging ? "2px dashed #ff7043" : "none",
            }}
        >
            {children}
        </div>
    );
}

export default FileUpload;