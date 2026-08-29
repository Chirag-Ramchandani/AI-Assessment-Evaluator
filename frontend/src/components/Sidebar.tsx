import {
    Home,
    GraduationCap,
    ClipboardList,
    BookOpen,
    FileText,
    Settings,
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import "./Sidebar.css";

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    return (
        <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
            {/* Top Header / Logo */}
            <div className="sidebar-top">
                <div className="sidebar-logo">
                    <div className="logo-box">V</div>
                    {!collapsed && <span>VedaAI</span>}
                </div>
                {onToggle && (
                    <button className="collapse-toggle" onClick={onToggle}>
                        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                )}
            </div>

            {/* AI Teacher's Toolkit */}
            <button className={`toolkit-button ${collapsed ? "toolkit-mini" : ""}`} title="AI Teacher's Toolkit">
                <Sparkles size={16} />
                {!collapsed && <span>AI Teacher's Toolkit</span>}
            </button>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-item" title="Home">
                    <Home size={17} />
                    {!collapsed && <span>Home</span>}
                </div>

                <div className="nav-item" title="My Classroom">
                    <GraduationCap size={17} />
                    {!collapsed && <span>My Classroom</span>}
                </div>

                <div className="nav-item" title="Assignments">
                    <ClipboardList size={17} />
                    {!collapsed && <span>Assignments</span>}
                </div>

                <div className="nav-item active" title="Exams">
                    <FileText size={17} />
                    {!collapsed && <span>Exams</span>}
                </div>

                <div className="nav-item" title="My Library">
                    <BookOpen size={17} />
                    {!collapsed && <span>My Library</span>}
                </div>
            </nav>

            {/* Bottom section */}
            <div className="sidebar-bottom">
                <div className="nav-item" title="Settings">
                    <Settings size={17} />
                    {!collapsed && <span>Settings</span>}
                </div>

                {!collapsed && (
                    <div className="school-card">
                        <div className="school-logo">🏫</div>
                        <div>
                            <strong>Delhi Public School</strong>
                            <small>Bokaro Steel City</small>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;