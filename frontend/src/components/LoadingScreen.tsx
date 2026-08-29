import { Sparkles } from "lucide-react";
import "./LoadingScreen.css";

function LoadingScreen() {
    return (
        <div className="loading-screen-container">
            <div className="loading-sparkle-icon">
                <Sparkles size={48} className="sparkle-svg" />
            </div>
            <h2>Extracting...</h2>
            <p>This may take a while</p>
        </div>
    );
}

export default LoadingScreen;