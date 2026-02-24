import PraiotelLayout from "@/components/PraiotelLayout";
import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Ticket, 
  PlusCircle, 
  List, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Paperclip, 
  History, 
  Zap, 
  FileCheck,
  ChevronRight,
  ArrowUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  title: string;
  icon: any;
  subsections?: { id: string; title: string }[];
}

const sections: Section[] = [
  { 
    id: "visao-geral", 
    title: "Visão Geral", 
    icon: BookOpen,
    subsections: [
      { id: "navegacao-principal", title: "Navegação Principal" },
      { id: "perfis-utilizador", title: "Perfis de Utilizador" },
    ]
  },
  { 
    id: "criar-ticket", 
    title: "Criar Ticket", 
    icon: PlusCircle,
    subsections: [
      { id: "selecionar-cliente", title: "Selecionar Cliente" },
      { id: "preencher-formulario", title: "Preencher Formulário" },
      { id: "anexar-ficheiros", title: "Anexar Ficheiros" },
    ]
  },
  { 
    id: "lista-tickets", 
    title: "Lista de Tickets", 
    icon: List,
    subsections: [
      { id: "filtros-pesquisa", title: "Filtros e Pesquisa" },
      { id: "edicao-rapida", title: "Edição Rápida" },
    ]
  },
  { 
    id: "detalhe-ticket", 
    title: "Detalhe do Ticket", 
    icon: FileText,
    subsections: [
      { id: "informacoes-ticket", title: "Informações do Ticket" },
      { id: "editar-ticket", title: "Editar Ticket" },
      { id: "anexos", title: "Anexos" },
      { id: "historico-notas", title: "Histórico e Notas" },
    ]
  },
  { 
    id: "estados-prioridades", 
    title: "Estados e Prioridades", 
    icon: AlertTriangle,
    subsections: [
      { id: "estados", title: "Estados do Ticket" },
      { id: "prioridades", title: "Níveis de Prioridade" },
      { id: "ciclo-vida", title: "Ciclo de Vida" },
    ]
  },
  { 
    id: "atribuicao-tickets", 
    title: "Atribuição de Tickets", 
    icon: Users,
    subsections: [
      { id: "atribuir-tecnico", title: "Atribuir a Técnico" },
      { id: "reatribuir", title: "Reatribuir Ticket" },
    ]
  },
  { 
    id: "sla-config", 
    title: "Configuração SLA", 
    icon: Clock,
    subsections: [
      { id: "tempos-resposta", title: "Tempos de Resposta" },
      { id: "tempos-resolucao", title: "Tempos de Resolução" },
      { id: "prioridades-personalizadas", title: "Prioridades Personalizadas" },
    ]
  },
  { 
    id: "priorizacao-automatica", 
    title: "Priorização Automática", 
    icon: Zap,
    subsections: [
      { id: "tipos-regras", title: "Tipos de Regras" },
      { id: "criar-regra", title: "Criar Regra" },
    ]
  },
  { 
    id: "templates-resposta", 
    title: "Templates de Resposta", 
    icon: MessageSquare,
    subsections: [
      { id: "usar-template", title: "Usar Template" },
      { id: "gerir-templates", title: "Gerir Templates" },
    ]
  },
  { 
    id: "estatisticas", 
    title: "Estatísticas", 
    icon: BarChart3,
    subsections: [
      { id: "metricas-gerais", title: "Métricas Gerais" },
      { id: "desempenho-tecnicos", title: "Desempenho por Técnico" },
      { id: "cumprimento-sla", title: "Cumprimento de SLA" },
    ]
  },
  { 
    id: "dicas-boas-praticas", 
    title: "Dicas e Boas Práticas", 
    icon: FileCheck,
  },
];

export default function TicketManual() {
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "visao-geral": true,
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Observar scroll para destacar secção ativa
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const scrollTop = contentRef.current.scrollTop;
      setShowScrollTop(scrollTop > 300);

      const sectionElements = contentRef.current.querySelectorAll("[data-section]");
      let currentSection = "visao-geral";
      
      sectionElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const containerRect = contentRef.current!.getBoundingClientRect();
        if (rect.top - containerRect.top <= 100) {
          currentSection = el.getAttribute("data-section") || currentSection;
        }
      });
      
      setActiveSection(currentSection);
    };

    const container = contentRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = contentRef.current?.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Expandir a secção pai se for subsecção
    const parentSection = sections.find(s => 
      s.subsections?.some(sub => sub.id === sectionId)
    );
    if (parentSection) {
      setExpandedSections(prev => ({ ...prev, [parentSection.id]: true }));
    }
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  return (
    <PraiotelLayout hideFooter>
      <div className="flex -m-6" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Índice lateral */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#F15A24]/5 to-transparent">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-[#F15A24]" />
              <h2 className="font-bold text-gray-900">ÍNDICE</h2>
            </div>
            <p className="text-xs text-gray-500">Manual do Sistema de Tickets</p>
          </div>
          <nav className="p-2">
            {sections.map((section) => {
              const isActive = activeSection === section.id || 
                section.subsections?.some(sub => sub.id === activeSection);
              const isExpanded = expandedSections[section.id];
              
              return (
                <div key={section.id} className="mb-0.5">
                  <button
                    onClick={() => {
                      scrollToSection(section.id);
                      if (section.subsections) toggleSection(section.id);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                      ${isActive 
                        ? "bg-[#F15A24] text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <section.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{section.title}</span>
                    {section.subsections && (
                      <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    )}
                  </button>
                  {section.subsections && isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {section.subsections.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => scrollToSection(sub.id)}
                          className={`
                            w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors
                            ${activeSection === sub.id 
                              ? "text-[#F15A24] font-semibold bg-[#F15A24]/5" 
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }
                          `}
                        >
                          {sub.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main ref={contentRef} className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-10 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-[#F15A24]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Manual do Sistema de Tickets</h1>
                  <p className="text-gray-500 mt-1">Guia completo para gestão de tickets de assistência técnica</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Badge variant="outline" className="text-xs">Versão 1.0</Badge>
                <Badge variant="outline" className="text-xs">Atualizado em Fevereiro 2026</Badge>
                <Badge variant="outline" className="text-xs">Praiotel Açores</Badge>
              </div>
            </div>

            {/* Navegação rápida em cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {sections.slice(0, 6).map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="text-left"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-[#F15A24]/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <section.icon className="h-5 w-5 text-[#F15A24]" />
                        <h3 className="font-semibold text-sm text-gray-900">{section.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {section.id === "visao-geral" && "Introdução ao sistema e navegação principal."}
                        {section.id === "criar-ticket" && "Como criar um novo ticket de assistência."}
                        {section.id === "lista-tickets" && "Pesquisar, filtrar e gerir todos os tickets."}
                        {section.id === "detalhe-ticket" && "Visualizar e editar informações do ticket."}
                        {section.id === "estados-prioridades" && "Estados, prioridades e ciclo de vida."}
                        {section.id === "atribuicao-tickets" && "Atribuir e reatribuir tickets a técnicos."}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            {/* ==================== SECÇÃO: VISÃO GERAL ==================== */}
            <section data-section="visao-geral" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Visão Geral do Sistema</h2>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                O sistema de tickets de assistência técnica da Praiotel permite gerir pedidos de assistência dos clientes de forma organizada e eficiente. Cada pedido é registado como um <strong>ticket</strong>, que percorre um ciclo de vida desde a sua criação até à resolução e fecho.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                O sistema oferece ferramentas para priorizar, categorizar, comunicar e monitorizar o desempenho do suporte técnico, mantendo o cliente informado ao longo de todo o processo.
              </p>

              <div data-section="navegacao-principal" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Navegação Principal</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  O menu de <strong>Tickets</strong> na barra lateral esquerda está organizado nas seguintes áreas:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className="h-4 w-4 text-[#F15A24]" />
                        <h4 className="font-semibold text-sm">Tickets</h4>
                      </div>
                      <p className="text-xs text-gray-500">Lista completa de tickets, criação de novos tickets e acesso ao detalhe de cada um.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-[#F15A24]" />
                        <h4 className="font-semibold text-sm">Configuração SLA</h4>
                      </div>
                      <p className="text-xs text-gray-500">Definição de tempos de resposta e resolução por nível de prioridade.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-[#F15A24]" />
                        <h4 className="font-semibold text-sm">Priorização Automática</h4>
                      </div>
                      <p className="text-xs text-gray-500">Regras automáticas que ajustam a prioridade dos tickets com base em condições predefinidas.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-[#F15A24]" />
                        <h4 className="font-semibold text-sm">Estatísticas</h4>
                      </div>
                      <p className="text-xs text-gray-500">Métricas de desempenho por técnico, cumprimento de SLA e análises gerais.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-[#F15A24]" />
                        <h4 className="font-semibold text-sm">Templates de Resposta</h4>
                      </div>
                      <p className="text-xs text-gray-500">Respostas pré-definidas para agilizar a comunicação com os clientes.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div data-section="perfis-utilizador" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Perfis de Utilizador</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  O sistema possui diferentes perfis com permissões distintas. A tabela seguinte resume o acesso de cada perfil às funcionalidades de tickets:
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Funcionalidade</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-700 border-b">Admin</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-700 border-b">Gestor</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-700 border-b">Técnico</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-700 border-b">Visualizador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Ver lista de tickets", true, true, true, true],
                        ["Criar tickets", true, true, true, false],
                        ["Editar tickets", true, true, true, false],
                        ["Atribuir técnicos", true, true, false, false],
                        ["Configurar SLA", true, false, false, false],
                        ["Priorização automática", true, false, false, false],
                        ["Ver estatísticas", true, true, false, false],
                        ["Gerir templates", true, true, false, false],
                      ].map(([func, admin, gestor, tecnico, visualizador], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-2.5 text-gray-700 border-b">{func as string}</td>
                          <td className="text-center px-3 py-2.5 border-b">{admin ? "✓" : "—"}</td>
                          <td className="text-center px-3 py-2.5 border-b">{gestor ? "✓" : "—"}</td>
                          <td className="text-center px-3 py-2.5 border-b">{tecnico ? "✓" : "—"}</td>
                          <td className="text-center px-3 py-2.5 border-b">{visualizador ? "✓" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: CRIAR TICKET ==================== */}
            <section data-section="criar-ticket" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <PlusCircle className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Criar Ticket</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                Para criar um novo ticket de assistência técnica, aceda ao menu <strong>Tickets</strong> e clique no botão <strong>"+ Novo Ticket"</strong> no canto superior direito, ou navegue diretamente para <strong>Tickets → Novo Ticket</strong>.
              </p>

              <div data-section="selecionar-cliente" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Selecionar Cliente</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  O primeiro passo é associar o ticket a um cliente. Existem duas formas de o fazer:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Pesquisar Cliente Existente</h4>
                    <p className="text-sm text-gray-600">
                      No campo "Selecionar Cliente", comece a digitar o nome, NIF ou email do cliente. O sistema pesquisa automaticamente em ambas as bases de dados — <strong>Assistência Técnica</strong> e <strong>Gestão Comercial</strong>. Cada resultado aparece com um badge indicativo do tipo de cliente.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Inserir Cliente Manualmente</h4>
                    <p className="text-sm text-gray-600">
                      Se o cliente não existir na base de dados, ative a opção "Inserir cliente manualmente" e preencha o nome do cliente diretamente no campo de texto.
                    </p>
                  </div>
                </div>
              </div>

              <div data-section="preencher-formulario" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preencher Formulário</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Após selecionar o cliente, preencha os seguintes campos obrigatórios:
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Campo</th>
                        <th className="text-center px-3 py-3 font-semibold text-gray-700 border-b">Obrigatório</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Equipamento", true, "Nome ou modelo do equipamento com problema (ex: Máquina de café, Frigorífico)."],
                        ["Tipo de Problema", true, "Categoria do problema reportado (ex: Avaria, Manutenção, Instalação)."],
                        ["Localização (Ilha)", true, "Ilha onde se encontra o equipamento. Selecione a partir da lista."],
                        ["Prioridade", true, "Nível de urgência: Baixa, Média, Alta ou Urgente. Por defeito é 'Média'."],
                        ["Atribuir a", false, "Técnico responsável. Se não atribuído, ficará disponível para qualquer técnico."],
                        ["Descrição do Problema", true, "Descrição detalhada do problema reportado pelo cliente."],
                      ].map(([campo, obrigatorio, desc], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-2.5 font-medium text-gray-900 border-b">{campo as string}</td>
                          <td className="text-center px-3 py-2.5 border-b">
                            {obrigatorio ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Sim</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">Não</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 border-b">{desc as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> Se o cliente selecionado tiver equipamentos registados no sistema, estes aparecerão automaticamente como sugestões no campo "Equipamento".
                  </p>
                </div>
              </div>

              <div data-section="anexar-ficheiros" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Anexar Ficheiros</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Na secção "Anexos (Imagens e Documentos)", pode carregar ficheiros relevantes para o ticket, como fotografias do equipamento danificado, documentos de garantia ou relatórios técnicos.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2"><strong>Formatos aceites:</strong> Imagens (JPG, PNG), PDF e Word (DOC, DOCX).</p>
                  <p className="text-sm text-blue-800"><strong>Tamanho máximo:</strong> 10 MB por ficheiro.</p>
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: LISTA DE TICKETS ==================== */}
            <section data-section="lista-tickets" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <List className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Lista de Tickets</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                A página principal de Tickets apresenta todos os tickets do sistema numa tabela organizada, com informações resumidas de cada ticket: número, cliente, equipamento, estado, prioridade, técnico atribuído e data de criação.
              </p>

              <div data-section="filtros-pesquisa" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Filtros e Pesquisa</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  O sistema oferece múltiplos filtros para encontrar rapidamente os tickets pretendidos. Todos os filtros podem ser combinados entre si para refinar os resultados.
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Filtro</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Pesquisa por texto", "Pesquisa por número do ticket, nome do cliente ou equipamento."],
                        ["Estado", "Filtrar por: Todos, Aberto, Em Progresso, Resolvido ou Fechado."],
                        ["Prioridade", "Filtrar por nível de prioridade: Baixa, Média, Alta ou Urgente."],
                        ["Técnico", "Filtrar por técnico atribuído ao ticket."],
                        ["Cliente", "Filtrar por cliente específico."],
                        ["Localização", "Filtrar por ilha/localização."],
                        ["Data", "Filtrar por intervalo de datas (de/até)."],
                      ].map(([filtro, desc], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-2.5 font-medium text-gray-900 border-b">{filtro}</td>
                          <td className="px-4 py-2.5 text-gray-600 border-b">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Para limpar todos os filtros e voltar à vista completa, clique no botão <strong>"Limpar Filtros"</strong> que aparece quando algum filtro está ativo.
                </p>
              </div>

              <div data-section="edicao-rapida" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Edição Rápida</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Na lista de tickets, cada linha possui um botão de <strong>edição rápida</strong> (ícone de lápis) que permite alterar o estado, a prioridade e o técnico atribuído sem necessidade de abrir a página de detalhe do ticket. Esta funcionalidade é particularmente útil para gestores que precisam de redistribuir ou repriorizar vários tickets rapidamente.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Dica:</strong> A edição rápida é ideal para triagem matinal de tickets — permite atribuir técnicos e ajustar prioridades em segundos.
                  </p>
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: DETALHE DO TICKET ==================== */}
            <section data-section="detalhe-ticket" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <FileText className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Detalhe do Ticket</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                Ao clicar num ticket na lista, acede à página de detalhe onde pode consultar todas as informações, editar campos, adicionar notas, carregar anexos e acompanhar o histórico completo.
              </p>

              <div data-section="informacoes-ticket" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Ticket</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  O painel de informações apresenta todos os dados do ticket organizados de forma clara:
                </p>
                <ul className="space-y-2 mb-4">
                  {[
                    "Número do ticket (identificador único, ex: TK-00001)",
                    "Nome e tipo do cliente (Assistência Técnica ou Comercial)",
                    "Equipamento e tipo de problema",
                    "Localização (ilha)",
                    "Estado atual com badge colorido",
                    "Prioridade com indicador visual",
                    "Técnico atribuído",
                    "Datas de criação, última atualização, resolução e fecho",
                    "Descrição detalhada do problema",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <ChevronRight className="h-4 w-4 text-[#F15A24] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div data-section="editar-ticket" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Editar Ticket</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Clique no botão <strong>"Editar"</strong> para ativar o modo de edição. Pode alterar os seguintes campos:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[
                    { campo: "Estado", desc: "Alterar entre Aberto, Em Progresso, Resolvido e Fechado." },
                    { campo: "Prioridade", desc: "Ajustar o nível de urgência do ticket." },
                    { campo: "Técnico Atribuído", desc: "Atribuir ou alterar o técnico responsável." },
                    { campo: "Descrição", desc: "Atualizar a descrição do problema." },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-gray-900">{item.campo}</h4>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Após as alterações, clique em <strong>"Guardar"</strong> para confirmar ou <strong>"Cancelar"</strong> para descartar. Todas as alterações são registadas automaticamente no histórico do ticket.
                </p>
              </div>

              <div data-section="anexos" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Anexos</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  A secção de anexos permite carregar e gerir ficheiros associados ao ticket. Pode adicionar novos anexos a qualquer momento clicando no botão <strong>"Carregar Anexo"</strong>. Cada anexo mostra o nome do ficheiro, tamanho e data de carregamento, com opções para descarregar ou eliminar.
                </p>
              </div>

              <div data-section="historico-notas" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Histórico e Notas</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  O histórico regista automaticamente todas as ações realizadas no ticket, incluindo alterações de estado, prioridade, atribuição e notas adicionadas. As entradas mais recentes aparecem no topo da lista para facilitar a consulta.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Tipos de Entradas no Histórico</h4>
                  <div className="space-y-2">
                    {[
                      { tipo: "Alteração de Estado", desc: "Regista a transição entre estados (ex: Aberto → Em Progresso)." },
                      { tipo: "Alteração de Prioridade", desc: "Regista mudanças no nível de prioridade." },
                      { tipo: "Atribuição", desc: "Regista quando um técnico é atribuído ou alterado." },
                      { tipo: "Nota", desc: "Comentários ou observações adicionados manualmente pelos utilizadores." },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">{item.tipo}</Badge>
                        <span className="text-gray-600">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Para adicionar uma nota, escreva o texto no campo de texto e clique em <strong>"Adicionar Nota"</strong>. As notas são visíveis para todos os utilizadores com acesso ao ticket.
                </p>
              </div>
            </section>

            {/* ==================== SECÇÃO: ESTADOS E PRIORIDADES ==================== */}
            <section data-section="estados-prioridades" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Estados e Prioridades</h2>
              </div>

              <div data-section="estados" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Estados do Ticket</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Cada ticket possui um estado que indica a fase atual do processo de resolução. Os estados disponíveis são:
                </p>
                <div className="space-y-3 mb-4">
                  {[
                    { estado: "Aberto", cor: "bg-blue-100 text-blue-800", desc: "O ticket foi criado e aguarda análise ou atribuição. É o estado inicial de todos os tickets." },
                    { estado: "Em Progresso", cor: "bg-yellow-100 text-yellow-800", desc: "O ticket foi analisado e está a ser trabalhado por um técnico. A intervenção está em curso." },
                    { estado: "Resolvido", cor: "bg-green-100 text-green-800", desc: "O problema foi resolvido pelo técnico. Aguarda confirmação ou fecho definitivo." },
                    { estado: "Fechado", cor: "bg-gray-100 text-gray-800", desc: "O ticket foi encerrado. Não são esperadas mais ações. Pode ser reaberto se necessário." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <Badge className={`${item.cor} flex-shrink-0`}>{item.estado}</Badge>
                      <p className="text-sm text-gray-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div data-section="prioridades" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Níveis de Prioridade</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  A prioridade determina a urgência do ticket e os tempos de resposta e resolução esperados (definidos na configuração de SLA). Os níveis base são:
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Prioridade</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Descrição</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Quando Usar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["🟢 Baixa", "Pedidos sem impacto imediato na operação.", "Manutenção preventiva, pedidos de informação."],
                        ["🟡 Média", "Impacto moderado, mas com alternativas disponíveis.", "Equipamento com funcionamento parcial."],
                        ["🟠 Alta", "Impacto significativo na operação do cliente.", "Equipamento principal inoperacional."],
                        ["🔴 Urgente", "Impacto crítico, requer ação imediata.", "Paragem total de operação, risco de segurança."],
                      ].map(([prio, desc, quando], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-2.5 font-medium text-gray-900 border-b whitespace-nowrap">{prio}</td>
                          <td className="px-4 py-2.5 text-gray-600 border-b">{desc}</td>
                          <td className="px-4 py-2.5 text-gray-600 border-b">{quando}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Nota:</strong> Além dos níveis base, o administrador pode criar prioridades personalizadas na secção de Configuração SLA, com tempos de resposta e resolução específicos.
                  </p>
                </div>
              </div>

              <div data-section="ciclo-vida" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ciclo de Vida do Ticket</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  O fluxo típico de um ticket segue as seguintes etapas:
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  {[
                    { step: "1", title: "Criação", desc: "O ticket é criado com estado 'Aberto' e prioridade definida." },
                    { step: "2", title: "Triagem", desc: "O gestor analisa o ticket, ajusta a prioridade se necessário e atribui a um técnico." },
                    { step: "3", title: "Em Progresso", desc: "O técnico inicia o trabalho e altera o estado para 'Em Progresso'." },
                    { step: "4", title: "Intervenção", desc: "O técnico desloca-se ao local, realiza a intervenção e documenta o trabalho." },
                    { step: "5", title: "Resolução", desc: "Após resolver o problema, o técnico altera o estado para 'Resolvido'." },
                    { step: "6", title: "Fecho", desc: "O gestor ou administrador confirma a resolução e fecha o ticket." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#F15A24] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: ATRIBUIÇÃO DE TICKETS ==================== */}
            <section data-section="atribuicao-tickets" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <Users className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Atribuição de Tickets</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                A atribuição de tickets a técnicos é uma funcionalidade essencial para garantir que cada pedido é tratado pelo profissional mais adequado. Apenas utilizadores com perfil de <strong>Administrador</strong> ou <strong>Gestor</strong> podem atribuir tickets.
              </p>

              <div data-section="atribuir-tecnico" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Atribuir a Técnico</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Existem três formas de atribuir um ticket a um técnico:
                </p>
                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Na Criação do Ticket</h4>
                    <p className="text-sm text-gray-600">No formulário de criação, utilize o campo "Atribuir a (opcional)" para selecionar o técnico responsável.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Na Página de Detalhe</h4>
                    <p className="text-sm text-gray-600">Abra o ticket, clique em "Editar" e selecione o técnico no campo "Atribuir a".</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">Edição Rápida na Lista</h4>
                    <p className="text-sm text-gray-600">Na lista de tickets, clique no ícone de edição rápida e altere o técnico diretamente no modal.</p>
                  </div>
                </div>
              </div>

              <div data-section="reatribuir" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reatribuir Ticket</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Se um ticket precisar de ser transferido para outro técnico (por exemplo, por indisponibilidade ou especialização), basta editar o ticket e selecionar o novo técnico. A alteração é registada automaticamente no histórico, incluindo o técnico anterior e o novo técnico atribuído.
                </p>
              </div>
            </section>

            {/* ==================== SECÇÃO: CONFIGURAÇÃO SLA ==================== */}
            <section data-section="sla-config" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <Clock className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Configuração SLA</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                O SLA (Service Level Agreement) define os tempos máximos de resposta e resolução para cada nível de prioridade. Esta configuração é acessível apenas a <strong>Administradores</strong> através do menu <strong>Tickets → Configuração SLA</strong>.
              </p>

              <div data-section="tempos-resposta" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tempos de Resposta</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  O tempo de resposta é o período máximo entre a criação do ticket e a primeira ação (atribuição ou alteração de estado). Este tempo é medido em horas e varia conforme a prioridade definida.
                </p>
              </div>

              <div data-section="tempos-resolucao" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tempos de Resolução</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  O tempo de resolução é o período máximo entre a criação do ticket e a sua resolução efetiva. Tickets que ultrapassem este tempo são sinalizados como fora do SLA nas estatísticas.
                </p>
              </div>

              <div data-section="prioridades-personalizadas" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prioridades Personalizadas</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Além das quatro prioridades base (Baixa, Média, Alta, Urgente), o administrador pode criar prioridades personalizadas com tempos de SLA específicos. Por exemplo, pode criar uma prioridade "Crítica" com tempos de resposta de 30 minutos e resolução de 2 horas para situações excecionais.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Como criar:</strong> Na página de Configuração SLA, clique em "Nova Prioridade", defina o nome, tempo de resposta e tempo de resolução, e guarde. A nova prioridade ficará disponível em todos os formulários de tickets.
                  </p>
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: PRIORIZAÇÃO AUTOMÁTICA ==================== */}
            <section data-section="priorizacao-automatica" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <Zap className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Priorização Automática</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                O sistema permite definir regras que ajustam automaticamente a prioridade dos tickets com base em condições predefinidas. Esta funcionalidade é acessível apenas a <strong>Administradores</strong> através do menu <strong>Tickets → Priorização Automática</strong>.
              </p>

              <div data-section="tipos-regras" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tipos de Regras</h3>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Tipo de Regra</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Descrição</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Cliente VIP", "Eleva a prioridade de tickets de clientes marcados como VIP.", "Tickets do Hotel Exemplo → Prioridade Alta"],
                        ["Equipamento Crítico", "Eleva a prioridade quando o equipamento é marcado como crítico.", "Câmara frigorífica → Prioridade Urgente"],
                        ["Palavra-chave", "Deteta palavras na descrição que indicam urgência.", "Descrição contém 'inundação' → Prioridade Urgente"],
                        ["Tempo Decorrido", "Eleva a prioridade se o ticket não for tratado num período.", "Sem resposta após 24h → Prioridade Alta"],
                      ].map(([tipo, desc, exemplo], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-2.5 font-medium text-gray-900 border-b whitespace-nowrap">{tipo}</td>
                          <td className="px-4 py-2.5 text-gray-600 border-b">{desc}</td>
                          <td className="px-4 py-2.5 text-gray-500 border-b italic">{exemplo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div data-section="criar-regra" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Criar Regra</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Para criar uma nova regra de priorização automática, clique em <strong>"Criar Nova Regra"</strong> e preencha o nome da regra, selecione o tipo, defina as condições específicas e escolha a prioridade alvo. As regras são avaliadas automaticamente quando um ticket é criado ou atualizado.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Atenção:</strong> As regras são aplicadas por ordem de criação. Se múltiplas regras se aplicarem ao mesmo ticket, a última regra avaliada define a prioridade final.
                  </p>
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: TEMPLATES DE RESPOSTA ==================== */}
            <section data-section="templates-resposta" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Templates de Resposta</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                Os templates de resposta são textos pré-definidos que agilizam a comunicação com os clientes. Permitem manter consistência nas respostas e reduzir o tempo de escrita. Esta funcionalidade é acessível a <strong>Administradores</strong> e <strong>Gestores</strong> através do menu <strong>Tickets → Templates</strong>.
              </p>

              <div data-section="usar-template" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Usar Template</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Ao responder a um ticket ou adicionar uma nota, pode selecionar um template pré-definido que preenche automaticamente o campo de texto. Pode depois personalizar o conteúdo antes de enviar. Os templates estão organizados por categorias para facilitar a pesquisa.
                </p>
              </div>

              <div data-section="gerir-templates" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Gerir Templates</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Na página de Templates de Resposta, pode criar, editar e eliminar templates. Cada template possui um título, conteúdo e categoria opcional. Exemplos de categorias comuns:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[
                    { cat: "Receção", desc: "Confirmação de receção do pedido e informação sobre próximos passos." },
                    { cat: "Agendamento", desc: "Comunicação de data e hora da visita técnica." },
                    { cat: "Resolução", desc: "Informação sobre a resolução do problema e recomendações." },
                    { cat: "Fecho", desc: "Confirmação de encerramento do ticket e agradecimento." },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-gray-900">{item.cat}</h4>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ==================== SECÇÃO: ESTATÍSTICAS ==================== */}
            <section data-section="estatisticas" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Estatísticas</h2>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                A página de Estatísticas oferece uma visão detalhada do desempenho da equipa de suporte técnico. É acessível a <strong>Administradores</strong> e <strong>Gestores</strong> através do menu <strong>Tickets → Estatísticas</strong>.
              </p>

              <div data-section="metricas-gerais" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Métricas Gerais</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  No topo da página, quatro cartões resumem as métricas principais:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { metrica: "Total de Tickets", desc: "Número total de tickets no período selecionado." },
                    { metrica: "Tickets Resolvidos", desc: "Quantidade de tickets com resolução confirmada." },
                    { metrica: "Tempo Médio", desc: "Tempo médio de resolução dos tickets." },
                    { metrica: "Cumprimento SLA", desc: "Percentagem de tickets resolvidos dentro do prazo." },
                  ].map((item, i) => (
                    <Card key={i} className="border-gray-200">
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-xs text-gray-900">{item.metrica}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div data-section="desempenho-tecnicos" className="scroll-mt-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Desempenho por Técnico</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  A tabela de desempenho detalhado mostra, para cada técnico, o número de tickets atribuídos, resolvidos, tempo médio de resolução e taxa de cumprimento de SLA. Os valores são comparados com a média da equipa para identificar desvios.
                </p>
              </div>

              <div data-section="cumprimento-sla" className="scroll-mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cumprimento de SLA</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  O gráfico de cumprimento de SLA por técnico apresenta visualmente a percentagem de tickets resolvidos dentro do prazo definido. Técnicos com taxa inferior a 80% são sinalizados para atenção. É possível filtrar por período (todos, último mês, última semana) para análises temporais.
                </p>
              </div>
            </section>

            {/* ==================== SECÇÃO: DICAS E BOAS PRÁTICAS ==================== */}
            <section data-section="dicas-boas-praticas" className="mb-12 scroll-mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#F15A24]/10 rounded-lg">
                  <FileCheck className="h-5 w-5 text-[#F15A24]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Dicas e Boas Práticas</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Descrições Detalhadas</h4>
                  <p className="text-sm text-green-800">
                    Ao criar um ticket, inclua o máximo de informação possível na descrição: modelo do equipamento, sintomas observados, quando o problema começou e se houve alguma alteração recente. Descrições completas reduzem o tempo de diagnóstico.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Fotografias do Problema</h4>
                  <p className="text-sm text-green-800">
                    Sempre que possível, anexe fotografias do equipamento ou do problema. Uma imagem pode revelar detalhes que a descrição textual não captura, acelerando a resolução.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Atualização Regular do Estado</h4>
                  <p className="text-sm text-green-800">
                    Mantenha o estado do ticket atualizado. Quando iniciar o trabalho, mude para "Em Progresso". Quando resolver, mude para "Resolvido". Isto permite que gestores e clientes acompanhem o progresso em tempo real.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Notas de Intervenção</h4>
                  <p className="text-sm text-green-800">
                    Após cada intervenção, adicione uma nota ao ticket descrevendo o que foi feito, peças substituídas e recomendações. Este histórico é valioso para futuras intervenções no mesmo equipamento.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Prioridades Corretas</h4>
                  <p className="text-sm text-green-800">
                    Utilize a prioridade correta ao criar tickets. Nem todos os pedidos são urgentes. Uma priorização adequada garante que os problemas realmente críticos recebem atenção imediata e que os recursos da equipa são utilizados de forma eficiente.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Triagem Diária</h4>
                  <p className="text-sm text-green-800">
                    Gestores devem realizar uma triagem diária dos tickets abertos, utilizando a edição rápida para atribuir técnicos e ajustar prioridades. Isto garante que nenhum ticket fica sem resposta por mais de 24 horas.
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 mt-12 text-center">
              <p className="text-sm text-gray-500">
                Manual do Sistema de Tickets — Praiotel Açores © 2026
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Versão 1.0 — Última atualização: Fevereiro 2026
              </p>
            </div>
          </div>

          {/* Botão scroll to top */}
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 rounded-full w-10 h-10 p-0 bg-[#F15A24] hover:bg-[#D14A1A] shadow-lg z-50"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          )}
        </main>
      </div>
    </PraiotelLayout>
  );
}
