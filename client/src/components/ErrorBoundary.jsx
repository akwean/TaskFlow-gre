import { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch() {
        // Optional: send to monitoring
        // console.error('ErrorBoundary caught an error');
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="max-w-md text-center p-6 bg-white rounded shadow">
                        <h2 className="text-lg font-semibold mb-2">
                            Something went wrong.
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Please try refreshing, or go back to the dashboard.
                        </p>
                        <a href="/" className="text-blue-600 underline">
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
