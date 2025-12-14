import React, { useState, useEffect, useRef } from "react";

/**
 * MoveModal for lists: Only show position dropdown.
 * Props:
 * - positions: array of numbers or strings
 * - selectedPosition: value of the currently selected position
 * - onPositionChange: function (position) => void
 * - onMove: function () => void
 * - onClose: function () => void
 * - title: string (optional, defaults to "Move list")
 */
export default function MoveModal({
    positions = [],
    selectedPosition,
    currentPosition,
    onPositionChange,
    onMove,
    onClose,
    title = "Move list",
}) {
    const [isMobile, setIsMobile] = useState(false);
    const selectRef = useRef(null);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    // Focus the select on mobile to trigger native picker
    const handleSelectClick = () => {
        if (isMobile && selectRef.current) {
            selectRef.current.focus();
        }
    };

    return (
        <div className="move-modal-overlay">
            <div className="move-modal-content" role="dialog" aria-modal="true">
                <header className="move-modal-header">
                    <h2>{title}</h2>
                    <button
                        className="move-modal-close"
                        aria-label="Close"
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </header>
                <form
                    className="move-modal-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        onMove();
                    }}
                >
                    <div className="move-modal-group">
                        <label htmlFor="move-position">Position</label>
                        <div className="select-wrapper">
                            <select
                                id="move-position"
                                ref={selectRef}
                                value={selectedPosition}
                                onChange={(e) => {
                                    onPositionChange(Number(e.target.value));
                                }}
                                onClick={handleSelectClick}
                                className={isMobile ? "mobile-select" : ""}
                            >
                                {positions.map((pos) => (
                                    <option key={pos} value={pos}>
                                        {pos === currentPosition
                                            ? `${pos} (current)`
                                            : pos}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isMobile && (
                            <div className="mobile-hint">
                                Tap to open position selector
                            </div>
                        )}
                    </div>
                    <button type="submit" className="move-modal-btn">
                        Move
                    </button>
                </form>
            </div>
            <style>{`
        .move-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          box-sizing: border-box;
        }

        .move-modal-content {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.12);
          padding: 1.5rem;
          width: 100%;
          max-width: 300px;
          box-sizing: border-box;
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (max-width: 480px) {
          .move-modal-content {
            padding: 1.25rem;
            max-width: 90vw;
            margin: 0;
          }
          .move-modal-group select {
            max-width: 200px;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            display: inline-block;
            font-size: 1rem;
            padding: 0.5rem 0.75rem;
            line-height: 1.5;
          }
        }

        @media (max-width: 320px) {
          .move-modal-content {
            padding: 1rem;
            max-width: 95vw;
          }
        }

        .move-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .move-modal-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          color: #333;
        }

        .move-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          color: #666;
          transition: color 0.2s;
          padding: 0.25rem;
          margin: -0.25rem;
        }

        .move-modal-close:hover,
        .move-modal-close:focus {
          color: #222;
        }

        .move-modal-form .move-modal-group {
          margin-bottom: 1.5rem;
        }

        .move-modal-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #444;
          font-size: 0.9rem;
        }

        .select-wrapper {
          position: relative;
        }

        .move-modal-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          background: #fafbfc;
          transition: all 0.2s;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          padding-right: 2.5rem;
          cursor: pointer;
        }

        /* Mobile-specific select styling */
        .move-modal-group select.mobile-select {
          font-size: 1rem;
          padding: 1rem;
          min-height: 3rem;
        }

        .move-modal-group select:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        /* Compact select dropdown options */
        .move-modal-group select option {
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          min-height: 1.5rem;
          line-height: 1.5;
        }

        /* Mobile hint text */
        .mobile-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.5rem;
          text-align: center;
          font-style: italic;
        }

        /* Hide hint on desktop */
        @media (min-width: 769px) {
          .mobile-hint {
            display: none;
          }
        }

        /* iOS-specific fixes */
        @supports (-webkit-touch-callout: none) {
          .move-modal-group select {
            font-size: 1rem;
          }
        }

        .move-modal-btn {
          width: 100%;
          padding: 0.75rem;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        @media (max-width: 480px) {
          .move-modal-btn {
            padding: 1rem;
            font-size: 1rem;
          }
        }

        .move-modal-btn:hover,
        .move-modal-btn:focus {
          background: #4f46e5;
        }

        /* Prevent body scroll */
        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }
      `}</style>
        </div>
    );
}
