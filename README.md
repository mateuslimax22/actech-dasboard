# ACTech Dashboard

Dashboard para loja de manutenção de computadores: clientes, ordens de serviço, impressão e KPIs.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** v4
- **Firebase** Auth + Firestore

> Twind não tem suporte oficial ao App Router do Next.js. Por isso o projeto usa Tailwind CSS (mesmas classes utilitárias).

## Setup

```bash
npm install
cp .env.example .env.local
```

Preencha as variáveis do Firebase no `.env.local` (Console Firebase → Project settings → Your apps).

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
src/
  app/                 # rotas (App Router)
  components/          # UI compartilhada
  contexts/            # AuthContext
  lib/firebase.ts      # app, auth, db
```

## Scripts

| Comando       | Descrição              |
|---------------|------------------------|
| `npm run dev` | Desenvolvimento        |
| `npm run build` | Build de produção    |
| `npm run start` | Sobe build local     |
| `npm run lint`  | ESLint               |
