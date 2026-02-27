'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  email: string;
}

export function EmailCopyButton({ email }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <a href={`mailto:${email}`} className="text-sm text-primary hover:underline">
        {email}
      </a>
      <button
        onClick={handleCopy}
        aria-label="Copy email"
        className="relative flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-sm">
            הועתק!
          </span>
        )}
      </button>
    </div>
  );
}
