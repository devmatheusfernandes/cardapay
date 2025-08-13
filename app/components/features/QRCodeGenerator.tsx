"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import ActionButton from "../shared/ActionButton";

interface QRCodeGeneratorProps {
  url: string;
}

const QRCodeGenerator = ({ url }: QRCodeGeneratorProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        const pngUrl = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "menu-qr-code.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  return (
    <div className="w-full bg-emerald-50 p-6 px-10 rounded-lg shadow-md">
      <div className="flex flex-col items-center gap-4">
        <div
          ref={qrRef}
          className="p-4 bg-white border border-slate-200 rounded-lg inline-block"
        >
          <QRCodeCanvas
            value={url}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#1e293b"} // slate-800
            level={"H"}
            includeMargin={false}
          />
        </div>
        <ActionButton
          label="Download PNG"
          icon={<Download />}
          onClick={handleDownload}
          variant="primary"
          size="md"
        />
      </div>
    </div>
  );
};

export default QRCodeGenerator;
