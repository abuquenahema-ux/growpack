# Notificações de depósitos/levantamentos + acesso admin por email

## O que vai mudar

### 1. Avisos dentro do app
- Nova tabela de notificações (mensagem, tipo, lida/não lida, data) ligada a cada utilizador, com leitura apenas do próprio utilizador.
- Sempre que o administrador aprovar ou rejeitar um depósito ou um levantamento, é criada automaticamente uma notificação para o utilizador afetado, com o valor e o método. Exemplos:
  - "Depósito de 1.000,00 MZN aprovado — saldo atualizado."
  - "Levantamento de 500,00 MZN rejeitado — valor devolvido ao seu saldo."
- Um sino no topo das páginas do app mostra o número de avisos por ler; ao tocar, abre a lista de notificações e marca como lidas.
- Ao entrar na app, notificações novas também aparecem como aviso rápido (toast).

### 2. Login de administrador por email
- Criação da conta de administrador com o email **Omaromarabuque@gmail.com** e a senha indicada, já com papel de administrador.
- A página de entrada passa a ter uma pequena opção "Entrar com email (administrador)", que troca o campo de número por email + senha. O cadastro normal continua igual, só por número.
- Depois de entrar, o administrador vê o "Painel de administração" no Perfil, como hoje.

## Detalhes técnicos
- Migração: tabela `notifications` (id, user_id, title, body, kind, read, created_at) com GRANTs para `authenticated`/`service_role`, RLS com SELECT/UPDATE do próprio utilizador.
- `src/lib/app.server.ts`: helper `notify(userId, ...)` chamado dentro de `reviewDeposit` e `reviewWithdrawal`; novas funções `loadNotifications` e `markNotificationsRead`.
- `src/lib/app.functions.ts`: server functions correspondentes protegidas por `requireSupabaseAuth`.
- Novo componente de sino + lista em `src/routes/_app.tsx` (ou componente próprio) usando TanStack Query com refetch periódico.
- Conta admin criada via Auth Admin API (email confirmado) + linha em `user_roles` e `profiles`.
- `src/routes/index.tsx`: modo de login alternativo por email, sem alterar o fluxo por telefone.
