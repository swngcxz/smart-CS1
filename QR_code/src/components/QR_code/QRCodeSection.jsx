import { QRCodeCanvas } from "qrcode.react";

const QRCodeSection = () => {
  return (
    <div className="my-8 p-4 bg-white rounded-2xl shadow-md flex flex-col items-center">
      <h2 className="text-lg font-semibold text-center mb-3">
        Scan to Visit Home Page
      </h2>
      <QRCodeCanvas
        value={`${typeof window !== "undefined" ? window.location.origin : ""}/`}
        size={180}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
    </div>
  );
};

export default QRCodeSection;
