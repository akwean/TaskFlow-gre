import React from 'react';

export default function ActivityFeed({ items = [], open, onClose }) {
  return (
    <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l z-50 transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">Activity</h3>
        <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-52px)]">
        {items.length === 0 && <div className="text-sm text-gray-500">No recent activity</div>}
        {dedupeActivity(items).map((it, idx) => (
          <div key={idx} className="text-sm">
            <div className="font-medium">{it.title}</div>
            {it.user && (
              <div className="text-xs text-gray-500">
                {typeof it.user === 'string' ? it.user : (it.user.username || it.user.email || it.user.id)}
              </div>
            )}
            {it.detail && <div className="text-gray-600">{it.detail}</div>}
            <div className="text-xs text-gray-400">{new Date(it.at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Remove consecutive duplicate activity entries (same title, detail, and timestamp)
function dedupeActivity(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const result = [];
  let prev = null;
  for (const it of items) {
    if (
      prev &&
      it.title === prev.title &&
      it.detail === prev.detail &&
      it.at === prev.at
    ) {
      continue;
    }
    result.push(it);
    prev = it;
  }
  return result;
}
