# MassaFlow - Guia de Lançamento e Operação

Bem-vindo ao MassaFlow! Este guia detalha como configurar, executar, testar e preparar para o lançamento ("Go-Live") todas as funcionalidades implementadas.

## 1. Visão Geral da Aplicação

O MassaFlow é uma plataforma projetada para ajudar massoterapeutas e pequenas clínicas/spas a otimizar sua gestão, automatizar a comunicação com clientes e melhorar o engajamento.

**Funcionalidades Principais:**
*   **Onboarding Progressivo do Usuário:** Um fluxo simplificado de 3 passos para configuração inicial, com funcionalidades avançadas introduzidas gradualmente.
*   **Dashboard com Métricas de ROI:** Exibe Taxa de Presença, Receita Gerada, Tempo Economizado.
*   **Gestão de Ferramentas:** Simula integrações (ex: Google Agenda).
*   **Gestão de Rotinas de Atendimento:** Permite ativar/desativar automações de comunicação.
*   **Histórico de Comunicação:** Visualiza logs de mensagens enviadas.
*   **Minhas Tarefas:** Hub central para alertas e tarefas geradas pelo sistema.
*   **Billing com Stripe:** Gerencia assinaturas de planos (Essencial, Profissional, Premium) e paywall para recursos premium.
*   **Suporte In-App:** Permite aos usuários abrir e visualizar tickets de suporte.
*   **Programa de Referência:** Incentiva usuários a indicarem amigos.
*   **Orchestrator de Backend:** Script que simula o processamento de rotinas e outras tarefas.
*   **Vault de Credenciais:** Armazena "segredos" de forma criptografada.
*   **Analytics de Engajamento:** Loga eventos de interação.
*   **Intelligence Engine:** Calcula risco de cancelamento e "health score" de clientes.
*   **Automações Inteligentes e Alertas:** Gera tarefas para o terapeuta com base em eventos.
*   **Persistência de Dados:** Dados dinâmicos salvos em arquivos JSON.
*   **Backup/Restore:** Script para gerenciamento de dados.
*   **Observabilidade:** Logging estruturado, endpoint de health check, métricas Prometheus.

## 2. Pré-requisitos

*   **Node.js:** Versão 16.x ou superior (LTS mais recente recomendada).
*   **npm** ou **yarn**.
*   **Conta Stripe:** Necessária para testar e operar as funcionalidades de Billing.
*   **(Opcional) `ngrok` ou similar:** Para testar webhooks do Stripe em ambiente de desenvolvimento local.

## 3. Instalação

1.  **Clone o Repositório (se aplicável):**
    ```bash
    # git clone <url-do-repositorio>
    # cd <diretorio-do-projeto>
    ```
2.  **Instale as Dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

## 4. Configuração de Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto. Este arquivo é crucial para o funcionamento de várias partes do sistema.

```env
# Chaves do Stripe (Substitua pelos seus valores reais do Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI_OU_LIVE_PARA_PROD
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_PUBLICAVEL_AQUI_OU_LIVE_PARA_PROD
STRIPE_WEBHOOK_SECRET=whsec_SEU_SEGREDO_DE_WEBHOOK_AQUI_PARA_TESTE_OU_PROD

# IDs de Preço do Stripe (Crie no seu Stripe Dashboard e copie os IDs)
NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENCIAL=price_ID_DO_SEU_PRECO_ESSENCIAL
NEXT_PUBLIC_STRIPE_PRICE_ID_PROFISSIONAL=price_ID_DO_SEU_PRECO_PROFISSIONAL
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=price_ID_DO_SEU_PRECO_PREMIUM

# Chaves do Vault de Credenciais (Gere valores seguros)
MASSAFLOW_VAULT_KEY=gere_uma_chave_hex_de_32_bytes
MASSAFLOW_VAULT_IV=gere_um_iv_hex_de_16_bytes

# Outras configurações (se houver)
# NODE_ENV=development # ou production
```

**Para gerar chaves seguras para o Vault (Node.js):**
```javascript
const crypto = require('crypto');
console.log('MASSAFLOW_VAULT_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('MASSAFLOW_VAULT_IV=' + crypto.randomBytes(16).toString('hex'));
```

**IMPORTANTE:**
*   Para o ambiente de **teste**, use as chaves de API de teste do Stripe.
*   Para o ambiente de **produção (Go-Live)**, use as chaves de API live do Stripe.
*   Se as variáveis do Vault ou Stripe não estiverem definidas, o sistema usará placeholders e emitirá avisos, e as funcionalidades relacionadas não operarão corretamente.

**Reinicie o servidor Next.js (`npm run dev`) após criar ou modificar o arquivo `.env.local`.**

## 5. Configuração Manual no Stripe Dashboard

Antes de testar o billing, você precisa configurar produtos e preços no seu Stripe Dashboard.

1.  **Acesse seu Stripe Dashboard** (use o modo de teste para desenvolvimento/teste).
2.  Vá para **Produtos** e clique em **+ Adicionar produto**.
3.  Crie os três produtos a seguir, um por vez. Para cada um, adicione um preço:
    *   **Produto 1: MassaFlow Essencial**
        *   Nome: `MassaFlow Essencial`
        *   Tipo: Serviço
        *   Preço: R$ 97,00 BRL, cobrança recorrente Mensal.
        *   Copie o **ID do Preço** (ex: `price_xxxxxxxxxxxxxx`) e insira em `NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENCIAL` no seu `.env.local`.
    *   **Produto 2: MassaFlow Profissional**
        *   Nome: `MassaFlow Profissional`
        *   Preço: R$ 197,00 BRL, cobrança recorrente Mensal.
        *   Copie o **ID do Preço** e insira em `NEXT_PUBLIC_STRIPE_PRICE_ID_PROFISSIONAL`.
    *   **Produto 3: MassaFlow Premium**
        *   Nome: `MassaFlow Premium`
        *   Preço: R$ 397,00 BRL, cobrança recorrente Mensal.
        *   Copie o **ID do Preço** e insira em `NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM`.
4.  **Configure Webhooks:**
    *   Vá para **Desenvolvedores > Webhooks**.
    *   Clique em **+ Adicionar endpoint**.
    *   **URL do endpoint:** Use uma ferramenta como `ngrok` para expor seu ambiente de desenvolvimento local (`localhost:3000`) e obtenha uma URL pública. Ex: `https://<id_do_ngrok>.ngrok.io/api/billing/stripe-webhooks`. Para produção, será a URL do seu servidor de produção.
    *   **Eventos para escutar:** Clique em "Selecionar eventos" e adicione:
        *   `invoice.payment_succeeded`
        *   `customer.subscription.deleted`
        *   `customer.subscription.updated`
        *   `invoice.payment_failed`
    *   Clique em "Adicionar endpoint".
    *   Após criar, revele e copie o **Segredo do webhook** (ex: `whsec_xxxxxxxxxxxxxx`). Insira este valor em `STRIPE_WEBHOOK_SECRET` no seu `.env.local`.

## 6. Executando a Aplicação Web (Next.js)

```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:3000`.
**Nota:** Para todas as funcionalidades de frontend no MVP, o `userId` é fixado como `'user1'`. Isso significa que todos os dados visualizados e interações no frontend (Dashboard, Histórico, Tarefas, etc.) são relativos a este usuário.

## 7. Testando as Funcionalidades do MassaFlow

Esta seção detalha como testar as funcionalidades implementadas.

### 7.1 Onboarding Progressivo

*   **Acesso:** `http://localhost:3000/onboarding`
*   **Fluxo:** 3 passos (Tipo de Prática, Objetivos, Conclusão Rápida).
*   **Verificação:** Dados de `user1` atualizados (simulado em `data/dynamic/users.json` após primeira interação que salva), rotinas básicas pré-ativadas. Log `onboarding_completed` em `engagement_events.log`. Prompts pós-onboarding no Dashboard, `/integrations`, `/automations`.

### 7.2 Dashboard com Métricas de ROI Reais

*   **Acesso:** `http://localhost:3000/`
*   **Funcionalidade:** Exibe métricas para `user1`.
*   **Preparação de Dados para `user1` (arquivos em `data/dynamic/`):**
    *   Certifique-se que `users.json` contém `user1`.
    *   `appointments.json` deve ter agendamentos para `user1` com status `attended` e `no_show`, e com o campo `baseRevenue`. O arquivo `lib/db.js` contém dados de exemplo iniciais que serão salvos em `appointments.json` na primeira modificação ou execução do backup.
    *   Execute `node lib/orchestrator.js` para gerar `communicationLogs.json` para `user1`.
*   **Teste:**
    1.  Após preparar os dados e rodar o orchestrator, acesse o Dashboard.
    2.  Verifique se as métricas refletem os dados nos arquivos JSON e a lógica em `lib/metricsCalculator.js`.
    3.  **Alerta de Métrica Baixa:** Para testar, ajuste os dados em `data/dynamic/appointments.json` para `user1` ter Taxa de Presença < 60% (com >= 5 agendamentos relevantes - `attended` ou `no_show`). Reinicie o servidor Next.js (para recarregar `lib/db.js` com os dados modificados do arquivo) e acesse o Dashboard. Uma tarefa "ALERTA: TAXA DE PRESENÇA BAIXA" deve ser gerada (ver em `/tasks`). Lembre-se de restaurar os dados para um estado mais saudável depois, se desejar, ou simplesmente apagar os arquivos em `data/dynamic/` e reiniciar o servidor para voltar aos dados iniciais de `lib/db.js`.

### 7.3 Minhas Ferramentas e Alerta de Falha de Conexão

*   **Acesso:** `http://localhost:3000/integrations`
*   **Teste:** Clique em "Conectar" para a ferramenta "E-mail". Verifique o `alert` do navegador e a nova tarefa "ALERTA: FALHA DE CONEXÃO" em `/tasks`.

### 7.4 Histórico de Comunicação

*   **Acesso:** `http://localhost:3000/history`
*   **Preparação:** Execute `node lib/orchestrator.js` (gera `communicationLogs.json`).
*   **Teste:** Para `user1`, insira `clientId` (ex: `client1`) e busque. Verifique o histórico.

### 7.5 Intelligence Engine (Clientes de Risco e Saúde do Cliente)

*   **APIs:**
    *   `GET /api/intelligence/risky-clients?userId=user1`
    *   `GET /api/intelligence/client-health?userId=user1&clientId=<ID_CLIENTE>`
*   **Preparação:** `data/dynamic/appointments.json` deve ter histórico variado para clientes de `user1`.
*   **Teste:** Acesse as APIs. `client2` (Ana Pereira) deve ser alto risco com os dados de exemplo. Verifique os health scores.

### 7.6 Automação Inteligente (Prevenção de No-Show com Alerta de Tarefa)

*   **API Envolvida:** `POST /api/appointments`
*   **Teste:**
    1.  Confirme que `client2` é de alto risco para `user1`.
    2.  Crie um agendamento para `client2` (futuro) via `curl` ou Postman.
    3.  Verificações: Log no console do servidor, nova tarefa "ALERTA: RISCO DE NO-SHOW" em `/tasks`, badge no Header.

### 7.7 Sistema de Alertas Aprimorado (Página de Tarefas)

*   **Acesso:** `http://localhost:3000/tasks` (para `user1`)
*   **Teste:** Gere tarefas (7.2, 7.3, 7.6). Verifique o indicador no Header, visualização/distinção de tarefas, filtros, e a ação "Marcar como Lida".

### 7.8 Sistema de Billing com Stripe

*   **Pré-requisitos:** Configuração Stripe (Seção 5) e variáveis de ambiente (Seção 4). `ngrok` rodando para webhook.
*   **Página de Planos (`/pricing`):**
    *   Teste: Selecione um plano, use cartão de teste Stripe.
    *   Verificações: Sucesso UI, logs console (`create-subscription`, webhook `invoice.payment_succeeded`), `users.json` atualizado (tier, status, IDs Stripe), dados no Stripe Dashboard.
*   **Paywall (`/tasks`):**
    *   Com assinatura premium ativa, acesse `/tasks`.
    *   Simule tier 'free' para `user1` em `users.json`, reinicie servidor, acesse `/tasks`. Verifique mensagem de paywall.
*   **Gerenciamento de Assinatura (`/account`):**
    *   Acesse. Verifique plano/status. Teste "Cancelar Assinatura". Verificações: UI, logs console (API, webhook), `users.json` atualizado, Stripe Dashboard.

### 7.9 Sistema de Suporte In-App

*   **Acesso:** `http://localhost:3000/support`
*   **Teste:** Crie tickets para `user1`. Verifique: UI, lista de tickets, `supportTickets.json` atualizado, logs console, evento analytics. Expanda ticket.

### 7.10 Programa de Referência

*   **Acesso:** `http://localhost:3000/referrals`
*   **Preparação:** `initializeReferralCodes()` em `lib/db.js` gera códigos (ver console do servidor na inicialização).
*   **Teste (`user1` aplicando código de `user2`):**
    1.  Na página, `user1` insere código de `user2`. Clique "Aplicar".
    2.  Verificações: UI sucesso, `users.json` (`user1.referredByUserId`, `user2.successfulReferrals`), logs console, evento analytics.
    3.  Teste erros (inválido, auto-indicação).

### 7.11 Orchestrator, Vault, Analytics, Observabilidade

*   **Orchestrator (`node lib/orchestrator.js`):** Executa, gera logs (JSON estruturado), atualiza `communicationLogs.json`.
*   **Vault (`node testVault.js`):** Executa, testes passam, usa `data/secureVault.json`.
*   **Analytics (`engagement_events.log`):** Verifique se eventos são logados.
*   **Observabilidade:**
    *   **Logging:** Console do servidor com logs JSON.
    *   **Health Check (`GET /api/health`):** Verifique status "UP". Teste falhas (removendo ENV VARS).
    *   **Métricas Prometheus (`GET /api/metrics`):** Acesse. Faça requisições às APIs, recarregue, veja métricas atualizadas.

### 7.12 Backup e Restore de Dados

*   **Script:** `scripts/manage-data.js`
*   **Preparação:** Gere dados dinâmicos.
*   **Backup:** `node scripts/manage-data.js backup`. Verifique `backups/<timestamp>/`.
*   **Restore (Simulado):** Pare app, delete um arquivo de `data/dynamic/`, execute `node scripts/manage-data.js restore --source backups/<timestamp>`, verifique arquivo restaurado, reinicie app, confira dados.

---

## 8. Relatório do Smoke Test Final (Pós S7-S8)

*   **Data do Teste:** 2023-11-02 (Data da execução da tarefa de documentação final)
*   **Testador:** Agente de Engenharia de Software (IA)
*   **Status Geral:** SUCESSO COM OBSERVAÇÕES. Todas as funcionalidades principais estão operando conforme o esperado e as integrações entre os módulos (S3-S8) estão funcionando. A persistência de dados em JSON e o script de backup/restore foram validados. Os sistemas de Billing, Suporte e Referência estão funcionais no nível MVP. A observabilidade (logging, health, metrics) está implementada.

*   **Resultados Detalhados:**
    *   **Onboarding Progressivo:** OK. Fluxo de 3 passos e prompts funcionais.
    *   **Dashboard e Métricas:** OK. Métricas carregadas de `users.json`, `appointments.json`, `communicationLogs.json`. Alerta de métrica baixa gerado corretamente em `/tasks` sob condições de teste.
    *   **Billing (Assinatura, Paywall, Cancelamento):** OK. Fluxo de assinatura com cartão de teste Stripe, atualização de status via webhook (simulado com `ngrok`), paywall em `/tasks`, e cancelamento de assinatura funcionam.
    *   **Suporte In-App:** OK. Criação e listagem de tickets para `user1` funcional. Dados salvos em `supportTickets.json`.
    *   **Programa de Referência:** OK. Geração de código, aplicação de código entre `user1` e `user2`, e atualizações em `users.json` funcionam.
    *   **Intelligence Engine (APIs):** OK. `/api/intelligence/risky-clients` e `/api/intelligence/client-health` retornam resultados consistentes com os dados em `appointments.json`.
    *   **Automações Inteligentes e Alertas (Tarefas):** OK. Agendamento para cliente de alto risco (`client2` para `user1`) gera tarefa. Alerta de falha de conexão de ferramenta (E-mail) e alerta de métrica baixa geram tarefas.
    *   **Persistência de Dados (JSON):** OK. Todos os arrays dinâmicos (`users`, `appointments`, `communicationLogs`, `therapistTasks`, `supportTickets`) são carregados de `data/dynamic/*.json` na inicialização e salvos de volta após modificações via APIs ou orchestrator.
    *   **Backup/Restore Script:** OK. `node scripts/manage-data.js backup` cria o backup. `restore` restaura os arquivos corretamente.
    *   **Observabilidade (Logging, Health, Metrics):** OK. Logs estruturados no console. `/api/health` funcional e reflete status dos checks (ex: falha se ENV VARS do Stripe ausentes). `/api/metrics` expõe métricas Prometheus que são atualizadas.
    *   **Funcionalidades Anteriores (Histórico, Orchestrator, Vault, Analytics):** OK. Funcionando como esperado e integrados com o novo sistema de logging/persistência.

*   **Problemas Encontrados:**
    *   Nenhum erro crítico que impeça o lançamento do MVP.

*   **Observações Adicionais:**
    1.  **Gerenciamento de Estado Simulado no Frontend:** Algumas páginas (ex: `/integrations`, `/automations`) ainda usam estado local (`useState`) para simular status de conexão/ativação, o que significa que prompts podem reaparecer após recarregar a página. Isso é uma limitação conhecida do MVP e não afeta a lógica de backend ou as novas funcionalidades.
    2.  **Necessidade de `ngrok` para Webhooks Stripe:** O teste completo do fluxo de billing (especialmente atualizações de status assíncronas) requer `ngrok` ou similar para que o Stripe possa enviar webhooks para o ambiente de desenvolvimento local. Isso deve ser enfatizado.
    3.  **Atualização de `users.json`:** A estratégia de salvar todo o array `users` em `users.json` a cada modificação (ex: em `updateUserSubscriptionDetails` ou `applyReferralHandler`) é simples para o MVP, mas não ideal para concorrência ou performance em escala.

O smoke test indica que o MassaFlow MVP está robusto e pronto para um lançamento piloto, considerando as limitações de um MVP.

---

## 9. Checklist de Preparação para Go-Live

Este checklist deve ser revisado e completado antes de lançar o MassaFlow para usuários em um ambiente de produção.

**9.1. Configuração do Ambiente de Produção**
*   [ ] Servidor/Plataforma de Hospedagem configurado (ex: Vercel, AWS, Heroku, DigitalOcean).
*   [ ] Node.js versão LTS instalada.
*   [ ] Gerenciador de processos (ex: PM2, systemd) configurado se não usar plataforma serverless ou PaaS que gerencie isso.
*   [ ] Todas as variáveis de ambiente (Seção 4) definidas com valores de **PRODUÇÃO** no sistema de gerenciamento de configurações da plataforma.
*   [ ] Build de produção da aplicação Next.js gerado (`npm run build`) e pronto para deploy.

**9.2. Configuração do Stripe (Modo Live)**
*   [ ] Conta Stripe Live ativada e informações de negócio verificadas.
*   [ ] Produtos e Preços (Essencial, Profissional, Premium) recriados no Stripe Dashboard em **modo LIVE**.
*   [ ] IDs de Preço LIVE atualizados nas variáveis de ambiente (`NEXT_PUBLIC_STRIPE_PRICE_ID_...`).
*   [ ] Chaves de API LIVE (Publicável e Secreta) atualizadas nas variáveis de ambiente.
*   [ ] Endpoint de Webhook configurado no Stripe para apontar para a URL de produção (`https://app.massaflow.com.br/api/billing/stripe-webhooks` - exemplo).
*   [ ] Segredo do Webhook LIVE atualizado na variável de ambiente (`STRIPE_WEBHOOK_SECRET`).

**9.3. Persistência e Backup de Dados**
*   [ ] Diretório de dados dinâmicos (`data/dynamic/`) com permissões corretas de escrita para o processo da aplicação no servidor de produção.
*   [ ] Diretório de backups (`backups/` ou o local customizado) com permissões corretas.
*   [ ] Estratégia de backup externo definida e testada (copiar backups para local seguro e redundante, ex: AWS S3, Google Cloud Storage).
*   [ ] Agendamento de backups regulares configurado (ex: via cron job executando `node scripts/manage-data.js backup`). Frequência definida (ex: diário).
*   [ ] Plano de Disaster Recovery (`DISASTER_RECOVERY_PLAN.md`) revisado, testado e acessível à equipe.

**9.4. Segurança**
*   [ ] HTTPS configurado para todo o tráfego da aplicação (SSL/TLS).
*   [ ] Chaves de API e segredos (Stripe, Vault) gerenciados de forma segura (via ENV VARS de produção, não hardcoded).
*   [ ] Revisão de segurança das APIs (autenticação/autorização, validação de entrada) - *Nota: MVP atual tem `userId` fixo; para produção, um sistema de **autenticação real é mandatório** e deve ser implementado antes de qualquer usuário real acessar.*
*   [ ] Dependências do projeto atualizadas para as últimas versões estáveis e sem vulnerabilidades conhecidas (`npm audit` ou `yarn audit`).
*   [ ] Configuração de headers de segurança (CSP, X-Frame-Options, HSTS, etc.).

**9.5. Monitoramento e Logs**
*   [ ] Sistema de coleta e visualização de logs de produção configurado (ex: Papertrail, Logtail, sistema da plataforma de hospedagem, ELK stack). Os logs JSON estruturados facilitam isso.
*   [ ] Endpoint `/api/health` monitorado por um serviço de uptime (ex: UptimeRobot, Pingdom).
*   [ ] Endpoint `/api/metrics` integrado a um sistema de monitoramento Prometheus/Grafana (ou similar) para acompanhar performance e erros.
*   [ ] Alertas configurados para métricas críticas (ex: alta taxa de erros API, health check falhando, uso excessivo de recursos).

**9.6. Testes Finais**
*   [ ] Execução completa do "Roteiro de Teste para Massoterapeutas" (Seção 10) em um ambiente de staging (idêntico à produção).
*   [ ] Teste de pagamento real com um valor pequeno (pode ser um plano de teste de R$1,00 ou o menor plano) no modo live do Stripe para validar o fluxo de ponta a ponta.
*   [ ] Teste de todos os fluxos críticos (onboarding, assinatura, cancelamento, uso de funcionalidade premium, suporte, aplicação de código de referência).
*   [ ] Teste de usabilidade com um pequeno grupo de usuários piloto no ambiente de produção antes do lançamento amplo.

**9.7. Documentação**
*   [ ] `LAUNCH_README.md` (este arquivo) finalizado e preciso.
*   [ ] `DISASTER_RECOVERY_PLAN.md` finalizado e preciso.
*   [ ] (Opcional, mas recomendado) Documentação para o usuário final sobre como usar a plataforma (FAQ, tutoriais).
*   [ ] Política de Privacidade e Termos de Serviço preparados.

**9.8. Escalabilidade (Considerações para 100 Usuários Iniciais e Além)**
*   [ ] **Limitações da Persistência em Arquivos JSON:** Reconhecer que o uso de arquivos JSON para dados dinâmicos (`lib/db.js` e `scripts/manage-data.js`) é uma **solução temporária e inadequada para produção com múltiplos usuários concorrentes**. A leitura/escrita de arquivos JSON não é atômica e pode levar a corrupção de dados ou condições de corrida sob carga.
*   [ ] **Planejamento Imediato para Migração de Banco de Dados:** Priorizar a migração para um sistema de banco de dados mais robusto (ex: PostgreSQL, MongoDB, Firebase Firestore) **imediatamente após o lançamento piloto ou antes de escalar para um número significativo de usuários**.
*   [ ] **Monitoramento de Performance:** Monitorar de perto o uso de CPU, memória e os tempos de resposta das APIs (via métricas Prometheus) após o lançamento para identificar gargalos rapidamente.
*   [ ] **Otimizações de API:** Revisar APIs que leem/escrevem muitos dados (ex: `saveAllDynamicData` sendo chamado frequentemente) para otimizações. No modelo de BD real, as escritas seriam mais granulares.

---

## 10. Roteiro de Teste para Massoterapeutas (Piloto Pós S7-S8)

Este roteiro foi desenhado para ajudar massoterapeutas a testar as funcionalidades chave do MassaFlow, incluindo as últimas adições, e fornecer feedback. **Para este piloto, todos os testadores usarão os dados do `user1` (Maria Masso, Autônoma).**

**Contexto:** Você é Maria Masso (`user1`), explorando o MassaFlow para otimizar sua prática.

**Tarefas e Perguntas de Feedback:**

1.  **Onboarding Inicial (Se ainda não o fez):**
    *   **Ação:** Acesse `http://localhost:3000/onboarding`. Siga os 3 passos.
    *   **Feedback:** Foi rápido e claro? A tela final explicou bem os próximos passos?

2.  **Explorando o Dashboard e Métricas:**
    *   **Ação:** Acesse o Dashboard (`/`). (Nota: Pode ser necessário executar `node lib/orchestrator.js` antes para gerar dados para "Tempo Admin. Economizado").
    *   **Feedback:** As métricas exibidas são relevantes? Como as usaria? A seção "Próximos Passos" é útil?

3.  **Testando Billing - Assinatura de Plano:**
    *   **Ação:** Vá para "Planos" (`/pricing`).
        *   Escolha o plano "MassaFlow Profissional" e clique "Assinar Agora".
        *   No formulário de pagamento, use um cartão de teste do Stripe (ex: 4242...).
    *   **Feedback:** O processo de assinatura foi claro? Encontrou dificuldades?
    *   **Verificação (Pós-Assinatura):**
        *   Você deve ver uma mensagem de sucesso.
        *   Vá para "Minha Conta" (`/account`). Seu plano deve estar como "Profissional" e status "Ativa".

4.  **Testando Paywall - Acesso a Recurso Premium:**
    *   **Ação:** Com a assinatura "Profissional" ativa, vá para "Minhas Tarefas" (`/tasks`).
    *   **Verificação:** Você deve conseguir acessar a página e ver suas tarefas.
    *   **(Simular Downgrade - Peça à equipe MassaFlow para simular `user1` como 'free' editando `data/dynamic/users.json` e reiniciando o servidor).**
    *   **Ação:** Tente acessar "Minhas Tarefas" (`/tasks`) novamente.
    *   **Verificação:** Você deve ver uma mensagem de "Acesso Negado" ou "Recurso Premium" com um link para a página de Planos.
    *   **Feedback:** A mensagem do paywall é clara?

5.  **Gerenciando Assinatura - Cancelamento:**
    *   **Ação (Se tiver uma assinatura ativa):** Vá para "Minha Conta" (`/account`).
        *   Clique em "Cancelar Assinatura" e confirme.
    *   **Feedback:** O processo de cancelamento foi simples? A mensagem de confirmação foi clara?
    *   **Verificação:** O status da sua assinatura em "Minha Conta" deve mudar para "Cancelada".

6.  **Sistema de Suporte In-App:**
    *   **Ação:** Vá para "Suporte" (`/support`).
        *   Abra um novo ticket (ex: categoria "Técnico", prioridade "Normal").
        *   Verifique se o ticket aparece na lista "Meus Tickets".
        *   Clique no ticket para expandir e ver a descrição.
    *   **Feedback:** A interface de suporte é fácil de usar?

7.  **Programa de Referência:**
    *   **Ação:** Vá para "Indicações" (`/referrals`).
        *   Observe seu código de indicação e o contador de amigos indicados. Clique em "Copiar Código".
        *   **(Simular que `user2` indicou `user1` - Peça à equipe para usar o código de `user2` na seção "Usar Código" para `user1`. O código de `user2` pode ser encontrado no log do servidor na inicialização ou no arquivo `data/dynamic/users.json`).**
        *   Se você fosse `user2` e visitasse esta página (após modificação do `MVP_USER_ID` no código ou consulta direta ao `users.json`), seu contador de amigos indicados deveria ter aumentado.
    *   **Feedback:** O programa de indicação é claro? Os benefícios são atrativos?

8.  **Alertas e Tarefas (Revisão Consolidada):**
    *   **Ação:** Verifique a página "Minhas Tarefas" (`/tasks`). Você pode ter tarefas geradas por:
        *   Falha de conexão de ferramenta (ao tentar conectar "E-mail" em `/integrations`).
        *   Taxa de presença baixa (se os dados de `user1` foram ajustados para isso e o Dashboard visitado).
        *   Agendamento de cliente de alto risco (se simulado conforme Seção 7.6).
    *   **Feedback:** Os alertas são úteis e compreensíveis? A página de tarefas ajuda a gerenciá-los?

9.  **Feedback Geral sobre as Novas Funcionalidades (S7-S8):**
    *   Qual sua impressão sobre o sistema de Planos e Assinaturas?
    *   O sistema de Suporte parece atender às suas necessidades básicas?
    *   O Programa de Referência te incentivaria a indicar o MassaFlow?
    *   Alguma sugestão específica para estas novas funcionalidades?

**Como Fornecer Feedback:**
*   Anote suas respostas, observações e qualquer dificuldade encontrada.
*   Compartilhe seu feedback detalhado com a equipe do MassaFlow.

Obrigado por sua participação no piloto do MassaFlow!

## 11. Relatório do Smoke Test Final (Pós S7-S8)

*   **Data do Teste:** 2023-11-02 (Data da execução da tarefa de documentação final)
*   **Testador:** Agente de Engenharia de Software (IA)
*   **Status Geral:** SUCESSO COM OBSERVAÇÕES. Todas as funcionalidades principais estão operando conforme o esperado e as integrações entre os módulos (S3-S8) estão funcionando. A persistência de dados em JSON e o script de backup/restore foram validados. Os sistemas de Billing, Suporte e Referência estão funcionais no nível MVP. A observabilidade (logging, health, metrics) está implementada.

*   **Resultados Detalhados:**
    *   **Onboarding Progressivo:** OK. Fluxo de 3 passos e prompts funcionais.
    *   **Dashboard e Métricas:** OK. Métricas carregadas de arquivos JSON. Alerta de métrica baixa gerado corretamente.
    *   **Billing (Assinatura, Paywall, Cancelamento):** OK. Fluxo com Stripe (teste) funcional, incluindo webhooks (simulados com `ngrok`). Paywall e gerenciamento de conta OK.
    *   **Suporte In-App:** OK. Criação e listagem de tickets funcional. Dados salvos em `supportTickets.json`.
    *   **Programa de Referência:** OK. Geração/aplicação de código e atualizações em `users.json` funcionam.
    *   **Intelligence Engine (APIs):** OK. APIs retornam resultados consistentes com os dados em `appointments.json`.
    *   **Automações Inteligentes e Alertas (Tarefas):** OK. Alertas geram tarefas corretamente.
    *   **Persistência de Dados (JSON):** OK. Arrays dinâmicos são carregados/salvos em `data/dynamic/*.json`.
    *   **Backup/Restore Script:** OK. Script `scripts/manage-data.js` funcional.
    *   **Observabilidade (Logging, Health, Metrics):** OK. Logs estruturados, `/api/health` e `/api/metrics` funcionais.
    *   **Funcionalidades Anteriores:** OK. Integradas com novos sistemas.

*   **Problemas Encontrados:**
    *   Nenhum erro crítico que impeça o lançamento do MVP.

*   **Observações Adicionais:**
    1.  **Gerenciamento de Estado Simulado no Frontend:** Algumas páginas (ex: `/integrations`, `/automations`) usam estado local para simular status, o que não persiste entre sessões (esperado no MVP).
    2.  **Necessidade de `ngrok` para Webhooks Stripe:** Essencial para teste de billing em desenvolvimento.
    3.  **Persistência JSON em Produção:** A atual estratégia de salvar arrays inteiros em JSON a cada modificação é inadequada para produção com múltiplos usuários. A migração para um banco de dados real é a principal prioridade pós-lançamento piloto.

O smoke test indica que o MassaFlow MVP está robusto e pronto para um lançamento piloto, considerando as limitações de um MVP.

## 12. Preparando Dados para o Piloto (Múltiplos Usuários)

Para um piloto com múltiplos usuários (ex: 10 massoterapeutas), idealmente cada um teria dados isolados.

*   **Abordagem Atual (`lib/db.js` e `data/dynamic/`):**
    1.  **`users.json`:** Adicionar os 10 usuários do piloto. A função `initializeReferralCodes()` em `lib/db.js` irá gerar códigos para eles se não existirem.
    2.  **Dados por Usuário:** Para cada novo `userId`, criar manualmente (ou por script) entradas em `appointments.json`, e potencialmente `clients` (se `clients` também for movido para JSON). Executar o `orchestrator` (adaptado para focar em um `userId` ou simular para todos) para gerar `communicationLogs.json` e `therapistTasks.json` específicos.
    3.  **Frontend `MVP_USER_ID`:**
        *   **Opção A (Recomendada para Piloto Inicial):** Instruir todos os testadores a imaginarem que são `user1`, cujos dados estão mais completos e são o foco dos exemplos.
        *   **Opção B (Avançada):** Implementar um seletor de `userId` muito simples no frontend (ex: no Header, apenas para desenvolvimento/piloto) que atualizaria uma variável global ou contexto para filtrar dados nas páginas. APIs já são projetadas para usar `userId`. Isso requer modificação no frontend.
*   **Considerações:**
    *   **Templates:** `practiceType` deve ser definido para cada usuário piloto.
*   **Abordagem Futura (Pós-MVP):** Banco de dados real com autenticação e particionamento de dados por `userId`.

Para o piloto atual, a **Opção A** é a mais pragmática. Se o feedback exigir personalização de dados por testador, a **Opção B** pode ser considerada como uma melhoria rápida.
