"use client";

// Aba de usuários: criação, edição, ativação, códigos e sessões.

import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Loader2,
  LogOut,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessao } from "@/hooks/use-sessao";
import { adminApi, type CodigoEmitido, type UsuarioAdmin } from "./api";

function iniciais(nome: string, email: string): string {
  const base = (nome || email).trim();
  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function SecaoUsuarios({ aoEmitir }: { aoEmitir: (c: CodigoEmitido) => void }) {
  const { usuario } = useSessao();
  const [itens, setItens] = useState<UsuarioAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", papel: "professor" });
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [excluindo, setExcluindo] = useState<UsuarioAdmin | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { usuarios } = await adminApi.usuarios();
      setItens(usuarios);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const r = await adminApi.criarUsuario(form);
      setCriando(false);
      setForm({ nome: "", email: "", papel: "professor" });
      toast.success("Conta criada");
      aoEmitir({
        codigo: r.codigo,
        expiraEm: r.expiraEm,
        email: r.usuario.email,
        tipo: "primeiro_acesso",
      });
      await carregar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao criar.");
    } finally {
      setSalvando(false);
    }
  };

  const reemitir = async (u: UsuarioAdmin) => {
    setProcessando(u.id);
    try {
      const emitido = await adminApi.reemitirCodigo(u.id);
      aoEmitir(emitido);
      toast.success("Código gerado");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao gerar.");
    } finally {
      setProcessando(null);
    }
  };

  const revogarSessoes = async (u: UsuarioAdmin) => {
    setProcessando(u.id);
    try {
      const r = await adminApi.revogarSessoes(u.id);
      toast.success(`Sessões encerradas (${r.removidas}).`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao revogar.");
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {itens.length} {itens.length === 1 ? "conta" : "contas"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg"
            onClick={() => void carregar()}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Atualizar
          </Button>
          <Button size="sm" className="gap-1.5 rounded-lg" onClick={() => setCriando(true)}>
            <UserPlus className="h-4 w-4" aria-hidden /> Nova conta
          </Button>
        </div>
      </div>

      {carregando ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : itens.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Nenhuma conta</p>
          <p className="text-muted-foreground mt-1 text-sm">Crie a primeira conta de professor.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((u) => (
            <li
              key={u.id}
              className="border-border bg-card na-cascata flex items-center gap-3 rounded-2xl border p-4"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-xs">{iniciais(u.nome, u.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{u.nome || "(sem nome)"}</span>
                  <Badge variant={u.papel === "admin" ? "default" : "outline"}>
                    {u.papel === "admin" ? "Admin" : "Professor"}
                  </Badge>
                  <Badge variant={u.ativado ? "secondary" : "outline"}>
                    {u.ativado ? "Ativo" : "Pendente"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">{u.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-lg"
                    aria-label={`Ações para ${u.nome || u.email}`}
                    title="Ações"
                  >
                    {processando === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <MoreVertical className="h-4 w-4" aria-hidden />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="gap-2" onSelect={() => setEditando(u)}>
                    <Pencil className="h-4 w-4" aria-hidden /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onSelect={() => void reemitir(u)}>
                    <KeyRound className="h-4 w-4" aria-hidden /> Gerar código
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onSelect={() => void revogarSessoes(u)}>
                    <LogOut className="h-4 w-4" aria-hidden /> Encerrar sessões
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    disabled={u.id === usuario?.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      setExcluindo(u);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={criando} onOpenChange={setCriando}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="fonte-display">Nova conta</DialogTitle>
            <DialogDescription>
              A conta é criada pendente. O código de primeiro acesso é exibido uma vez.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={criar} className="space-y-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor="novo-nome">Nome</Label>
              <Input
                id="novo-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Prof. Maria da Silva"
                className="rounded-lg"
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="novo-email">E-mail</Label>
              <Input
                id="novo-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nome@escola.br"
                className="rounded-lg"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="novo-papel">Papel</Label>
              <Select value={form.papel} onValueChange={(v) => setForm({ ...form, papel: v })}>
                <SelectTrigger id="novo-papel" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setCriando(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={salvando || form.nome.trim().length < 2 || !form.email.includes("@")}
              >
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Criar conta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DialogEditar
        usuario={editando}
        euId={usuario?.id ?? ""}
        aoFechar={() => setEditando(null)}
        aoSalvar={async () => {
          setEditando(null);
          await carregar();
        }}
      />

      <AlertDialog open={Boolean(excluindo)} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              A conta de {excluindo?.nome || excluindo?.email} e todos os seus dados serão removidos
              permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl text-white"
              onClick={async () => {
                if (!excluindo) return;
                try {
                  await adminApi.excluirUsuario(excluindo.id);
                  toast.success("Conta excluída");
                  setExcluindo(null);
                  await carregar();
                } catch (erro) {
                  toast.error(erro instanceof Error ? erro.message : "Falha ao excluir.");
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DialogEditar({
  usuario,
  euId,
  aoFechar,
  aoSalvar,
}: {
  usuario: UsuarioAdmin | null;
  euId: string;
  aoFechar: () => void;
  aoSalvar: () => Promise<void>;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("professor");
  const [ativado, setAtivado] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
      setPapel(usuario.papel);
      setAtivado(usuario.ativado);
    }
  }, [usuario]);

  const euMesmo = usuario?.id === euId;

  const salvar = async () => {
    if (!usuario) return;
    setSalvando(true);
    try {
      await adminApi.editarUsuario(usuario.id, { nome, email, papel, ativado });
      toast.success("Conta atualizada");
      await aoSalvar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={Boolean(usuario)} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="fonte-display">Editar conta</DialogTitle>
          <DialogDescription>
            Alterar papel ou desativar encerra as sessões abertas desta conta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input
              id="edit-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-papel">Papel</Label>
            <Select value={papel} onValueChange={setPapel} disabled={euMesmo}>
              <SelectTrigger id="edit-papel" className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Conta ativa</p>
              <p className="text-muted-foreground text-xs">
                Contas pendentes precisam de um código de primeiro acesso.
              </p>
            </div>
            <Switch
              checked={ativado}
              onCheckedChange={setAtivado}
              disabled={euMesmo}
              aria-label="Conta ativa"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-xl" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={() => void salvar()} disabled={salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
