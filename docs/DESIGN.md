# Prompt de Design UI/UX — ACTech Dashboard

Fonte de verdade visual do projeto. Aplicar em todas as páginas existentes e futuras.

Crie uma interface **moderna, responsiva, elegante e visualmente sofisticada**, seguindo tendências atuais de UI/UX e priorizando uma excelente experiência tanto em desktop quanto em dispositivos móveis.

## Direção visual

O projeto deve utilizar um **Dark Theme como padrão**, com aparência premium, tecnológica e profissional.

A identidade visual deve ter o **azul como cor primária**, utilizado principalmente para:

* Botões de ação principal
* Links e elementos interativos
* Estados ativos
* Destaques importantes
* Ícones selecionados
* Indicadores de progresso
* Elementos de foco

Evite utilizar azul em excesso. A cor deve funcionar como **accent color**, criando contraste com a interface escura.

### Paleta

Tokens em `src/app/globals.css`:

| Token | Hex | Uso |
|-------|-----|-----|
| Primary | `#3B82F6` | Botões, links, ativos |
| Primary Hover | `#2563EB` | Hover de ação |
| Primary Light | `#60A5FA` | Destaques suaves |
| Background | `#080B12` | Fundo da página |
| Surface | `#0F1420` | Cards / painéis |
| Surface Elevated | `#151C2B` | Dropdowns, modais, header |
| Border | `#222B3D` | Bordas sutis |
| Text Primary | `#F8FAFC` | Títulos e texto principal |
| Text Secondary | `#94A3B8` | Texto de apoio |
| Text Muted | `#64748B` | Placeholders / meta |
| Success | `#22C55E` | Sucesso |
| Warning | `#F59E0B` | Aviso |
| Error | `#EF4444` | Erro |

## Estilo

Transmitir: modernidade, tecnologia, sofisticação, clareza, confiabilidade, minimalismo, produto premium.

Evitar:

* Gradientes exagerados
* Sombras muito fortes
* Excesso de elementos decorativos
* Bordas excessivamente arredondadas
* Cores muito saturadas
* Interfaces poluídas / template genérico
* Cards dentro de cards

Usar espaçamento generoso, hierarquia clara e respiro entre elementos.

## Tipografia

Fonte: **Geist** (já no projeto). Hierarquia clara, texto de apoio com contraste reduzido, line-height confortável, escala responsiva.

## Componentes

Consistência entre buttons, inputs, selects, cards, tables, dropdowns, modals, tooltips, tabs, nav, badges, alerts, empty states, loading states.

Botões primários: azul + estados Normal / Hover / Active / Focus / Disabled / Loading.

Classes utilitárias do projeto:

* `.btn-primary` / `.btn-secondary` / `.btn-ghost`
* `.input-field`
* `.card-surface`
* `.badge` (+ variantes)

## Responsividade

Mobile-first. Menu vira navegação mobile; grids empilham; tabelas com comportamento adequado; touch targets confortáveis.

## Profundidade

`Background → Surface → Elevated Surface` (tons, não sombras pesadas). Glow azul só em elementos realmente importantes, sem estética neon.

## Microinterações

Hover, focus, loading e skeletons — rápidos e sutis.

## Acessibilidade

Contraste adequado, foco visível, não depender só de cor, áreas de toque ok no mobile.

## Regra principal

Parecer um **produto digital moderno de 2026**, limpo, profissional e funcional — não um template genérico.
