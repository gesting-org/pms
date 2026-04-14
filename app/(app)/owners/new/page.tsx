import { Topbar } from "@/components/layout/topbar";
import { OwnerForm } from "../components/owner-form";

export const metadata = { title: "Nuevo propietario" };

export default function NewOwnerPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Topbar title="Nuevo propietario" />
      <div className="p-4 md:p-6 max-w-2xl animate-fade-in">
        <OwnerForm />
      </div>
    </div>
  );
}
