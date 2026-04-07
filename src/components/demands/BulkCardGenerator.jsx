import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Loader2 } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const emptyCard = (dataPostagem, index) => {
  const jsDay = new Date(dataPostagem + "T12:00:00").getDay();
  const dia = DIAS_SEMANA[jsDay];
  
  return {
    id: crypto.randomUUID(),
    data_postagem: dataPostagem,
    dia_semana: dia,
    tipo_conteudo: "",
    canais: [],
    horario: "",
    tema: "",
    observacoes: "",
  };
};

export default function BulkCardGenerator({ open, onClose, onGenerate }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("daily"); // daily, weekdays, 3x-week, 2x-week, weekly
  const [generating, setGenerating] = useState(false);

  const generateDates = () => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    let current = new Date(startDate + "T12:00:00");
    const end = new Date(endDate + "T12:00:00");

    while (current <= end) {
      const dayOfWeek = current.getDay();
      let shouldInclude = false;

      if (frequency === "daily") {
        shouldInclude = true;
      } else if (frequency === "weekdays") {
        shouldInclude = dayOfWeek !== 0 && dayOfWeek !== 6; // seg-sex
      } else if (frequency === "3x-week") {
        shouldInclude = [1, 3, 5].includes(dayOfWeek); // seg, qua, sex
      } else if (frequency === "2x-week") {
        shouldInclude = [2, 5].includes(dayOfWeek); // ter, sex
      } else if (frequency === "weekly") {
        shouldInclude = dayOfWeek === 1; // segunda
      }

      if (shouldInclude) {
        dates.push(format(current, "yyyy-MM-dd"));
      }

      current = addDays(current, 1);
    }

    return dates;
  };

  const handleGenerate = async () => {
    const dates = generateDates();
    if (dates.length === 0) {
      alert("Nenhuma data gerada. Verifique as datas e frequência.");
      return;
    }

    setGenerating(true);
    const newCards = dates.map((date) => emptyCard(date));
    
    // Pequeno delay para feedback visual
    setTimeout(() => {
      onGenerate(newCards);
      setGenerating(false);
      setStartDate("");
      setEndDate("");
      setFrequency("daily");
      onClose();
    }, 500);
  };

  const dates = generateDates();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Gerar Cards em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekdays">Dias Úteis (Seg-Sex)</SelectItem>
                <SelectItem value="3x-week">3x por Semana (Seg, Qua, Sex)</SelectItem>
                <SelectItem value="2x-week">2x por Semana (Ter, Sex)</SelectItem>
                <SelectItem value="weekly">Semanal (Segundas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {startDate && endDate && (
            <div className="bg-muted/40 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Serão criados <span className="text-foreground font-bold">{dates.length}</span> cards
              </p>
              <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                {dates.slice(0, 5).map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {format(new Date(d + "T12:00:00"), "dd/MMM - EEEE", { locale: ptBR })}
                  </div>
                ))}
                {dates.length > 5 && (
                  <p className="text-muted-foreground italic">
                    +{dates.length - 5} outras datas...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={!startDate || !endDate || generating}>
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando...</>
            ) : (
              <><Plus className="w-4 h-4 mr-1" /> Gerar {dates.length} Cards</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}