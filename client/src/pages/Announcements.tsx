import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle } from "lucide-react";

export function Announcements() {
  const { data: announcements = [] } = trpc.announcements.list.useQuery({});

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "bg-red-100 text-red-800";
      case "alta":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Anúncios Gerais</h1>
        </div>

        <div className="grid gap-4">
          {announcements.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhum anúncio publicado ainda
            </Card>
          ) : (
            announcements.map((announcement: any) => (
              <Card key={announcement.id} className="p-6">
                <div className="flex items-start gap-4">
                  {announcement.priority === "urgente" && (
                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {announcement.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(announcement.publishedAt).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PraiotelLayout>
  );
}
