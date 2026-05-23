"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyReportLinkButtonProps = {
  reportUrl: string;
};

export function CopyReportLinkButton({ reportUrl }: CopyReportLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(reportUrl);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#70695f] bg-[#302f2c] px-4 text-sm font-semibold text-white hover:bg-[#3a3935]"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copy link
        </>
      )}
    </button>
  );
}
