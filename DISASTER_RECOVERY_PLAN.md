# Plano de Disaster Recovery (DR) do MassaFlow MVP

## 1. Introdução

Este documento descreve o Plano de Disaster Recovery (DR) para a versão MVP (Minimum Viable Product) do MassaFlow. O objetivo é fornecer procedimentos para backup de dados, restauração de dados e re-implantação da aplicação em caso de falha crítica ou perda de dados.

Para o MVP, os dados são armazenados localmente em arquivos JSON, e a aplicação é executada como um processo Node.js/Next.js. Este plano reflete essa arquitetura simplificada.

## 2. Procedimento de Backup de Dados

Backups regulares são cruciais para proteger os dados do MassaFlow. O script `scripts/manage-data.js` é fornecido para automatizar este processo.

### 2.1. Como Executar o Backup

1.  **Acesse o Servidor/Ambiente:** Conecte-se ao ambiente onde a aplicação MassaFlow está rodando.
2.  **Navegue até o Diretório Raiz:** Vá para o diretório raiz do projeto MassaFlow.
3.  **Execute o Comando de Backup:**
    ```bash
    node scripts/manage-data.js backup
    ```
    Este comando irá:
    *   Garantir que todos os dados dinâmicos em memória (de `lib/db.js`) sejam salvos nos arquivos JSON correspondentes em `data/dynamic/`.
    *   Criar um novo subdiretório com timestamp (ex: `YYYYMMDD_HHMMSS`) dentro do diretório `backups/` (localizado na raiz do projeto, por padrão).
    *   Copiar os seguintes arquivos para este subdiretório de backup:
        *   Todos os arquivos de `data/dynamic/*.json` (ex: `users.json`, `appointments.json`, etc.).
        *   `data/secureVault.json` (contém credenciais criptografadas).
        *   `engagement_events.log` (log de eventos de analytics).
4.  **(Opcional) Especificar Diretório de Backup:**
    Para salvar os backups em um local diferente do padrão (`backups/`), use a flag `--target`:
    ```bash
    node scripts/manage-data.js backup --target /caminho/para/seu/diretorio/de/backups
    ```
5.  **Verifique os Logs:** O script irá logar o progresso e o resultado da operação de backup no console. Verifique se há mensagens de sucesso ou erro.

### 2.2. Frequência Recomendada para Backups

*   **Para o MVP em ambiente de teste/desenvolvimento:** Recomenda-se realizar backups pelo menos **diariamente**, ou antes de qualquer alteração significativa na configuração ou nos dados.
*   **Em um ambiente de produção futuro:** A frequência seria maior (ex: a cada poucas horas ou contínuo, dependendo do volume de transações) e os backups seriam armazenados em um local seguro e geograficamente redundante.

### 2.3. Armazenamento dos Backups

*   Por padrão, os backups são armazenados em subdiretórios dentro da pasta `backups/` na raiz do projeto.
*   **Recomendação Crítica:** Para proteção real contra perda de dados (ex: falha de disco, desastre no servidor), estes backups devem ser **copiados regularmente para um local externo e seguro** (ex: armazenamento em nuvem como AWS S3, Google Cloud Storage, um disco rígido externo, outro servidor).

## 3. Procedimento de Restauração de Dados

Este procedimento descreve como restaurar os dados da aplicação a partir de um backup previamente realizado.

**AVISO: Este processo irá sobrescrever os arquivos de dados atuais da aplicação com os dados do backup selecionado.**

### 3.1. Passos para Restauração

1.  **Pare a Aplicação MassaFlow:**
    Se a aplicação Next.js estiver rodando, pare-a (ex: `Ctrl+C` no terminal onde `npm run dev` foi executado). Isso evita que a aplicação tente ler ou escrever nos arquivos de dados durante o processo de restauração.
2.  **Identifique o Backup a Ser Restaurado:**
    Navegue até o diretório onde seus backups estão armazenados (padrão: `backups/`). Cada subdiretório representa um backup, nomeado com um timestamp. Escolha o backup que deseja restaurar.
    Exemplo: `backups/20231102-103000-000Z`
3.  **Execute o Comando de Restauração:**
    No terminal, a partir da raiz do projeto MassaFlow, execute:
    ```bash
    node scripts/manage-data.js restore --source /caminho/completo/para/seu/backup_YYYYMMDD_HHMMSS
    ```
    Substitua `/caminho/completo/para/seu/backup_YYYYMMDD_HHMMSS` pelo caminho real do subdiretório de backup escolhido.
    Exemplo:
    ```bash
    node scripts/manage-data.js restore --source backups/20231102-103000-000Z
    ```
    Este comando irá:
    *   Copiar os arquivos do diretório de backup especificado para seus locais originais (`data/dynamic/`, `data/secureVault.json`, `engagement_events.log`).
4.  **Verifique os Logs:** O script irá logar o progresso e o resultado da restauração no console.
5.  **Reinicie a Aplicação MassaFlow:**
    Após a restauração bem-sucedida, reinicie a aplicação:
    ```bash
    npm run dev 
    # ou yarn dev
    ```
    A aplicação agora carregará os dados restaurados dos arquivos JSON.
6.  **Verifique a Integridade dos Dados:** Acesse a aplicação e verifique se os dados foram restaurados conforme o esperado.

## 4. Re-implantação da Aplicação (Em Caso de Perda Total do Servidor)

Se o ambiente onde o MassaFlow estava rodando for completamente perdido, os seguintes passos podem ser seguidos para re-implantar a aplicação em um novo ambiente:

1.  **Prepare o Novo Ambiente:** Certifique-se que o novo servidor/ambiente possui os pré-requisitos instalados (Node.js, npm/yarn).
2.  **Clone o Código da Aplicação:**
    Obtenha a versão mais recente do código-fonte do MassaFlow do repositório Git:
    ```bash
    git clone <url-do-repositorio-git-do-massaflow>
    cd massaflow # ou o nome do diretório do projeto
    ```
3.  **Instale as Dependências:**
    ```bash
    npm install
    # ou
    # yarn install
    ```
4.  **Configure as Variáveis de Ambiente:**
    *   Crie o arquivo `.env.local` na raiz do projeto.
    *   Adicione todas as variáveis de ambiente necessárias, incluindo:
        *   `STRIPE_SECRET_KEY`
        *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
        *   `STRIPE_WEBHOOK_SECRET`
        *   `NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENCIAL` (e outros IDs de preço)
        *   `MASSAFLOW_VAULT_KEY`
        *   `MASSAFLOW_VAULT_IV`
    *   Consulte a Seção 3 do `MVP_README.md` para detalhes sobre essas variáveis.
5.  **Restaure os Dados:**
    *   Copie o diretório de backup mais recente e confiável para o novo servidor (ex: para a pasta `backups/` dentro do novo projeto).
    *   Execute o procedimento de restauração de dados conforme descrito na Seção 3 deste plano.
6.  **Construa a Aplicação (Se Aplicável para Produção):**
    Para um ambiente de produção, você normalmente faria um build otimizado:
    ```bash
    npm run build
    ```
7.  **Inicie a Aplicação:**
    *   Para desenvolvimento/teste: `npm run dev`
    *   Para produção (após `npm run build`): `npm start`

## 5. Configuração Externa do Stripe

Lembre-se que a configuração dos produtos, preços e webhooks no Dashboard do Stripe é externa à aplicação MassaFlow. Em caso de desastre, se você precisar recriar sua conta Stripe ou reconfigurar, siga as instruções no `MVP_README.md` (ou documentação de produção) para configurar:
*   Produtos e Preços.
*   Chaves de API (Secret e Publishable).
*   Webhook Endpoint e o segredo do Webhook.

Certifique-se que os IDs de Preço e as chaves no seu arquivo `.env.local` correspondem à sua configuração no Stripe.

## 6. Teste do Plano de Disaster Recovery

É crucial testar este plano de DR periodicamente para garantir sua eficácia e familiarizar a equipe com os procedimentos.

*   **Frequência Recomendada para Testes:** Pelo menos uma vez a cada 3-6 meses, ou após mudanças significativas na arquitetura da aplicação ou no processo de backup.
*   **Procedimento de Teste (Simulado):**
    1.  Realize um backup completo usando o script `manage-data.js`.
    2.  (Opcional, mas recomendado) Em um ambiente de teste separado (ou após fazer um backup seguro do estado atual), simule uma "perda de dados" excluindo ou corrompendo alguns dos arquivos em `data/dynamic/`.
    3.  Siga o "Procedimento de Restauração de Dados" (Seção 3) para restaurar os dados a partir do backup realizado no passo 1.
    4.  Inicie a aplicação e verifique se os dados foram restaurados corretamente e se a aplicação está funcional.
    5.  Documente quaisquer problemas encontrados durante o teste e atualize este plano de DR conforme necessário.

Este plano de DR é um documento vivo e deve ser atualizado à medida que o MassaFlow evolui.
