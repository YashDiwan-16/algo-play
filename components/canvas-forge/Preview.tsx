"use client";

type PreviewProps = {
  srcDoc: string;
};

export function Preview({ srcDoc }: PreviewProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden bg-white">
        <iframe
          className="h-full w-full border-0"
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          title="Live Preview"
        />
      </div>
    </div>
  );
}
