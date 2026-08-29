import { useState } from "react";
import AppLayout from "./layouts/AppLayout";
import UploadPage from "./pages/UploadPage";
import LoadingScreen from "./components/LoadingScreen";
import MappingPage from "./pages/MappingPage";

import type { AssessmentResult } from "./types/assessment";

import "./App.css";

export type AppScreenState =
  | "upload"
  | "loading"
  | "mapping";

function App() {
  const [screenState, setScreenState] =
    useState<AppScreenState>("upload");

  const [assessmentData, setAssessmentData] =
    useState<AssessmentResult | null>(null);

  const handleStartProcessing = async (
    qpFile: File,
    ansFile: File
  ) => {
    setScreenState("loading");

    const formData = new FormData();

    formData.append(
      "question_paper",
      qpFile
    );

    formData.append(
      "answer_sheet",
      ansFile
    );

    try {
      const API_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(
        `${API_URL}/api/process`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned status: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "Backend Assessment Result:",
        data
      );

      setAssessmentData({
        summary: data.summary,
        questions: data.questions,
        answer_sheet_images:
          data.answer_sheet_images,
      });

      setScreenState("mapping");

    } catch (error) {

      console.error(
        "Extraction error:",
        error
      );

      alert(
        "Failed to process documents. Please check the browser console and Network tab."
      );

      setScreenState("upload");
    }
  };

  return (
    <AppLayout>

      {screenState === "upload" && (
        <UploadPage
          onStartProcessing={
            handleStartProcessing
          }
        />
      )}

      {screenState === "loading" && (
        <LoadingScreen />
      )}

      {screenState === "mapping" &&
        assessmentData && (

          <MappingPage
            data={assessmentData}
            onReset={() =>
              setScreenState("upload")
            }
          />

        )}

    </AppLayout>
  );
}

export default App;