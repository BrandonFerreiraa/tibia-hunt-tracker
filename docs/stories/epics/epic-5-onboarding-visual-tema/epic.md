---
id: epic-5
title: Onboarding com Verificação, Registro Só por Analyser, e Refinamento Visual
status: Done
depends_on: epic-4
---

# Epic 5: Onboarding com Verificação, Registro Só por Analyser, e Refinamento Visual — Brownfield Enhancement

## Epic Goal

Tornar o cadastro de personagem parte obrigatória da criação de conta (com verificação real antes de liberar acesso), eliminar o registro manual de hunt (só via Session Analyser), e resolver 3 pontos de qualidade visual: bordas de card pouco visíveis, tela de Meu Profit pouco profissional, e falta de tema claro.

## Epic Description

**Existing System Context:**
- Hoje a conta é criada em `Login.jsx` (email/senha via Supabase Auth) sem nenhum personagem — o cadastro de personagem é um passo totalmente separado, feito depois em Configurações (Story 3.1).
- Verificação de personagem já existe e funciona (`useCharacterVerification.js`): gera código, usuário cola no campo "comment" em tibia.com, RPC `verify_character` confere e marca `verified = true`. Hoje é opcional e fica escondido dentro de Configurações.
- Sincronização de stats (`useCharacterStats.js`, Story 2.2) já busca dados do personagem na TibiaData API **só pelo nome** — o mundo (`world`) vem na resposta da API, não precisa ser digitado pelo usuário.
- `SessionForm.jsx` tem 3 modos: `paste` (cola o analyser), `preview` (revisa campos antes de salvar) e `manual` (preenchimento 100% manual, usado como fallback quando o parser não reconhece o texto colado, ou por escolha direta do usuário no botão "Preencher manualmente").
- `Card.jsx` já tem `border border-border`, mas `--color-border: #24242e` está muito próximo de `--color-surface: #121218` — a borda existe mas é quase invisível.
- `Profit.jsx` (Story 3.5) é funcional mas só lista datas e valores em texto — sem nenhuma visualização gráfica ou hierarquia visual forte.
- `index.css` define só uma paleta de cores (escura), via `@theme` do Tailwind v4 — não existe suporte a tema claro nem mecanismo de troca.

**Enhancement Details:**
- Criação de conta passa a exigir, antes de liberar acesso ao app: nome do personagem → busca automática do mundo via TibiaData → código de verificação gerado → usuário cola no comment → confirma → só então o app libera acesso, já com esse personagem cadastrado e verificado como Principal.
- `SessionForm` perde o modo `manual` por completo — se o texto colado não for reconhecido, o usuário só pode tentar colar de novo (com mensagem de erro clara), nunca preencher os campos do zero.
- `Card.jsx` ganha uma borda com contraste real (visível nos dois temas).
- `Profit.jsx` ganha uma visualização gráfica (ex.: gráfico de barras por dia) e uma hierarquia visual mais forte pro total do período, sem perder nenhuma funcionalidade existente (3 abas, seleção de dia, detalhe).
- App ganha tema claro, com alternância entre claro/escuro persistida por usuário.
- Success criteria: uma conta nova só entra no app depois de ter 1 personagem verificado; não existe mais nenhum caminho de UI pra registrar hunt sem colar o analyser; cards têm borda visível nos dois temas; Meu Profit tem gráfico; alternância de tema funciona e persiste.

## Stories

### Story 5.1 — Onboarding Obrigatório: Personagem Verificado no Cadastro
- **Descrição:** Depois de criar a conta (e confirmar email, se aplicável) e antes de liberar o app, mostrar uma tela de onboarding: campo de nome do personagem → ao confirmar, busca o personagem na TibiaData API (obtém `world` automaticamente) → cria o registro em `characters` (`type = 'principal'`) → gera o código de verificação (reaproveitando `useCharacterVerification`) → instrui a colar no comment → botão "Verificar" chama a mesma RPC `verify_character` já existente → sucesso libera o acesso normal ao app. Se a TibiaData API estiver fora do ar ou o nome não for encontrado, bloqueia com mensagem de erro clara e permite tentar de novo — **sem opção de pular** essa etapa.
- **Executor:** `@dev` · **Quality Gate:** `@architect` (fluxo de gate no App.jsx) + `@ux-design-expert` (clareza dos passos)
- **AC:**
  - Given uma conta recém-criada (ou logada) sem nenhum personagem **verificado** (inclusive se já tiver um personagem criado mas ainda não verificado — ex.: fechou a aba no meio do fluxo), When acessa o app, Then vê a tela de onboarding em vez do Dashboard/nav normal.
  - Given um nome de personagem válido (existe na TibiaData API), When confirmado, Then o personagem é criado como Principal com o `world` preenchido automaticamente, e o código de verificação é exibido com as instruções de colar no comment.
  - Given o código colado corretamente no comment e o usuário clica em "Verificar", When a RPC confirma, Then o personagem fica `verified = true` e o app libera o acesso normal (Dashboard, nav completa).
  - Given um nome de personagem que não existe na TibiaData, When o usuário confirma, Then vê mensagem de erro clara e pode tentar outro nome — sem criar nenhum registro.
  - Given a TibiaData API fora do ar, When o usuário tenta cadastrar, Then vê mensagem de erro orientando tentar novamente mais tarde — sem opção de pular a etapa.
  - Given uma conta que já tem pelo menos 1 personagem **verificado** (contas existentes, ex.: a sua), When faz login, Then **não** vê a tela de onboarding — vai direto pro app normal (compatibilidade com contas já existentes).

### Story 5.2 — Remover Registro Manual de Hunt
- **Descrição:** Remover o modo `manual` do `SessionForm` por completo — o botão "Preencher manualmente" e o fallback automático quando o parser falha. Se o texto colado não for reconhecido, mostrar erro e manter o usuário no modo de colar (com o texto que ele colou preservado no campo, pra ele conferir/corrigir e tentar de novo). O modo `preview` (revisar/corrigir campos já extraídos do analyser antes de salvar) continua existindo — isso não é "entrada manual", é revisão do que o analyser já leu.
- **Executor:** `@dev` · **Quality Gate:** `@architect`
- **AC:**
  - Given a tela de registrar hunt, When carregada, Then não existe nenhum botão ou caminho de UI pra preencher uma sessão do zero sem colar o analyser.
  - Given um texto colado que o parser não reconhece, When o usuário tenta analisar, Then vê uma mensagem de erro clara, com o texto colado preservado no campo pra tentar de novo — sem cair em nenhum formulário manual.
  - Given um texto colado reconhecido com sucesso, When o preview aparece, Then o usuário ainda pode editar os campos numéricos extraídos antes de salvar (comportamento já existente, mantido).

### Story 5.3 — Redesign da Tela Meu Profit
- **Descrição:** Redesenhar `Profit.jsx` pra ficar mais profissional visualmente, mantendo as 3 visões (Diário/Semanal/Mensal), a seleção de dia e o detalhe das hunts do dia. Adicionar uma visualização gráfica do profit por dia (ex.: gráfico de barras) no lugar da lista simples de texto, e dar mais destaque visual ao total do período (hierarquia tipográfica, não só um número no meio de um card genérico).
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given qualquer uma das 3 visões, When exibida, Then o profit por dia aparece numa visualização gráfica (não só texto em lista), mantendo a interação de clicar num dia pra ver o detalhe.
  - Given o total do período, When exibido, Then tem destaque visual claro (tipografia/tamanho/posição), maior que qualquer outro elemento da tela.
  - Given todas as funcionalidades da Story 3.5 (seleção de dia, detalhe com lista de hunts, dia sem hunt = profit 0 sem erro), When testadas após o redesign, Then continuam funcionando exatamente como antes — é uma mudança visual, não funcional.

### Story 5.4 — Tema Claro/Escuro e Bordas de Card Visíveis
- **Descrição:** Adicionar uma paleta de tema claro em `index.css` (ao lado da escura já existente) e um mecanismo de alternância (toggle em Configurações, persistido por usuário — ex.: `localStorage`). Ajustar `--color-border` (ou a borda do `Card.jsx`) pra ter contraste real contra o fundo do card em **ambos** os temas.
- **Executor:** `@dev` · **Quality Gate:** `@ux-design-expert`
- **AC:**
  - Given a tela de Configurações, When o usuário troca o tema (claro/escuro), Then o app inteiro muda de aparência imediatamente, sem precisar recarregar a página.
  - Given o tema escolhido, When o usuário fecha e reabre o app, Then o tema escolhido continua o mesmo (persistido).
  - Given qualquer card do app (personagens, hunts, profit), When exibido em qualquer um dos 2 temas, Then a borda é visualmente perceptível contra o fundo do card (não apenas tecnicamente presente no CSS).

## Compatibility Requirements

- [ ] Contas já existentes (que já têm pelo menos 1 personagem **verificado** — caso de todas as contas reais em uso hoje) não são bloqueadas pelo onboarding. O gate é "zero personagens verificados" (não "zero personagens"), de propósito: se fosse só "zero personagens", alguém que criasse o personagem mas fechasse a aba antes de clicar em "Verificar" escaparia da exigência de verificação ao reabrir o app.
- [ ] Sessões já registradas com `source = 'manual'` (de antes da Story 5.2) continuam existindo e sendo exibidas normalmente — só o caminho de **criar** novas sessões manuais é removido, sem migração de dados.
- [ ] Tema padrão (antes do usuário escolher) continua sendo o escuro atual — ninguém "perde" a aparência que já conhece sem uma ação explícita.

## Risk Mitigation

- **Risco:** TibiaData API fora do ar bloqueia criação de conta nova por completo (onboarding obrigatório, sem skip, por decisão explícita do usuário). **Mitigação:** mensagem de erro clara orientando tentar novamente mais tarde — aceito como trade-off consciente, já que a alternativa (skip) violaria o requisito de "só libera acesso com personagem verificado".
- **Risco:** Usuário engana o app usando o nome de um personagem que não é dele. **Mitigação:** já resolvido pelo mecanismo de verificação existente (só quem tem acesso de escrita ao comment do personagem em tibia.com consegue confirmar).
- **Risco:** Gráfico novo em Meu Profit (Story 5.3) introduzir uma dependência pesada (biblioteca de charting). **Mitigação:** @dev deve avaliar opções leves (ex.: SVG feito à mão pro caso de uso simples de barras, em vez de biblioteca completa) antes de adicionar uma dependência nova ao projeto.
- **Risco:** Paleta de tema claro mal calibrada gerar contraste ruim (texto ilegível). **Mitigação:** @ux-design-expert revisa contraste mínimo (WCAG AA) nos tokens novos antes de aprovar.

## Definition of Done

- [x] Todas as stories com AC atendidos
- [x] Conta nova não acessa o app sem 1 personagem verificado
- [x] Nenhum caminho de UI permite registrar hunt sem colar o analyser
- [x] Cards com borda visível testada nos 2 temas (contraste validado por script, >= 3:1)
- [x] Meu Profit com visualização gráfica, funcionalidade da Story 3.5 preservada
- [x] Alternância de tema funcionando e persistindo (bug de persistência encontrado e corrigido na Story 5.4)

## Status: Done (2026-08-28)

Todas as 4 stories completas: 5.1 (onboarding obrigatório com verificação, com um débito técnico registrado como task separada sobre reload duplicado), 5.2 (registro de hunt só via analyser), 5.3 (Meu Profit redesenhado com gráfico de barras divergente, cores validadas por contraste), 5.4 (tema claro/escuro + bordas corrigidas — um bug real de persistência foi encontrado pelo QA e corrigido antes do Done).

Pendência de infraestrutura: nenhuma migration nova neste epic.
