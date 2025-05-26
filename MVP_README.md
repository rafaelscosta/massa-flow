# MassaFlow MVP - Guia de Execução e Teste

Bem-vindo ao MVP (Minimum Viable Product) do MassaFlow! Este guia detalha como configurar, executar e testar as funcionalidades implementadas.

## Visão Geral do MVP

O MassaFlow MVP foca em:
1.  **Onboarding Progressivo do Usuário:** Um fluxo simplificado de 3 passos para configuração inicial, com funcionalidades avançadas introduzidas gradualmente.
2.  **Telas Principais:**
    *   **Painel de Resultados:** Exibe métricas de ROI reais (Taxa de Presença, Receita Gerada, Tempo Economizado).
    *   **Minhas Ferramentas:** Gerencia integrações com ferramentas externas (simulado, com simulação de falha para alertas).
    *   **Rotinas de Atendimento:** Permite ativar/desativar rotinas de comunicação.
    *   **Histórico de Comunicação:** Visualiza logs de mensagens enviadas.
    *   **Minhas Tarefas:** Hub central para alertas e tarefas geradas pelo sistema.
3.  **Orchestrator de Backend:** Script que simula o processamento de rotinas de comunicação e registra logs.
4.  **Vault de Credenciais:** Sistema básico para armazenar "segredos" de forma criptografada.
5.  **Analytics de Engajamento:** Sistema simples para logar eventos de interação.
6.  **Intelligence Engine Básico:** Calcula risco de cancelamento e "health score" de clientes.
7.  **Automações Inteligentes e Alertas:** Gera tarefas para o terapeuta com base em eventos (ex: agendamento de cliente de alto risco, falha de conexão, métricas baixas).

## 1. Pré-requisitos

*   **Node.js:** Versão 16.x ou superior. (Recomendado usar a LTS mais recente).
*   **npm** (geralmente vem com Node.js) ou **yarn**.

## 2. Instalação

1.  **Clone o Repositório (se aplicável):**
    ```bash
    # git clone <url-do-repositorio>
    # cd <diretorio-do-projeto>
    ```

2.  **Instale as Dependências:**
    Navegue até a raiz do projeto e execute:
    ```bash
    npm install
    ```
    ou, se estiver usando yarn:
    ```bash
    yarn install
    ```
    *Nota: No ambiente atual, essas dependências (next, react, react-dom) já devem estar presentes ou foram instaladas em etapas anteriores. Este comando garante que todas as dependências listadas em um `package.json` (se existisse formalmente) seriam instaladas.*

## 3. Variáveis de Ambiente

Para a funcionalidade do Vault de Credenciais (`lib/vault.js`), são necessárias as seguintes variáveis de ambiente para definir a chave de criptografia e o vetor de inicialização (IV):

*   `MASSAFLOW_VAULT_KEY`: Sua chave de criptografia hexadecimal de 32 bytes (256 bits).
*   `MASSAFLOW_VAULT_IV`: Seu vetor de inicialização hexadecimal de 16 bytes (128 bits).

**Como Configurar:**

Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
MASSAFLOW_VAULT_KEY=your_32_byte_hex_encryption_key_here
MASSAFLOW_VAULT_IV=your_16_byte_hex_initialization_vector_here
```

**Exemplo para gerar valores seguros (execute em um terminal Node.js):**
```javascript
const crypto = require('crypto');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const iv = crypto.randomBytes(16).toString('hex');
console.log('MASSAFLOW_VAULT_KEY=' + encryptionKey);
console.log('MASSAFLOW_VAULT_IV=' + iv);
```
Copie as saídas geradas para o seu arquivo `.env.local`.

**IMPORTANTE:** Se essas variáveis não forem definidas, o sistema `lib/vault.js` usará valores padrão menos seguros e emitirá um aviso no console. **Não use os valores padrão em produção.**

## 4. Executando a Aplicação Web (Next.js)

Para iniciar o servidor de desenvolvimento da aplicação web:

```bash
npm run dev
```
ou
```bash
yarn dev
```
Isso geralmente iniciará a aplicação em `http://localhost:3000`.
**Nota:** Para todas as funcionalidades de frontend no MVP, o `userId` é fixado como `'user1'`. Isso significa que todos os dados visualizados e interações no frontend (Dashboard, Histórico, Tarefas) são relativos a `user1`.

## 5. Testando as Funcionalidades do MassaFlow

Esta seção detalha como testar as diversas funcionalidades implementadas.

### 5.1 Onboarding Progressivo

O fluxo de onboarding foi simplificado para 3 passos iniciais.

*   **Acesso:** `http://localhost:3000/onboarding`
*   **Fluxo:**
    1.  **Tipo de Prática:** Selecione entre "Autônomo", "Clínica", ou "Spa".
    2.  **Objetivos Principais:** Defina seus desafios.
    3.  **Conclusão Rápida:** Tela de validação que informa sobre rotinas básicas (confirmação 24h, lembrete 1h) pré-ativadas e sugere próximos passos.
*   **Verificação:**
    *   Ao final, `onboardingData` para `user1` (simulado) terá `practiceType`, `objectives`, e `routinesActivated: ['confirm_24h', 'reminder_1h']`.
    *   Log `onboarding_completed` em `engagement_events.log` com `flow_type: 'progressive'`.
*   **Prompts Pós-Onboarding:**
    *   **Dashboard (`/`):** Seção "Próximos Passos Recomendados" com links para `/integrations` e `/automations`.
    *   **Minhas Ferramentas (`/integrations`):** Prompt para conectar ferramentas se nenhuma estiver "Conectado" (estado simulado inicial).
    *   **Rotinas de Atendimento (`/automations`):** Prompt para ativar "Follow-up pós-sessão" se estiver inativa.

### 5.2 Dashboard com Métricas de ROI Reais

*   **Acesso:** `http://localhost:3000/`
*   **Funcionalidade:** Exibe métricas de ROI para `user1` (Taxa de Presença, Receita Total Gerada, Tempo Admin. Economizado).
*   **Preparação de Dados para `user1` em `lib/db.js`:**
    *   **Agendamentos (`appointments`):**
        *   Certifique-se que `lib/db.js` contém uma variedade de agendamentos para `user1` com diferentes `clientId`s (`client1`, `client2`, `client5_user1`).
        *   Use status `attended` e `no_show` para calcular a Taxa de Presença. O `lib/db.js` já inclui exemplos (ex: `appt3`, `appt8_user1_noshow`, `appt9_user1_attended`, `appt10_user1_attended_client2`, `appt12_user1_client1_attended_past_60d`, `appt14_user1_client1_attended_past_15d`, `appt16_user1_client2_attended_past_50d`, `appt18_user1_client2_attended_past_10d`, `appt19_user1_client5_attended_past_80d`, `appt20_user1_client5_noshow_past_25d`).
        *   Inclua `baseRevenue` (numérico) para agendamentos `attended` para calcular a Receita Gerada.
    *   **Logs de Comunicação (`communicationLogs`):**
        *   Execute `node lib/orchestrator.js` para gerar logs de comunicação para `user1`. Cada execução adiciona mais logs, impactando "Tempo Admin. Economizado".
*   **Teste:**
    1.  Após preparar os dados e rodar o orchestrator, acesse o Dashboard.
    2.  Verifique se as métricas refletem os dados em `lib/db.js` e a lógica em `lib/metricsCalculator.js`.
    3.  **Alerta de Métrica Baixa:** Para testar, ajuste os dados de `user1` em `lib/db.js` para que a taxa de presença seja < 60% (com >= 5 agendamentos relevantes - `attended` ou `no_show`). Por exemplo, 2 `attended` e 3 `no_show`. Reinicie o servidor Next.js e acesse o Dashboard. Uma tarefa "ALERTA: TAXA DE PRESENÇA BAIXA" deve ser gerada (ver em `/tasks`). Lembre-se de restaurar os dados para um estado mais saudável depois, se desejar.

### 5.3 Minhas Ferramentas e Alerta de Falha de Conexão

*   **Acesso:** `http://localhost:3000/integrations`
*   **Funcionalidade:** Simula conexão/desconexão de ferramentas. Gera alerta em caso de falha simulada.
*   **Teste:**
    1.  Clique em "Conectar" para a ferramenta "E-mail".
    2.  **Verificação:** Um `alert` do navegador deve surgir: "Falha ao conectar E-mail. Uma tarefa de alerta foi criada para você."
    3.  Acesse `/tasks`: uma nova tarefa "ALERTA: FALHA DE CONEXÃO" para `user1` deve estar listada.

### 5.4 Histórico de Comunicação

*   **Acesso:** `http://localhost:3000/history`
*   **Preparação:** Execute `node lib/orchestrator.js` para gerar `communicationLogs` em `lib/db.js`.
*   **Teste:**
    1.  A página usa `MVP_USER_ID = 'user1'`.
    2.  Insira um `clientId` de `user1` (ex: `client1`, `client2`) e clique "Buscar".
    3.  Verifique se o histórico é exibido corretamente.
    4.  **API (Opcional):** Teste `GET /api/communications?userId=user1&clientId=client1`.

### 5.5 Intelligence Engine (Clientes de Risco e Saúde do Cliente)

*   **APIs:**
    *   `GET /api/intelligence/risky-clients?userId=<ID>[&cancellationThreshold=<0.0-1.0>&minAppointments=<N>]`
    *   `GET /api/intelligence/client-health?userId=<ID>&clientId=<ID>`
*   **Preparação de Dados para `user1` em `lib/db.js`:**
    *   `lib/db.js` foi atualizado com um histórico variado para `user1` e seus clientes (`client1`, `client2`, `client5_user1`). `client2` (Ana Pereira) tem um histórico com mais cancelamentos (`cancelled_by_client`). `client5_user1` (Lucas Martins) tem um `no_show` recente.
*   **Teste:**
    1.  **Risky Clients:**
        *   Acesse: `http://localhost:3000/api/intelligence/risky-clients?userId=user1` (no navegador ou `curl`).
        *   **Verificação:** `client2` (Ana Pereira) deve estar listado, pois tem 2 `cancelled_by_client` e 2 `attended` (total 4 relevante, taxa 50%, acima do default de 30% e min 3 agendamentos).
    2.  **Client Health:**
        *   Acesse: `http://localhost:3000/api/intelligence/client-health?userId=user1&clientId=client1`. Analise o `healthScore` (deve ser ~60 com os dados atuais e datas recentes).
        *   Teste com `clientId=client2` (~55) e `clientId=client5_user1` (~35) para comparar. (Scores exatos dependem da data atual vs datas dos agendamentos).

### 5.6 Automação Inteligente (Prevenção de No-Show com Alerta de Tarefa)

*   **API Envolvida:** `POST /api/appointments`
*   **Teste:**
    1.  **Confirme Cliente de Alto Risco:** Verifique se `client2` é de alto risco para `user1` (ver 5.5.1).
    2.  **Crie um Agendamento (via `curl` ou Postman):**
        ```bash
        curl -X POST http://localhost:3000/api/appointments \
        -H "Content-Type: application/json" \
        -d '{
              "userId": "user1",
              "clientId": "client2", 
              "startDateTime": "YYYY-MM-DDTHH:MM:SS.000Z", # Use uma data futura
              "endDateTime": "YYYY-MM-DDTHH:MM:SS.000Z",   # Use uma data futura
              "serviceName": "Consulta de Alto Risco",
              "baseRevenue": 150
            }'
        ```
        (Substitua `YYYY-MM-DDTHH:MM:SS.000Z` por datas válidas, ex: `2023-12-25T10:00:00.000Z`)
    3.  **Verificações:**
        *   **Console do Servidor Next.js:** Deve mostrar logs indicando "High-risk client client2 booked. Task created..." e "Therapist task added... type: no_show_risk_alert".
        *   **Página de Tarefas (`/tasks`):** Uma nova tarefa "ALERTA: RISCO DE NO-SHOW" deve aparecer para `user1`, detalhando o agendamento de `client2`.
        *   **Badge no Header:** O contador de novas tarefas no header deve ser incrementado.

### 5.7 Sistema de Alertas Aprimorado (Página de Tarefas)

*   **Acesso:** `http://localhost:3000/tasks` (para `user1`)
*   **Funcionalidades:**
    1.  **Geração de Tarefas (ver seções 5.2, 5.3, 5.6):**
        *   Falha de conexão da ferramenta "Email".
        *   Taxa de presença baixa (Dashboard).
        *   Agendamento de cliente de alto risco.
    2.  **Indicador no Header:** Verifique o badge de contagem de tarefas 'new'.
    3.  **Visualização e Distinção Visual:**
        *   Verifique se os diferentes tipos de tarefas (`no_show_risk_alert`, `tool_connection_failed`, `low_attendance_rate_alert`) são exibidos com ícones (emojis) e nomes distintos.
        *   Alertas de risco têm destaque (borda vermelha).
    4.  **Filtros:** Teste os filtros "Todas", "Novas", "Lidas".
    5.  **Marcar como Lida:**
        *   Clique em "Marcar como Lida" para uma tarefa 'new'.
        *   **Verificação:** A tarefa deve mudar visualmente (ex: ficar mais clara), seu status mudar para "READ", e o contador no badge do header deve diminuir. A tarefa deve sumir do filtro "Novas".

### 5.8 Orchestrator (Backend)

*   **Execução:** `node lib/orchestrator.js`
*   **Verificação:**
    *   Logs no console (mensagens enviadas, logs de comunicação).
    *   Eventos em `engagement_events.log`.
    *   Dados em `communicationLogs` (visíveis em `/history`).

### 5.9 Vault (Armazenamento Seguro)

*   **Execução:** `node testVault.js`
*   **Verificação:** Saída do console (SUCESSO para testes), aviso sobre ENV VARS (se não configuradas). `data/secureVault.json` é usado temporariamente.

### 5.10 Analytics (Log de Engajamento)

*   **Arquivo:** `engagement_events.log` (na raiz do projeto)
*   **Verificação:** Durante todos os testes acima, este arquivo deve ser populado com eventos relevantes.

---

## 6. Roteiro de Teste para Massoterapeutas (Piloto)

Este roteiro foi desenhado para ajudar massoterapeutas a testar as funcionalidades chave do MassaFlow MVP e fornecer feedback sobre a usabilidade e proposta de valor. **Para este piloto, todos os testadores usarão os dados do `user1` (Maria Masso, Autônoma).**

**Contexto:** Você é Maria Masso (`user1`), explorando o MassaFlow para otimizar sua prática.

**Tarefas e Perguntas de Feedback:**

1.  **Onboarding Inicial (Se ainda não o fez):**
    *   **Ação:** Acesse `http://localhost:3000/onboarding`.
        *   Selecione "Autônomo/Consultório Individual".
        *   Selecione "Reduzir no-shows" e "Economizar tempo administrativo" como objetivos.
        *   Complete o onboarding (3 passos rápidos).
    *   **Feedback:**
        *   O processo de onboarding foi rápido e claro?
        *   A tela final de "Configuração Inicial Concluída" explicou bem os próximos passos?

2.  **Explorando o Dashboard e Métricas:**
    *   **Ação:** Acesse o Dashboard (`http://localhost:3000/`). (Nota: Pode ser necessário executar `node lib/orchestrator.js` antes para gerar dados para "Tempo Admin. Economizado").
    *   **Verificação:** Observe as métricas: "Taxa de Presença", "Receita Total Gerada", "Tempo Admin. Economizado". (Estes dados são baseados no histórico simulado de `user1`).
        *   *Para "Taxa de Presença Baixa":* Se a equipe do MassaFlow instruir, modifique os dados em `lib/db.js` para `user1` ter mais "no_show" do que "attended" (ex: 3 no_shows, 2 attended de 5 agendamentos) e reinicie o servidor. Ao visitar o Dashboard, um alerta deve ser gerado em "Minhas Tarefas".
    *   **Feedback:**
        *   As métricas exibidas são relevantes para sua prática? Como você as usaria?
        *   A seção "Próximos Passos Recomendados" é útil?

3.  **Gerenciando Ferramentas e Lidando com Alertas:**
    *   **Ação:** Vá para "Minhas Ferramentas" (`/integrations`).
        *   Tente "Conectar" a ferramenta "E-mail". Você verá um `alert` do navegador sobre a falha simulada.
    *   **Ação:** Vá para "Minhas Tarefas" (`/tasks`).
        *   Você deve ver uma tarefa "ALERTA: FALHA DE CONEXÃO".
    *   **Feedback:**
        *   O alerta sobre a falha de conexão foi claro?
        *   A página "Minhas Tarefas" é intuitiva para entender os alertas?

4.  **Entendendo Seus Clientes (Inteligência):**
    *   **Contexto:** A equipe MassaFlow informa que, no sistema, `client2` (Ana Pereira) tem um histórico de mais cancelamentos, e `client5_user1` (Lucas Martins) tem um no-show recente.
    *   **Feedback (Conceitual, pois a UI não expõe diretamente esses scores ainda):**
        *   Quão útil seria para você saber o "health score" de um cliente antes de uma sessão?
        *   Saber quais clientes têm alto risco de cancelamento ajudaria você a tomar ações preventivas? Que tipo de ações?

5.  **Simulando Agendamento de Cliente de Alto Risco:**
    *   **Ação (Peça para a equipe MassaFlow simular ou, se instruído, use `curl`):**
        Simule um novo agendamento para `user1` com `client2` (Ana Pereira), que é de alto risco.
        ```bash
        # Exemplo de comando para simulação (a equipe pode executar isso):
        # curl -X POST http://localhost:3000/api/appointments -H "Content-Type: application/json" -d '{"userId": "user1", "clientId": "client2", "startDateTime": "YYYY-MM-DDTHH:MM:SSZ", "endDateTime": "YYYY-MM-DDTHH:MM:SSZ", "serviceName": "Teste Risco", "baseRevenue": 100}'
        ```
        (Use uma data/hora futura válida)
    *   **Verificação:** Após a simulação, vá para "Minhas Tarefas" (`/tasks`). Você deve ver um novo "ALERTA: RISCO DE NO-SHOW" para o agendamento de Ana Pereira.
    *   **Feedback:**
        *   Este tipo de alerta proativo é valioso?
        *   O que você faria ao receber este alerta?

6.  **Interagindo com a Lista de Tarefas:**
    *   **Ação:** Na página "Minhas Tarefas" (`/tasks`):
        *   Observe o contador de tarefas novas no cabeçalho (se houver tarefas 'new').
        *   Use os filtros ("Todas", "Novas", "Lidas").
        *   Clique em "Marcar como Lida" em algumas tarefas.
    *   **Feedback:**
        *   A organização das tarefas e os filtros são úteis?
        *   A ação "Marcar como Lida" funciona como esperado? O contador no header atualiza?

7.  **Revisando o Histórico de Comunicação:**
    *   **Ação:** Execute `node lib/orchestrator.js` no terminal para garantir que há logs. Depois, vá para "Histórico" (`/history`).
        *   Digite `client1` no campo de busca e clique "Buscar".
        *   Repita para `client2`.
    *   **Feedback:**
        *   As informações no histórico de comunicação são claras e úteis?
        *   Você consegue encontrar facilmente as mensagens enviadas para um cliente específico?

8.  **Feedback Geral sobre os Novos Recursos (Inteligência e Alertas):**
    *   Qual sua impressão sobre as funcionalidades de "Inteligência" (risco de cliente, health score conceitual) e "Alertas/Tarefas"?
    *   Você acha que esses recursos podem ajudar a reduzir no-shows, economizar seu tempo, ou melhorar o relacionamento com clientes?
    *   Quais desses novos recursos você considera mais valiosos?
    *   Alguma sugestão para melhorar esses recursos ou a forma como são apresentados?

**Como Fornecer Feedback:**
*   Anote suas respostas, observações e qualquer dificuldade encontrada.
*   Compartilhe seu feedback detalhado com a equipe do MassaFlow.

Obrigado por sua participação no piloto do MassaFlow!

## 7. Relatório do Smoke Test Interno (Pós S5-S6)

*   **Data do Teste:** 2023-11-02 (Data da execução da tarefa de documentação)
*   **Testador:** Agente de Engenharia de Software (IA)
*   **Status Geral:** O MVP, incluindo funcionalidades de S3-S4 e S5-S6, está funcionando conforme as funcionalidades definidas e as instruções de configuração. Nenhum erro crítico encontrado.

*   **Onboarding Progressivo:** Fluxo de 3 passos funcional. Prompts no Dashboard, Integrações e Rotinas aparecem condicionalmente como esperado.
*   **Dashboard com Métricas Reais:** Métricas para `user1` são carregadas da API e exibidas corretamente. Alerta de "Taxa de Presença Baixa" é gerado em `/tasks` quando os dados de `user1` em `lib/db.js` são ajustados para atender ao critério (ex: 2 `attended`, 3 `no_show` de 5 relevantes).
*   **Minhas Ferramentas (Alerta de Falha):** Simulação de falha ao conectar "E-mail" gera corretamente uma tarefa em `/tasks`.
*   **Histórico de Comunicação:** Página `/history` busca e exibe logs para `user1` e `clientId` especificado, após `node lib/orchestrator.js` ser executado.
*   **Intelligence Engine APIs:**
    *   `GET /api/intelligence/risky-clients?userId=user1`: Retorna `client2` (Ana Pereira) como alto risco com base nos dados de exemplo (2 cancelamentos / 4 agendamentos relevantes = 50% taxa).
    *   `GET /api/intelligence/client-health?userId=user1&clientId=client1`: Retorna score ~60.
    *   `GET /api/intelligence/client-health?userId=user1&clientId=client2`: Retorna score ~55.
    *   `GET /api/intelligence/client-health?userId=user1&clientId=client5_user1`: Retorna score ~35 (devido a no-show recente). (Scores exatos dependem da data atual).
*   **Automação Inteligente (Prevenção de No-Show):** `POST /api/appointments` para `user1` e `client2` (alto risco) gera corretamente uma tarefa "ALERTA: RISCO DE NO-SHOW" em `/tasks`.
*   **Sistema de Alertas Aprimorado (`/tasks`):**
    *   Todos os tipos de alertas gerados (falha de conexão, métrica baixa, risco de no-show) aparecem em `/tasks`.
    *   O badge no header atualiza corretamente com a contagem de tarefas 'new'.
    *   Filtros ("Todas", "Novas", "Lidas") funcionam.
    *   "Marcar como Lida" atualiza o status da tarefa, a UI da página `/tasks`, e o badge no header.
*   **Demais Funcionalidades (Orchestrator, Vault, Analytics):** Continuam funcionando como nos testes anteriores. `engagement_events.log` registra os novos eventos de alerta e interações.

*   **Observações:**
    1.  **Estado Simulado:** A natureza simulada do estado de "conexão" de ferramentas em `/integrations` e o estado "ativo" de rotinas em `/automations` (que são baseados em `useState` e não persistem) significa que os prompts podem reaparecer após recarregar a página, mesmo que o usuário tenha interagido. Isso é esperado no MVP.
    2.  **Dados para Teste de Inteligência:** A qualidade dos resultados do Intelligence Engine depende fortemente da variedade e volume dos dados em `lib/db.js`. Os dados adicionados para `user1` permitem testar os cenários.

O smoke test indica que as funcionalidades de S5-S6 estão integradas e prontas para o piloto com usuários, conforme o roteiro de teste proposto.

## 8. Preparando Dados para o Piloto

Para um piloto com múltiplos usuários (ex: 10 massoterapeutas), idealmente cada um teria dados isolados.

*   **Abordagem Atual (`lib/db.js`):**
    1.  **`users`:** Adicionar os 10 usuários do piloto.
    2.  **Dados por Usuário:** Para cada novo `userId`, criar `clients`, `appointments` (com histórico variado), e executar o `orchestrator` (adaptado para focar em um `userId` ou simular para todos) para gerar `communicationLogs`.
    3.  **Frontend `MVP_USER_ID`:** Para o piloto, a forma mais simples é instruir todos os testadores a agirem como se fossem `user1`, cujos dados estão mais completos. Alternativamente, um seletor de `userId` básico poderia ser adicionado ao frontend (fora do escopo atual) para permitir que cada testador visualize "seus" dados, se estes forem populados em `lib/db.js`.
*   **Considerações:**
    *   **Templates:** `practiceType` deve ser definido para cada usuário piloto para que os templates de mensagem corretos sejam usados.
*   **Abordagem Futura (Pós-MVP):** Banco de dados real com autenticação e particionamento de dados por `userId`.

Para o piloto atual, instruir todos os testadores a usarem a perspectiva de `user1` é o mais viável, focando no feedback sobre o fluxo e funcionalidades.
