"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY_EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { SerializedCompanyExpense } from "@/lib/db/finanzas-serialize";

interface CompanyExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (expense: SerializedCompanyExpense) => void;
  editing?: SerializedCompanyExpense | null;
}

export function CompanyExpenseForm({ open, onClose, onSaved, editing }: CompanyExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState(editing?.category ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing?.amount ? String(editing.amount) : "");
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(editing?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!category || !description || !amount || !date) {
      setError("Completá todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      const url = editing
        ? `/api/finanzas/company-expenses/${editing.id}`
        : "/api/finanzas/company-expenses";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description, amount: parseFloat(amount), date, notes }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al guardar");
      } else {
        onSaved(json.data);
        onClose();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editing ? "Editar gasto empresa" : "Nuevo gasto empresa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Categoría *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccioná categoría" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COMPANY_EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Descripción *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Suscripción Notion mensual"
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Monto (ARS) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones opcionales..."
              className="resize-none text-sm"
              rows={2}
            />
          </div>
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando...</> : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
