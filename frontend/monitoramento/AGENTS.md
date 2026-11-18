# AGENTS.md — Diretrizes de Arquitetura e Padrões de Código

Este documento define as regras, padrões arquiteturais e convenções para agentes de IA e desenvolvedores trabalhando neste repositório.

## 1. Stack Tecnológica
- **Build Tool & Dev Server:** Vite
- **Linguagem:** JavaScript Vanilla (ES6+ / ES Modules nativos)
- **Estilização:** Tailwind CSS (Utility-first)
- **Gerenciador de Pacotes:** npm (ou pnpm/yarn conforme lockfile)
- **Proibido:** Não introduzir frameworks de UI (React, Vue, Svelte, Alpine) ou bibliotecas de manipulação de DOM (jQuery) sem solicitação explícita.

---

## 2. Estrutura de Diretórios
Mantenha a separação de responsabilidades seguindo estritamente esta árvore de arquivos:

```text
├── public/                 # Ativos estáticos puros (favicon, robots.txt)
├── src/
│   ├── assets/             # Imagens, fontes e SVGs processados pelo Vite
│   ├── components/         # Componentes de UI reutilizáveis (funções puras ou classes)
│   ├── pages/              # Controladores/views específicos de cada página
│   ├── services/           # Integrações externas (API fetch, LocalStorage, etc.)
│   ├── state/              # Gerenciamento de estado simples (Pub/Sub ou Store)
│   ├── styles/             # Arquivos CSS globais e configuração do Tailwind
│   │   └── main.css        # Contém @tailwind base, components, utilities / @import "tailwindcss"
│   ├── utils/              # Funções utilitárias puras (formatação, validação, helpers de DOM)
│   └── main.js             # Ponto de entrada da aplicação (inicialização)
├── index.html              # HTML principal (referencia /src/main.js)
├── package.json
├── vite.config.js
└── AGENTS.md
```

---

## 3. Diretrizes de JavaScript (Vanilla ES6+)

### 3.1. Modularização e Escopo
- **ES Modules:** Use sempre `import` e `export`. Nunca polua o escopo global (`window`).
- **Responsabilidade Única (SRP):** Cada arquivo deve ter um único propósito claro. Arquivos com mais de 200 linhas devem ser avaliados para refatoração.
- **Nomenclatura:**
  - Arquivos e pastas: `kebab-case.js` (ex: `user-card.js`, `api-service.js`).
  - Funções e variáveis: `camelCase` (ex: `fetchUserData`, `isModalOpen`).
  - Constantes globais/config: `UPPER_SNAKE_CASE` (ex: `API_TIMEOUT_MS`).
  - Classes ou Construtores: `PascalCase`.

### 3.2. Manipulação de DOM e Eventos
- **Seletores Seguros:** Prefira atributos `data-*` (ex: `data-js="submit-btn"`) para ganchos de JavaScript em vez de classes do Tailwind, evitando que mudanças visuais quebrem a lógica.
- **Prevenção de XSS:** Use `textContent` ao inserir texto dinâmico. Só utilize `innerHTML` quando for estritamente necessário renderizar templates HTML e garanta que os dados estejam sanitizados.
- **Performance de Renderização:** Ao inserir múltiplos elementos em loop, utilize `DocumentFragment` para evitar *reflows* sucessivos no DOM.
- **Event Delegation:** Para listas dinâmicas ou múltiplos elementos similares, adicione o `addEventListener` ao elemento pai e verifique `event.target.closest('[data-js="..."]')`.

### 3.3. Padrão de Componentes em Vanilla JS
Componentes em `src/components/` devem ser funções fábrica (*Factory Functions*) que retornam um nó do DOM ou gerenciam um container específico:

```javascript
// Exemplo: src/components/user-card.js
export function createUserCard({ name, role, onSelect }) {
  const article = document.createElement('article');
  article.className = 'p-4 bg-surface rounded-xl shadow-xs border border-border-subtle flex items-center justify-between dark:bg-surface-dark dark:border-border-subtle-dark';

  const infoDiv = document.createElement('div');
  
  const title = document.createElement('h3');
  title.className = 'text-base font-semibold text-ink dark:text-white';
  title.textContent = name;

  const subtitle = document.createElement('p');
  subtitle.className = 'text-sm text-ink-muted dark:text-slate-400';
  subtitle.textContent = role;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'px-3 py-1.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors';
  button.textContent = 'Selecionar';
  button.addEventListener('click', () => onSelect({ name, role }));

  infoDiv.append(title, subtitle);
  article.append(infoDiv, button);

  return article;
}
```

### 3.4. Assincronismo e Tratamento de Erros
- Utilize `async/await` em vez de cadeias `.then()`.
- Envolva chamadas de rede e operações de parse (`JSON.parse`) em blocos `try/catch`.
- Sempre forneça feedback visual na UI para estados de **Loading**, **Empty** e **Error**.

---

## 4. Diretrizes de Tailwind CSS

- **Abordagem Utility-First:** Estilize diretamente nos elementos HTML ou nos templates JS usando classes utilitárias do Tailwind.
- **Evite `@apply`:** Não crie classes CSS customizadas com `@apply` em `main.css`, a menos que seja para estilizar elementos injetados por bibliotecas de terceiros fora do seu controle. Reutilize estilos criando componentes JS em `src/components/`.
- **Design Responsivo (Mobile-First):** Escreva estilos base para telas pequenas e adicione prefixos (`sm:`, `md:`, `lg:`, `xl:`) para telas maiores.
- **Consistência de Tema e Paleta de Cores:** Utilize os tokens semânticos definidos via `@theme` em `src/styles/main.css` combinados com a paleta `teal` do Tailwind para ações primárias e `emerald` / `rose` / `sky` para estados semânticos. Não use valores arbitrários (`w-[342px]`) a menos que seja estritamente necessário.
  - **Fundo (Canvas):** `#F6F8F7` (`bg-canvas`) no modo claro / `#0D1312` (`dark:bg-canvas-dark`) no modo escuro.
  - **Superfícies (Cards e Header):** `#FFFFFF` (`bg-surface`) / `#141D1B` (`dark:bg-surface-dark`).
  - **Bordas:** `#E2E8E5` (`border-border-subtle`) para divisores e cards; `#CBD5D0` (`border-border-input`) para campos de entrada (com equivalentes `-dark`: `#24312E` e `#2D3D39`).
  - **Tipografia:** `#111C19` (`text-ink`) para texto principal e `#52635E` (`text-ink-muted`) para texto secundário.
  - **Ação Primária / Destaque:** Teal (`bg-teal-700`, `hover:bg-teal-800`, `focus-visible:ring-teal-600`; no modo escuro `dark:bg-teal-600`, `dark:hover:bg-teal-500`).
- **Interface Limpa e Direta:** Mantenha textos e rótulos simples, voltados ao usuário final. Não exiba detalhes internos de implementação, protocolos ou tecnologias utilizadas (ex.: OAuth, PKCE, tokens, endpoints ou bibliotecas) na interface.
- **Estados Interativos:** Todo elemento clicável (`button`, `a`, `input`) deve conter estados de `hover:`, `focus-visible:outline-none focus-visible:ring-2` e `disabled:opacity-50 disabled:cursor-not-allowed`.

---

## 5. Acessibilidade (a11y) e HTML Semântico
- Use tags semânticas adequadas (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>`, `<footer>`).
- Use `<button>` para ações na página e `<a>` para navegação de URL. Nunca use `<div onclick="...">`.
- Todos os campos de formulário devem ter um `<label>` associado ou `aria-label`.
- Imagens devem conter o atributo `alt` descritivo (ou `alt=""` se puramente decorativas).
- Modais e menus dropdown devem gerenciar foco e atributos `aria-expanded` / `aria-hidden`.

---

## 6. Integração com Vite
- **Variáveis de Ambiente:** Acesse exclusivamente via `import.meta.env.VITE_NOME_DA_VARIAVEL`.
- **Importação de Assets:** Importe imagens ou SVGs estáticos via ES Modules (`import logoUrl from './assets/logo.svg'`) ou coloque-os na pasta `public/` se precisarem de caminhos absolutos fixos.
- **Caminhos Absolutos:** Se configurado no `vite.config.js`, utilize o alias `@/` apontando para `/src/`.

---

## 7. Fluxo de Trabalho do Agente (Checklist de Execução)
Antes de gerar ou modificar qualquer código, o agente deve:
1. **Verificar a estrutura existente:** Ler os arquivos em `src/utils/` e `src/components/` para não duplicar funções ou componentes já criados.
2. **Manter o código limpo:** Não deixar `console.log` de debug, códigos comentados ou variáveis não utilizadas.
3. **Preservar funcionalidades:** Garantir que refatorações não quebrem seletores `data-js` existentes.
4. **Validar imports:** Certificar-se de que todos os caminhos de `import` incluem a extensão `.js` (ex: `import { formatCurrency } from '../utils/format.js'`) para máxima compatibilidade nativa e no Vite.