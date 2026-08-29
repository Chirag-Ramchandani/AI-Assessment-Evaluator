import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import UploadCard from "../components/UploadCard";
import "./UploadPage.css";

interface UploadPageProps {
    onStartProcessing?: (qpFile: File, ansFile: File) => void;
}

function UploadPage({ onStartProcessing }: UploadPageProps) {
    const [qpFile, setQpFile] = useState<File | null>(null);
    const [ansFile, setAnsFile] = useState<File | null>(null);

    const isReady = qpFile !== null && ansFile !== null;

    const handleStart = () => {
        if (isReady && onStartProcessing) {
            onStartProcessing(qpFile, ansFile);
        }
    };

    return (
        <div className="upload-page">
            <div className="upload-header">
                <div className="ai-badge">
                    <Sparkles size={13} />
                    <span>AI Assessment Evaluator</span>
                </div>
                <h1>
                    Upload Question Paper <span>& Answer Sheets</span>
                </h1>
                <p>Upload both files to get started</p>
            </div>

            <div className="upload-illustration">
                <div className="illustration-ring">
                    <div className="illustration-circle">👩🏻‍🏫</div>
                </div>
            </div>

            <div className="upload-container">
                <UploadCard
                    title="Question Paper"
                    accent={true}
                    selectedFile={qpFile}
                    onFileSelect={(file) => setQpFile(file)}
                    onFileRemove={() => setQpFile(null)}
                />
                <UploadCard
                    title="Answer Sheet"
                    accent={true}
                    selectedFile={ansFile}
                    onFileSelect={(file) => setAnsFile(file)}
                    onFileRemove={() => setAnsFile(null)}
                />
            </div>

            <button
                type="button"
                className="start-mapping-button"
                disabled={!isReady}
                onClick={handleStart}
            >
                <span>Start Mapping</span>
                <ArrowRight size={15} />
            </button>

            <p className="mapping-help">
                {isReady
                    ? "Click 'Start Mapping' to analyze documents."
                    : "Upload both files to start mapping answers with questions."}
            </p>
        </div>
    );
}

export default UploadPage;