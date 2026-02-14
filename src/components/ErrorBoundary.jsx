import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="card" style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Something went wrong</div>
                    <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 16 }}>
                        {this.state.error?.message || "An unexpected error occurred."}
                    </div>
                    <button className="btn btn-v btn-sm" onClick={() => this.setState({ hasError: false, error: null })}>
                        🔄 Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
