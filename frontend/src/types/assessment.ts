export interface BoundingBox {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
}

export type QuestionStatus =
    | "correct"
    | "partially_correct"
    | "incorrect"
    | "unanswered";

export interface QuestionData {
    id: string;
    question_number: string;
    question_text: string;

    max_marks: number;
    marks_awarded: number;

    status: QuestionStatus;
    is_answered: boolean;

    feedback: string;

    page_number: number;
    bounding_box: BoundingBox | null;
}

export interface AssessmentSummary {
    total_marks_obtained: number;
    total_max_marks: number;
    overall_percentage: number;

    total_questions: number;
    attempted_count: number;
    correct_count: number;

    strengths: string;
    areas_for_improvement: string;
    overall_feedback: string;
}

export interface AssessmentResult {
    summary: AssessmentSummary;
    questions: QuestionData[];
    answer_sheet_images: string[];
}