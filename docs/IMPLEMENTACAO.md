# ACTech Dashboard — Guia de Implementação

Documento para implementar **página por página**, na ordem. Só avance quando a etapa atual estiver funcional (mesmo que simples).

**Stack:** Next.js (App Router) · Tailwind · Firebase Auth · Firestore

**Dados de origem:** `clientes.csv` · `os.csv`

---

## Como usar este doc

1. Marque `[ ]` → `[x]` ao concluir cada item.
2. Não pule etapas: cada página depende da anterior.
3. Em cada página: **rota → dados → UI mínima → regras → polish**.
4. Importe os CSVs só depois do CRUD básico estar estável (Etapa 10).

---

## Etapa 0 — Fundação (já iniciada)

**Objetivo:** app sobe, Firebase conecta, auth existe.

### Checklist
- [x] Projeto Next.js + Tailwind + Firebase
- [x] `.env.local` preenchido com chaves do Firebase
- [x] Auth Email/Password habilitado no Firebase Console
- [x] Firestore criado (modo produção + regras básicas)
- [x] `npm run dev` abre sem erro

### Entregável
Login técnico funcionando (criar 1 usuário no Console se precisar).

### Regras Firestore (mínimo temporário)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Etapa 1 — Schema Firestore + Types

**Objetivo:** modelar os dados antes de qualquer tela.

### Collections
| Collection | Uso |
|------------|-----|
| `users` | Perfil do usuário logado (nome, role) |
| `clientes` | Cadastro de clientes |
| `ordens` | Ordens de serviço |
| `tecnicos` | Técnicos / atendentes |
| `config` | Dados da loja (doc `loja`) |

### Types (`src/types/`)

**Cliente**
```ts
id, nome, nascimento?, endereco?, cidade?, telefone?, email?, estado?,
createdAt, updatedAt
```

**Ordem (OS)**
```ts
id, numero, // número amigável sequencial
chamado,           // problema relatado
atendenteId?, atendenteNome?,
clienteId, clienteNome,
servico?,
tecnicoId?, tecnicoNome?,
dataEmissao,       // Timestamp
dataExecucao?,
previsao?,
custo: number,     // sempre number (não "R$155,00")
preco: number,
resolvido: boolean,
dataConclusao?,
status: 'ABERTA' | 'EM_ANALISE' | 'AGUARDANDO_PECA' | 'AGUARDANDO_APROVACAO'
      | 'EM_SERVICO' | 'PRONTA' | 'ENTREGUE' | 'CANCELADA' | 'SEM_RESOLUCAO',
obs?,
listaEntrada?,     // equipamento recebido
descricaoChamado?,
resolucao?,
diagnosticoTecnico?,
createdAt, updatedAt
```

**Tecnico**
```ts
id, nome, ativo: boolean, role: 'tecnico' | 'atendente' | 'admin'
```

**Config loja**
```ts
nome, cnpj?, telefone?, endereco?, garantiaPadraoDias?
```

### Checklist
- [x] Criar `src/types/cliente.ts`, `ordem.ts`, `tecnico.ts`, `config.ts`
- [x] Helpers: `parseMoney`, `formatMoney`, `formatDate` (`src/lib/format.ts`)
- [x] Constantes de status + labels em PT-BR
- [x] Função `calcularLucro(preco, custo)`

### Entregável
Types compilando; nenhum UI ainda. ✅

---

## Etapa 2 — `/login`

**Rota:** `src/app/login/page.tsx`

**Objetivo:** autenticar e redirecionar.

### UI mínima
- Email + senha
- Botão Entrar
- Mensagem de erro
- Redirect para `/dashboard` se já logado

### Regras
- [x] Proteção de rotas: layout autenticado em `(app)/`
- [x] Se não logado → `/login`
- [x] Se logado em `/login` → `/dashboard`
- [x] Logout no layout

### Checklist
- [x] Página de login
- [x] Middleware ou layout client checando `useAuth` (`AuthGuard`)
- [x] Botão sair
- [x] Loading state (spinner) enquanto `loading === true`

### Entregável
Só entra no app autenticado. ✅

---

## Etapa 2.5 — Import CSV → Firestore

**Rota:** `src/app/(app)/configuracoes/importar/page.tsx`  
**Arquivos locais:** `data/clientes.csv`, `data/os.csv`

**Objetivo:** popular o banco com dados reais antes das telas de lista/KPI.

### O que faz
1. Lê `clientes.csv` → collection `clientes` (id `c_{legacyId}`)
2. Lê `os.csv` → collection `ordens` (id `o_{legacyId}`)
3. Extrai nomes únicos de técnico/atendente → `tecnicos`
4. Vincula OS ↔ cliente por nome normalizado
5. Normaliza status, `preco`/`custo` (number) e datas
6. Atualiza `config/counters` e cria `config/loja` mínima

### Checklist
- [x] Página autenticada de import (upload dos 2 CSVs)
- [x] Batches Firestore (≤400 ops)
- [x] Idempotente (merge nos mesmos IDs)
- [x] Avisos de OS sem match de cliente
- [x] CSVs copiados em `data/` (não versionar — PII)

### Como rodar
1. Crie um usuário em Firebase Auth (Email/Password)
2. `npm run dev` → entre em `/login`
3. Abra `/configuracoes/importar`
4. Selecione `data/clientes.csv` e `data/os.csv`
5. Clique em **Importar para o Firestore**
6. Confira no Console Firebase → Firestore

### Entregável
Firestore com ~680 clientes e ~1450 OS. ✅ (após rodar o import)

---

## Etapa 3 — Layout do app (shell)

**Rota:** `src/app/(app)/layout.tsx`

**Objetivo:** navegação comum para todas as páginas internas.

### UI mínima
- Sidebar (desktop) / menu (mobile)
- Nome da loja: **ACTech**
- Links:
  - Dashboard
  - Ordens
  - Clientes
  - Faturamento
  - Relatórios
  - Técnicos
  - Configurações
- Área do usuário + Sair

### Checklist
- [x] Layout `(app)` com sidebar
- [x] Highlight do link ativo
- [x] Responsivo básico (drawer mobile)

### Entregável
Navegar entre rotas vazias sem quebrar. ✅

---

## Etapa 4 — `/dashboard` (Home + KPIs)

**Rota:** `src/app/(app)/dashboard/page.tsx`  
**Redirect:** `/` → `/dashboard`

**Objetivo:** visão operacional do dia/mês.

### Cards (topo)
| KPI | Fonte |
|-----|--------|
| OS abertas | status ∉ ENTREGUE, CANCELADA |
| Prontas p/ retirada | status = PRONTA |
| Receita do mês | Σ `preco` (concluídas no mês) |
| Lucro do mês | Σ (`preco` − `custo`) |
| Ticket médio | receita ÷ qtd OS pagas no mês |
| OS do dia | `dataEmissao` = hoje |

### Blocos
1. Funil de status (contagem por status)
2. Lista: prontas para retirada (link p/ OS)
3. Mini gráfico receita 30 dias (pode ser lista/barras simples no início)
4. Atalho: **Nova OS**

### Checklist
- [x] Queries Firestore (ou agregação client no início)
- [x] 6 KPI cards
- [x] Lista prontas
- [x] Empty states (“nenhuma OS pronta”)
- [x] Loading skeleton

### Entregável
Home útil mesmo com poucos dados manuais. ✅

> **Nota:** no começo pode carregar OS do mês inteiro e agregar no client. Otimizar depois.

---

## Etapa 5 — Clientes

### 5.1 `/clientes` — lista
**Rota:** `src/app/(app)/clientes/page.tsx`

- Tabela/lista: nome, telefone, cidade
- Busca por nome/telefone
- Botão Novo cliente
- Clique → ficha
- **Paginação** (obrigatório em todas as tabelas)

### 5.2 `/clientes/novo`
**Rota:** `src/app/(app)/clientes/novo/page.tsx`

Form: nome*, telefone*, email, nascimento, endereço, cidade, estado

### 5.3 `/clientes/[id]`
**Rota:** `src/app/(app)/clientes/[id]/page.tsx`

- Dados do cliente
- Botão editar
- Histórico de OS do cliente (query `ordens` where `clienteId`)

### 5.4 `/clientes/[id]/editar`
Form de edição + salvar + voltar

### Checklist
- [x] CRUD completo
- [x] Validação mínima (nome + telefone)
- [x] Toast/feedback de sucesso/erro
- [x] Soft delete opcional (ou delete real no início)

### Entregável
Cadastrar, buscar e abrir cliente. ✅

---

## Etapa 6 — Ordens de Serviço (núcleo)

### 6.1 `/ordens` — lista
**Rota:** `src/app/(app)/ordens/page.tsx`

- Colunas: nº, cliente, chamado, status, técnico, data, preço
- Filtros: status, técnico, período, busca texto
- Badge colorido por status
- Botão Nova OS
- **Paginação** (obrigatório)

### 6.2 `/ordens/nova`
**Rota:** `src/app/(app)/ordens/nova/page.tsx`

Fluxo:
1. Buscar/selecionar cliente (ou criar rápido)
2. Chamado / problema
3. Lista de entrada (equipamento)
4. Atendente / técnico (opcional)
5. Previsão (opcional)
6. Salvar → status `ABERTA` → redirect para detalhe
7. (opcional nesta etapa) botão imprimir entrada

### 6.3 `/ordens/[id]` — detalhe/edição
**Rota:** `src/app/(app)/ordens/[id]/page.tsx`

Seções:
- Cabeçalho: nº, status, datas
- Cliente (link)
- Equipamento (`listaEntrada`)
- Diagnóstico técnico
- Serviço executado
- Resolução
- Valores: custo, preço, lucro (calculado)
- Observações / garantia
- Troca de status (select ou botões de fluxo)
- Ações: Salvar · Imprimir · Marcar pronta · Entregar

### Checklist
- [ ] CRUD OS
- [ ] Status normalizados (enum)
- [ ] `preco`/`custo` como number
- [ ] Número sequencial da OS (counter em `config/counters` ou max+1)
- [ ] Relação `clienteId` obrigatória

### Entregável
Abrir OS, atualizar bancada, concluir.

---

## Etapa 7 — Impressão

### 7.1 `/ordens/[id]/imprimir`
**Rota:** `src/app/(app)/ordens/[id]/imprimir/page.tsx`

Query `?tipo=entrada|os|entrega`

### 3 modelos
| Tipo | Conteúdo |
|------|----------|
| `entrada` | Cliente, equipamento, chamado, data, nº OS, dados loja |
| `os` | Completa: diagnóstico, serviço, valores |
| `entrega` | Resolução, valor, garantia, assinatura |

### Checklist
- [ ] Layout A4 limpo (`print:` Tailwind)
- [ ] `window.print()` ou CSS `@media print`
- [ ] Esconder sidebar na impressão
- [ ] Dados da loja vindos de `config/loja`
- [ ] Botões Imprimir / Voltar (ocultos no print)

### Entregável
Imprimir comprovante de entrada e entrega.

---

## Etapa 8 — `/faturamento`

**Rota:** `src/app/(app)/faturamento/page.tsx`

**Objetivo:** dinheiro (Home = operação; aqui = financeiro).

### KPIs
- Receita / custo / lucro (filtros: dia, semana, mês, ano, custom)
- Comparativo mês atual vs anterior (%)
- Ticket médio
- Lista/tabela de OS do período com totais
- Alerta: OS sem preço ou sem custo

### Checklist
- [ ] Filtro de período
- [ ] Cards financeiros
- [ ] Tabela detalhada
- [ ] Export CSV (opcional, depois)

### Entregável
Ver faturamento do mês com lucro.

---

## Etapa 9 — `/relatorios`

**Rota:** `src/app/(app)/relatorios/page.tsx`

### Relatórios
| Relatório | Métrica |
|-----------|---------|
| Produtividade | tempo médio `dataEmissao` → `dataConclusao` |
| Por status | contagem no período |
| Por técnico | OS + receita |
| Taxa de resolução | % `resolvido === true` |
| Clientes ativos | OS nos últimos 90 dias |

### Checklist
- [ ] Seletor de relatório + período
- [ ] Tabela/gráfico simples
- [ ] Empty states

### Entregável
Pelo menos 2 relatórios: por status e por técnico.

---

## Etapa 10 — Importação dos CSVs

**Rota (admin):** `src/app/(app)/configuracoes/importar/page.tsx`  
ou script: `scripts/import-csv.ts`

### Ordem
1. Importar `clientes.csv` → collection `clientes` (manter `id` antigo como `legacyId`)
2. Importar `os.csv` → `ordens`
3. Resolver vínculo cliente: match por **nome** (normalizado) → `clienteId`
4. Normalizar:
   - status → enum
   - `R$155,00` → `155`
   - datas `dd/mm/yyyy` → Timestamp
5. Criar técnicos únicos a partir dos nomes no CSV

### Checklist
- [ ] Script ou página de import (só admin)
- [ ] Log de erros (cliente não encontrado, data inválida)
- [ ] Idempotência (não duplicar se rodar 2x — usar `legacyId`)
- [ ] Conferir totais: ~680 clientes, ~1450 OS

### Entregável
Dashboard com dados reais.

---

## Etapa 11 — `/tecnicos`

**Rota:** `src/app/(app)/tecnicos/page.tsx`

- Lista técnicos/atendentes
- Criar / editar / ativar-desativar
- Usado nos selects de OS

### Checklist
- [ ] CRUD simples
- [ ] Só mostra `ativo: true` nos formulários de OS

---

## Etapa 12 — `/configuracoes`

**Rota:** `src/app/(app)/configuracoes/page.tsx`

- Dados da loja (nome, CNPJ, telefone, endereço) → impressão
- Garantia padrão (dias)
- (Opcional) gerenciar usuários

### Checklist
- [ ] Form salva em `config/loja`
- [ ] Impressão usa esses dados

---

## Etapa 13 — Polish e produção

### Checklist
- [ ] Loading / empty / error em todas as listas
- [ ] Confirmação antes de deletar / cancelar OS
- [ ] Regras Firestore mais restritas por role
- [ ] Índices compostos no Firestore (filtros de OS)
- [ ] Paginação ou infinite scroll nas listas grandes
- [ ] Favicon / título / meta
- [ ] Deploy (Vercel) + domínio

---

## Ordem resumida (siga nesta sequência)

| # | Página / etapa | Prioridade |
|---|----------------|------------|
| 0 | Fundação Firebase | ✅ base |
| 1 | Types + schema | bloqueante |
| 2 | Login + proteção | bloqueante |
| 2.5 | Import CSV | alta (cedo) |
| 3 | Layout shell | bloqueante |
| 4 | Dashboard KPIs | alta |
| 5 | Clientes CRUD | alta |
| 6 | Ordens CRUD | alta |
| 7 | Impressão | alta |
| 8 | Faturamento | média |
| 9 | Relatórios | média |
| 10 | Import CSV | alta (após CRUD) |
| 11 | Técnicos | média |
| 12 | Configurações | média |
| 13 | Polish / deploy | final |

---

## Definição de “pronto” por página

Uma página só está pronta quando:
1. Rota existe e está no menu
2. Lê/grava Firestore (se aplicável)
3. Tem loading e empty state
4. Não quebra sem dados
5. Funciona no mobile básico

---

## Próximo passo imediato

**Começar pela Etapa 1 (types/schema)** e em seguida **Etapa 2 (login)**.

Quando quiser implementar, diga:  
`vamos fazer a etapa X` — e seguimos só aquela até fechar o checklist.

---

## Design UI

Paleta, componentes e regras visuais: [`docs/DESIGN.md`](./DESIGN.md)  
Regra do Cursor: `.cursor/rules/ui-design.mdc` (aplica em `src/**/*.{tsx,css}`).

## Convenções gerais

### Paginação (obrigatório)
**Todas as tabelas/listagens densas precisam de paginação.**

- Padrão: **20 itens por página**
- Controles: Anterior / Próxima + “1–20 de N”
- **Sempre visível** no rodapé do card (lista rola por dentro; não esconder abaixo do fold)
- Ao filtrar/buscar, resetar para página 1
- Regra do Cursor: `.cursor/rules/tables-pagination.mdc`
- Componente: `src/components/Pagination.tsx`

Listas afetadas: clientes, ordens, técnicos, relatórios/faturamento (quando tabela), e qualquer lista futura.
