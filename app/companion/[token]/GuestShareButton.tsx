'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

export function GuestShareButton({ meetingGuestId }: { meetingGuestId: string }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onShare() {
    setLoading(true);
    try {
      const r = await fetch('/api/companion/share-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingGuestId }),
      });
      const data = await r.json();
      if (data.ok) {
        const fullUrl = window.location.origin + data.url;
        setUrl(fullUrl);
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  if (url) {
    return (
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        }}
        className="w-full text-xs py-2 rounded-lg bg-stone-800 text-white flex items-center justify-center gap-1.5"
      >
        <Share2 size={13} />
        {copied ? '已复制嘉宾行程链接' : '点击复制嘉宾行程链接'}
      </button>
    );
  }

  return (
    <button
      onClick={onShare}
      disabled={loading}
      className="w-full text-xs py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 flex items-center justify-center gap-1.5 transition-colors"
    >
      <Share2 size={13} />
      {loading ? '生成中...' : '分享嘉宾行程给本人'}
    </button>
  );
}
