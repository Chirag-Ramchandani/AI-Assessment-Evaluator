import {
    useState,
    useRef,
    useEffect,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Award,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";

import type {
    AssessmentResult,
    BoundingBox,
} from "../types/assessment";

import "./MappingPage.css";

interface MappingPageProps {
    data: AssessmentResult;
    onReset: () => void;
}

function MappingPage({
    data,
    onReset,
}: MappingPageProps) {

    /*
     * ---------------------------------------------------------
     * FIRST QUESTION
     * ---------------------------------------------------------
     */

    const firstQuestionId =
        data.questions[0]?.id || "";


    /*
     * ---------------------------------------------------------
     * SELECTED QUESTION
     * ---------------------------------------------------------
     */

    const [
        selectedQuestionId,
        setSelectedQuestionId,
    ] = useState<string>(firstQuestionId);


    /*
     * ---------------------------------------------------------
     * EXPANDED QUESTION
     * ---------------------------------------------------------
     */

    const [
        expandedId,
        setExpandedId,
    ] = useState<string | null>(
        firstQuestionId
    );


    /*
     * ---------------------------------------------------------
     * SELECTED QUESTION OBJECT
     * ---------------------------------------------------------
     */

    const selectedQuestion =
        data.questions.find(
            (q) =>
                q.id === selectedQuestionId
        );


    /*
     * ---------------------------------------------------------
     * PAGE REFERENCES
     * ---------------------------------------------------------
     *
     * Used to keep references to every answer-sheet page.
     *
     */

    const pageRefs =
        useRef<{
            [key: number]:
            HTMLDivElement | null;
        }>({});


    /*
     * ---------------------------------------------------------
     * BOUNDING BOX REFERENCE
     * ---------------------------------------------------------
     *
     * This points directly to the currently rendered
     * green bounding box.
     *
     * IMPORTANT:
     *
     * We use the actual DOM position of the green box
     * instead of manually calculating its position from
     * Gemini coordinates.
     *
     */

    const boundingBoxRef =
        useRef<HTMLDivElement | null>(null);


    /*
     * ---------------------------------------------------------
     * ANSWER SHEET SCROLL CONTAINER
     * ---------------------------------------------------------
     */

    const containerRef =
        useRef<HTMLDivElement | null>(null);


    /*
     * ---------------------------------------------------------
     * AUTO SCROLL TO SELECTED ANSWER
     * ---------------------------------------------------------
     *
     * When user selects a question:
     *
     * 1. React renders the selected green box.
     * 2. boundingBoxRef points to that box.
     * 3. We get its real browser position.
     * 4. We calculate its center.
     * 5. We scroll only the answer-sheet container.
     * 6. The selected answer becomes vertically centered.
     *
     */

    useEffect(() => {

        /*
         * No selected question
         */

        if (!selectedQuestion) {
            return;
        }


        /*
         * Unanswered questions don't have
         * a meaningful answer location.
         */

        if (
            !selectedQuestion.is_answered ||
            !selectedQuestion.bounding_box
        ) {
            return;
        }


        /*
         * Wait until React has rendered
         * the bounding box.
         *
         * Two animation frames make this
         * more reliable when image dimensions
         * are still settling.
         */

        let secondFrame:
            number | null = null;

        const firstFrame =
            requestAnimationFrame(() => {

                secondFrame =
                    requestAnimationFrame(() => {

                        const container =
                            containerRef.current;

                        const boundingBox =
                            boundingBoxRef.current;


                        /*
                         * Safety check
                         */

                        if (
                            !container ||
                            !boundingBox
                        ) {
                            return;
                        }


                        /*
                         * -------------------------------------------------
                         * GET REAL DOM POSITIONS
                         * -------------------------------------------------
                         */

                        const containerRect =
                            container.getBoundingClientRect();

                        const boxRect =
                            boundingBox.getBoundingClientRect();


                        /*
                         * -------------------------------------------------
                         * FIND CENTER OF GREEN BOX
                         * -------------------------------------------------
                         */

                        const boxCenter =
                            boxRect.top +
                            (boxRect.height / 2);


                        /*
                         * -------------------------------------------------
                         * FIND CENTER OF VIEWPORT
                         * -------------------------------------------------
                         */

                        const containerCenter =
                            containerRect.top +
                            (container.clientHeight / 2);


                        /*
                         * -------------------------------------------------
                         * HOW FAR WE NEED TO SCROLL
                         * -------------------------------------------------
                         *
                         * If positive:
                         *   answer is below center
                         *
                         * If negative:
                         *   answer is above center
                         *
                         */

                        const scrollDifference =
                            boxCenter -
                            containerCenter;


                        /*
                         * -------------------------------------------------
                         * NEW SCROLL POSITION
                         * -------------------------------------------------
                         *
                         * Current scroll position +
                         * difference between answer center
                         * and viewport center.
                         *
                         */

                        const targetScrollTop =
                            container.scrollTop +
                            scrollDifference;


                        /*
                         * -------------------------------------------------
                         * SCROLL ONLY ANSWER SHEET
                         * -------------------------------------------------
                         */

                        container.scrollTo({
                            top: Math.max(
                                0,
                                targetScrollTop
                            ),
                            behavior: "smooth",
                        });

                    });

            });


        /*
         * ---------------------------------------------------------
         * CLEANUP
         * ---------------------------------------------------------
         */

        return () => {

            cancelAnimationFrame(
                firstFrame
            );

            if (
                secondFrame !== null
            ) {

                cancelAnimationFrame(
                    secondFrame
                );

            }

        };

    }, [
        selectedQuestionId,
        selectedQuestion,
    ]);


    /*
     * ---------------------------------------------------------
     * QUESTION SELECTION
     * ---------------------------------------------------------
     */

    const handleSelectQuestion = (
        id: string
    ) => {

        setSelectedQuestionId(id);

        setExpandedId(id);
    };


    /*
     * ---------------------------------------------------------
     * EXPAND / COLLAPSE
     * ---------------------------------------------------------
     */

    const toggleExpand = (
        id: string
    ) => {

        setExpandedId(
            (previous) =>
                previous === id
                    ? null
                    : id
        );
    };


    /*
     * ---------------------------------------------------------
     * QUESTION NUMBER
     * ---------------------------------------------------------
     */

    const formatQuestionNumber = (
        rawNum: string | number
    ) => {

        const cleaned =
            String(rawNum)
                .replace(/^Q\s*/i, "");

        return `Q${cleaned}`;
    };


    /*
     * ---------------------------------------------------------
     * STATUS BADGE
     * ---------------------------------------------------------
     */

    const renderStatusBadge = (
        status?: string,
        isAnswered?: boolean
    ) => {

        /*
         * Unanswered
         */

        if (
            !isAnswered ||
            status === "unanswered"
        ) {

            return (
                <span className="status-pill unanswered">

                    <HelpCircle size={12} />

                    Unanswered

                </span>
            );
        }


        /*
         * Answered status
         */

        switch (status) {

            case "correct":

                return (
                    <span className="status-pill correct">

                        <CheckCircle2 size={12} />

                        Correct

                    </span>
                );


            case "partially_correct":

                return (
                    <span className="status-pill partial">

                        <AlertCircle size={12} />

                        Partial

                    </span>
                );


            case "incorrect":

                return (
                    <span className="status-pill incorrect">

                        <XCircle size={12} />

                        Incorrect

                    </span>
                );


            default:

                return (
                    <span className="status-pill correct">

                        <CheckCircle2 size={12} />

                        Answered

                    </span>
                );
        }
    };


    /*
     * ---------------------------------------------------------
     * EXPAND GEMINI BOUNDING BOX
     * ---------------------------------------------------------
     *
     * Gemini coordinates are generally in a 0-1000
     * coordinate system.
     *
     * We only add a SMALL padding.
     *
     * If the original Gemini bounding box itself covers
     * multiple answers, this padding will NOT fix that.
     * In that case the backend bounding_box needs correction.
     *
     */

    const getExpandedBoundingBox = (
        box: BoundingBox
    ): BoundingBox => {

        const verticalPadding = 8;

        const horizontalPadding = 8;

        return {

            ymin: Math.max(
                0,
                box.ymin -
                verticalPadding
            ),

            xmin: Math.max(
                0,
                box.xmin -
                horizontalPadding
            ),

            ymax: Math.min(
                1000,
                box.ymax +
                verticalPadding
            ),

            xmax: Math.min(
                1000,
                box.xmax +
                horizontalPadding
            ),
        };
    };


    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (

        <div className="mapping-page">


            {/* =====================================================
                TOP HEADER
            ====================================================== */}

            <div className="mapping-top-bar">

                <button
                    className="back-btn"
                    onClick={onReset}
                    type="button"
                >

                    <ArrowLeft size={16} />

                    <span>
                        Back to Upload
                    </span>

                </button>


                <span className="screen-title">

                    Assessment Evaluation & Answer Grounding

                </span>

            </div>


            {/* =====================================================
                SUMMARY
            ====================================================== */}

            {data.summary && (

                <div className="grading-summary-banner">


                    {/* SUMMARY STATS */}

                    <div className="summary-stat-group">


                        {/* TOTAL SCORE */}

                        <div className="summary-stat-box score">

                            <span className="stat-label">
                                Total Score
                            </span>


                            <span className="stat-value">

                                {
                                    data.summary
                                        .total_marks_obtained
                                }

                                {" / "}

                                {
                                    data.summary
                                        .total_max_marks
                                }

                            </span>


                            <span className="stat-sub">

                                {
                                    data.summary
                                        .overall_percentage
                                }%

                            </span>

                        </div>


                        {/* ACCURACY */}

                        <div className="summary-stat-box">

                            <span className="stat-label">
                                Accuracy
                            </span>


                            <span className="stat-value">

                                {
                                    data.summary
                                        .correct_count
                                }

                                {" / "}

                                {
                                    data.summary
                                        .total_questions
                                }

                            </span>


                            <span className="stat-sub">
                                Correct Answers
                            </span>

                        </div>

                    </div>


                    {/* SUMMARY INSIGHTS */}

                    <div className="summary-insights-box">


                        {/* EVALUATION */}

                        <div className="insight-row">

                            <Award
                                size={14}
                                className="insight-icon"
                            />

                            <strong>
                                Evaluation:
                            </strong>

                            <span>

                                {
                                    data.summary
                                        .overall_feedback
                                }

                            </span>

                        </div>


                        {/* STRENGTHS */}

                        {data.summary.strengths && (

                            <div className="insight-row strengths">

                                <TrendingUp
                                    size={14}
                                    className="insight-icon green"
                                />

                                <strong>
                                    Strengths:
                                </strong>

                                <span>

                                    {
                                        data.summary
                                            .strengths
                                    }

                                </span>

                            </div>

                        )}


                        {/* IMPROVEMENT */}

                        {data.summary
                            .areas_for_improvement && (

                                <div className="insight-row improvements">

                                    <AlertTriangle
                                        size={14}
                                        className="insight-icon orange"
                                    />

                                    <strong>
                                        Improvement:
                                    </strong>

                                    <span>

                                        {
                                            data.summary
                                                .areas_for_improvement
                                        }

                                    </span>

                                </div>

                            )}

                    </div>

                </div>

            )}


            {/* =====================================================
                MAIN SPLIT VIEW
            ====================================================== */}

            <div className="mapping-split-container">


                {/* =================================================
                    LEFT — QUESTIONS
                ================================================== */}

                <div className="questions-pane">


                    <div className="pane-header">

                        <h3>
                            Extracted Questions
                        </h3>


                        <span className="count-badge">

                            {data.questions.length}

                            {" items"}

                        </span>

                    </div>


                    <div className="questions-scroll">

                        {data.questions.map(
                            (q) => {

                                const isSelected =
                                    q.id ===
                                    selectedQuestionId;


                                const isExpanded =
                                    expandedId ===
                                    q.id;


                                return (

                                    <div
                                        key={q.id}
                                        className={`
                                            question-card
                                            ${isSelected
                                                ? "selected"
                                                : ""
                                            }
                                            ${!q.is_answered
                                                ? "unanswered"
                                                : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleSelectQuestion(
                                                q.id
                                            )
                                        }
                                    >


                                        {/* QUESTION TOP */}

                                        <div className="question-card-top">


                                            {/* QUESTION NUMBER */}

                                            <div className="q-badge">

                                                {
                                                    formatQuestionNumber(
                                                        q.question_number
                                                    )
                                                }

                                            </div>


                                            {/* QUESTION TEXT */}

                                            <div className="q-text-snippet">

                                                <p>

                                                    {
                                                        q.question_text
                                                    }

                                                </p>

                                            </div>


                                            {/* SCORE */}

                                            <div className="score-badge">

                                                {
                                                    q.marks_awarded
                                                }

                                                /

                                                {
                                                    q.max_marks
                                                }

                                            </div>


                                            {/* EXPAND */}

                                            <button
                                                className="expand-btn"
                                                type="button"
                                                onClick={(event) => {

                                                    event.stopPropagation();

                                                    toggleExpand(
                                                        q.id
                                                    );

                                                }}
                                            >

                                                {isExpanded ? (

                                                    <ChevronUp
                                                        size={15}
                                                    />

                                                ) : (

                                                    <ChevronDown
                                                        size={15}
                                                    />

                                                )}

                                            </button>

                                        </div>


                                        {/* STATUS */}

                                        <div className="card-status-row">

                                            {renderStatusBadge(
                                                q.status,
                                                q.is_answered
                                            )}

                                        </div>


                                        {/* DETAILS */}

                                        {isExpanded && (

                                            <div className="question-card-details">


                                                {/* AI FEEDBACK */}

                                                <div className="feedback-section">

                                                    <strong>
                                                        AI Feedback:
                                                    </strong>


                                                    <p>

                                                        {
                                                            q.feedback
                                                        }

                                                    </p>

                                                </div>


                                                {/* MAPPING STATUS */}

                                                <div className="status-indicator">

                                                    {q.is_answered ? (

                                                        <span className="tag-answered">

                                                            <CheckCircle2
                                                                size={13}
                                                            />

                                                            Mapped on Page{" "}

                                                            {
                                                                q.page_number
                                                            }

                                                        </span>

                                                    ) : (

                                                        <span className="tag-unanswered">

                                                            <AlertCircle
                                                                size={13}
                                                            />

                                                            Not Answered

                                                        </span>

                                                    )}

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                );

                            }

                        )}

                    </div>

                </div>


                {/* =================================================
                    RIGHT — ANSWER SHEET
                ================================================== */}

                <div className="answer-sheet-pane">


                    <div className="pane-header">

                        <h3>
                            Student Answer Sheet
                        </h3>


                        <span className="count-badge">

                            {
                                data
                                    .answer_sheet_images
                                    .length
                            }

                            {" Pages"}

                        </span>

                    </div>


                    {/* =================================================
                        ANSWER SHEET SCROLL CONTAINER
                    ================================================== */}

                    <div
                        className="sheet-scroll-container"
                        ref={containerRef}
                    >


                        {data.answer_sheet_images.map(
                            (
                                b64Img,
                                index
                            ) => {

                                const pageNum =
                                    index + 1;


                                /*
                                 * Is selected question
                                 * located on this page?
                                 */

                                const isTargetPage =
                                    selectedQuestion
                                        ?.page_number ===
                                    pageNum;


                                /*
                                 * Original Gemini box
                                 */

                                const originalBox =
                                    selectedQuestion
                                        ?.bounding_box;


                                /*
                                 * Only highlight when:
                                 *
                                 * - selected question is on
                                 *   current page
                                 * - question is answered
                                 * - bounding box exists
                                 */

                                const shouldHighlight =
                                    isTargetPage &&
                                    selectedQuestion
                                        ?.is_answered &&
                                    !!originalBox;


                                /*
                                 * Expanded box
                                 */

                                const box =
                                    originalBox
                                        ? getExpandedBoundingBox(
                                            originalBox
                                        )
                                        : null;


                                return (

                                    <div
                                        key={pageNum}
                                        className="page-wrapper"
                                        ref={(element) => {

                                            pageRefs.current[
                                                pageNum
                                            ] = element;

                                        }}
                                    >


                                        {/* PAGE LABEL */}

                                        <div className="page-header-tag">

                                            Page {pageNum}

                                        </div>


                                        {/* PAGE IMAGE */}

                                        <div className="page-image-container">


                                            <img
                                                src={`data:image/jpeg;base64,${b64Img}`}
                                                alt={`Answer sheet page ${pageNum}`}
                                                className="answer-page-img"
                                            />


                                            {/* =================================================
                                                GREEN BOUNDING BOX
                                            ================================================== */}

                                            {shouldHighlight &&
                                                box && (

                                                    <div
                                                        ref={
                                                            boundingBoxRef
                                                        }
                                                        className="bounding-box-overlay"
                                                        style={{
                                                            top: `${box.ymin / 10}%`,

                                                            left: `${box.xmin / 10}%`,

                                                            height: `${(
                                                                box.ymax -
                                                                box.ymin
                                                            ) / 10}%`,

                                                            width: `${(
                                                                box.xmax -
                                                                box.xmin
                                                            ) / 10}%`,
                                                        }}
                                                    >


                                                        {/* BOX LABEL */}

                                                        <span className="box-label">

                                                            {
                                                                formatQuestionNumber(
                                                                    selectedQuestion.question_number
                                                                )
                                                            }

                                                        </span>

                                                    </div>

                                                )}

                                        </div>

                                    </div>

                                );

                            }

                        )}

                    </div>

                </div>

            </div>

        </div>

    );
}

export default MappingPage;