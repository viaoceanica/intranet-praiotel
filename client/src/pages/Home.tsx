import { useAuth } from "@/_core/hooks/useAuth";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users, Clock, CheckCircle } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Tickets Abertos",
      value: "0",
      icon: Ticket,
      color: "text-[#F15A24]",
      bgColor: "bg-orange-50",
    },
    {
      title: "Em Progresso",
      value: "0",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Resolvidos",
      value: "0",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Utilizadores",
      value: "1",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="text-gray-500 mt-1">
            Visão geral do sistema de gestão de assistência técnica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum ticket registado</p>
              <p className="text-sm mt-1">Os tickets aparecerão aqui quando forem criados</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
