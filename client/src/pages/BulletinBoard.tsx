import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Calendar, User, Send } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export function BulletinBoard() {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");

  const { data: messages = [], refetch } = trpc.bulletinMessages.list.useQuery({});

  const createMessageMutation = trpc.bulletinMessages.create.useMutation({
    onSuccess: () => {
      toast.success("Mensagem publicada");
      setNewMessage("");
      refetch();
    },
  });

  const likeMutation = trpc.bulletinMessages.like.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      createMessageMutation.mutate({ message: newMessage });
    }
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Mural de Mensagens</h1>
        </div>

        {/* Formulário de nova mensagem */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Partilhe uma mensagem com a equipa..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </form>
        </Card>

        {/* Lista de mensagens */}
        <div className="grid gap-4">
          {messages.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhuma mensagem ainda. Seja o primeiro a partilhar!
            </Card>
          ) : (
            messages.map((message: any) => (
              <Card key={message.id} className="p-6">
                <div className="space-y-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {message.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(message.createdAt).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likeMutation.mutate({ messageId: message.id })}
                      className="flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      <span>{message.likesCount}</span>
                    </Button>
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
