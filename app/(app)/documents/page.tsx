import { Topbar } from "@/components/layout/topbar";
import { DriveBrowser } from "@/components/drive/drive-browser";
import { HardDrive } from "lucide-react";

export const metadata = { title: "Documentos · Drive" };

export default function DocumentsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Topbar
        title="Documentos"
        subtitle="Google Drive · en tiempo real"
      />
      <div className="p-4 md:p-6 animate-fade-in">
        <DriveBrowser />
      </div>
    </div>
  );
}
