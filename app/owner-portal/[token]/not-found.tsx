import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">🏠</div>
      <h1 className="text-xl font-bold">Portal no encontrado</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        El enlace que utilizaste no corresponde a ningún propietario registrado en Gesting PMS.
      </p>
      <p className="text-xs text-muted-foreground">
        Si creés que es un error, contactá a tu administrador.
      </p>
    </div>
  );
}
