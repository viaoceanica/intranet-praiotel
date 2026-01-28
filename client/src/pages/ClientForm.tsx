import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";

export default function ClientForm() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const clientId = params?.id ? parseInt(params.id) : null;
  const isEdit = clientId !== null && clientId > 0;

  const [formData, setFormData] = useState({
    designation: "",
    address: "",
    primaryEmail: "",
    nif: "",
    responsiblePerson: "",
  });

  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  const utils = trpc.useUtils();

  const { data: client, isLoading: loadingClient } = trpc.clients.getById.useQuery(
    { id: clientId! },
    { enabled: isEdit }
  );

  const { data: existingEmails } = trpc.clients.getEmails.useQuery(
    { clientId: clientId! },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (client) {
      setFormData({
        designation: client.designation,
        address: client.address || "",
        primaryEmail: client.primaryEmail,
        nif: client.nif,
        responsiblePerson: client.responsiblePerson || "",
      });
    }
  }, [client]);

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso");
      utils.clients.list.invalidate();
      setLocation("/clients");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso");
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: clientId! });
      setLocation("/clients");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addEmailMutation = trpc.clients.addEmail.useMutation({
    onSuccess: () => {
      toast.success("Email adicionado");
      utils.clients.getEmails.invalidate({ clientId: clientId! });
      setNewEmail("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEmailMutation = trpc.clients.deleteEmail.useMutation({
    onSuccess: () => {
      toast.success("Email eliminado");
      utils.clients.getEmails.invalidate({ clientId: clientId! });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      updateMutation.mutate({
        id: clientId!,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;

    if (!isEdit) {
      // Modo criação: adicionar à lista local
      if (additionalEmails.includes(newEmail)) {
        toast.error("Email já adicionado");
        return;
      }
      setAdditionalEmails([...additionalEmails, newEmail]);
      setNewEmail("");
    } else {
      // Modo edição: adicionar à base de dados
      addEmailMutation.mutate({
        clientId: clientId!,
        email: newEmail,
      });
    }
  };

  const handleRemoveEmail = (email: string, id?: number) => {
    if (id) {
      deleteEmailMutation.mutate({ id });
    } else {
      setAdditionalEmails(additionalEmails.filter((e) => e !== email));
    }
  };

  if (isEdit && loadingClient) {
    return (
      <PraiotelLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
        </div>
      </PraiotelLayout>
    );
  }

  return (
    <PraiotelLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: "Clientes", href: "/clients" },
            { label: isEdit ? "Editar Cliente" : "Novo Cliente" },
          ]}
        />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? "Editar Cliente" : "Novo Cliente"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEdit
                ? "Atualizar informações do cliente"
                : "Adicionar um novo cliente ao sistema"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designação *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF *</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e) =>
                    setFormData({ ...formData, nif: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Morada</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryEmail">Email Principal *</Label>
                <Input
                  id="primaryEmail"
                  type="email"
                  value={formData.primaryEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryEmail: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsiblePerson">Responsável</Label>
                <Input
                  id="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsiblePerson: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emails Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="adicionar@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={!newEmail.trim() || addEmailMutation.isPending}
                  className="bg-[#F15A24] hover:bg-[#D14A1A]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {isEdit && existingEmails && existingEmails.length > 0 && (
                <div className="space-y-2">
                  {existingEmails.map((emailObj) => (
                    <div
                      key={emailObj.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm">{emailObj.email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmail(emailObj.email, emailObj.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!isEdit && additionalEmails.length > 0 && (
                <div className="space-y-2">
                  {additionalEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm">{email}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmail(email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!isEdit && additionalEmails.length === 0 && (!existingEmails || existingEmails.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum email adicional
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/clients")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-[#F15A24] hover:bg-[#D14A1A]"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : isEdit ? (
                "Atualizar Cliente"
              ) : (
                "Criar Cliente"
              )}
            </Button>
          </div>
        </form>
      </div>
    </PraiotelLayout>
  );
}
