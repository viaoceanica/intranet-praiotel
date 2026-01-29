import { useState, useCallback, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, Views, type Event, type View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";

const locales = {
  "pt": pt,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Calendar = withDragAndDrop(BigCalendar);

interface TaskEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    priority: string;
    status: string;
    type: string;
    assignedToName: string;
  };
}

export function TaskCalendar() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  const utils = trpc.useUtils();
  
  // Queries
  const { data: tasks = [] } = trpc.crmTasks.list.useQuery({});
  const updateMutation = trpc.crmTasks.update.useMutation({
    onSuccess: () => {
      utils.crmTasks.list.invalidate();
      toast.success("Tarefa reagendada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao reagendar tarefa: ${error.message}`);
    },
  });
  
  // Convert tasks to calendar events
  const events: TaskEvent[] = useMemo(() => {
    return tasks.map((task: any) => {
      const dueDate = new Date(task.task.dueDate);
      return {
        id: task.task.id,
        title: task.task.title,
        start: dueDate,
        end: dueDate,
        resource: {
          priority: task.task.priority,
          status: task.task.status,
          type: task.task.type,
          assignedToName: task.assignedTo?.name || "Sem atribuição",
        },
      };
    });
  }, [tasks]);
  
  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(
    ({ event, start }: any) => {
      const newDate = typeof start === 'string' ? new Date(start) : start;
      updateMutation.mutate({
        id: event.id,
        dueDate: newDate.toISOString(),
      });
    },
    [updateMutation]
  );
  
  // Custom event style
  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#3b82f6"; // blue
    
    // Priority colors
    if (event.resource.priority === "urgente") {
      backgroundColor = "#dc2626"; // red
    } else if (event.resource.priority === "alta") {
      backgroundColor = "#f97316"; // orange
    } else if (event.resource.priority === "media") {
      backgroundColor = "#eab308"; // yellow
    } else if (event.resource.priority === "baixa") {
      backgroundColor = "#22c55e"; // green
    }
    
    // Dim completed tasks
    if (event.resource.status === "concluida") {
      backgroundColor = "#9ca3af"; // gray
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };
  
  // Custom event component
  const EventComponent = ({ event }: any) => {
    const getPriorityIcon = (priority: string) => {
      switch (priority) {
        case "urgente": return "🔴";
        case "alta": return "🟠";
        case "media": return "🟡";
        case "baixa": return "🟢";
        default: return "";
      }
    };
    
    return (
      <div className="text-xs">
        <div className="font-semibold truncate">
          {getPriorityIcon(event.resource.priority)} {event.title}
        </div>
        <div className="text-[10px] opacity-90 truncate">
          {event.resource.assignedToName}
        </div>
      </div>
    );
  };
  
  const messages = {
    allDay: "Dia inteiro",
    previous: "Anterior",
    next: "Próximo",
    today: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Agenda",
    date: "Data",
    time: "Hora",
    event: "Tarefa",
    noEventsInRange: "Não há tarefas neste período.",
    showMore: (total: number) => `+ ${total} mais`,
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendário de Tarefas
        </CardTitle>
        <div className="flex gap-2 mt-4 flex-wrap">
          <Badge variant="outline" className="bg-red-600 text-white border-red-600">🔴 Urgente</Badge>
          <Badge variant="outline" className="bg-orange-600 text-white border-orange-600">🟠 Alta</Badge>
          <Badge variant="outline" className="bg-yellow-600 text-white border-yellow-600">🟡 Média</Badge>
          <Badge variant="outline" className="bg-green-600 text-white border-green-600">🟢 Baixa</Badge>
          <Badge variant="outline" className="bg-gray-600 text-white border-gray-600">Concluída</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor={(event: any) => event.start}
            endAccessor={(event: any) => event.end}
            style={{ height: "100%" }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={messages}
            culture="pt"
            onEventDrop={handleEventDrop}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent,
            }}
            resizable={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
