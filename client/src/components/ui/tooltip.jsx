import React from 'react';

export function Tooltip({ content, side = 'bottom', children }) {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className={`pointer-events-none absolute ${pos} whitespace-nowrap rounded-md bg-gray-900/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50`}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
