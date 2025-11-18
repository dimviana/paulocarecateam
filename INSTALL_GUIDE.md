# Guia de Instalação e Deploy - Jiu-Jitsu Hub SAAS

Este documento fornece um guia passo a passo para instalar e configurar a aplicação Jiu-Jitsu Hub SAAS em um servidor VPS Linux (Debian/Ubuntu recomendado).

## Arquitetura do Sistema

O sistema é composto por:
1.  **Frontend**: Uma aplicação React (Vite) servida como arquivos estáticos.
2.  **Backend**: Uma API Node.js (não inclusa neste repositório, mas o guia assume sua existência).
3.  **Servidor Web**: Nginx, atuando como servidor para o frontend e proxy reverso para o backend.
4.  **Gerenciador de Processos**: PM2, para manter a aplicação backend rodando continuamente.
5.  **Banco de Dados**: MySQL.

---

## Pré-requisitos

1.  **Acesso à VPS**: Acesso root ou sudo a um servidor Linux.
2.  **Domínios Configurados**:
    *   Um domínio para o frontend (ex: `paulocarecateam.abildeveloper.com.br`).
    *   Um domínio para o backend (ex: `paulocarecabk.abildeveloper.com.br`).
    *   Ambos os domínios devem ter registros DNS do tipo 'A' apontando para o IP da sua VPS.
3.  **Acesso ao Banco de Dados**: Credenciais de acesso a um servidor MySQL (pode ser na mesma VPS ou um serviço externo).

---

## Passo 1: Preparação do Ambiente e Deploy do Frontend

O script `deployct.txt` automatiza a maior parte da configuração do ambiente e o deploy do frontend.

1.  **Acesse sua VPS via SSH.**

2.  **Copie e execute o script de deploy**:
    *   Copie o conteúdo do arquivo `deployct.txt` para um novo arquivo na sua VPS.
        ```bash
        nano deploy.sh 
        # Cole o conteúdo do script, salve e feche (Ctrl+X, Y, Enter)
        ```
    *   Dê permissão de execução ao script:
        ```bash
        chmod +x deploy.sh
        ```
    *   Execute o script:
        ```bash
        ./deploy.sh
        ```

3.  **Instale o Jiu-Jitsu Hub**:
    *   No menu interativo do script, selecione a opção **"2) Instalar Jiu-Jitsu Hub"**.
    *   O script irá executar as seguintes ações automaticamente:
        *   **Instalar Dependências**: Instala Nginx, Node.js, PM2, Git e Certbot.
        *   **Clonar Repositório**: Baixa o código-fonte do GitHub.
        *   **Construir Frontend**: Executa `npm install` e `npm run build` para gerar os arquivos estáticos.
        *   **Configurar Nginx e SSL**: Cria os arquivos de configuração do Nginx para os domínios do frontend e backend e tenta gerar os certificados SSL com o Certbot.

Ao final deste passo, o frontend já estará configurado e acessível pelos domínios definidos.

---

## Passo 2: Configuração do Banco de Dados

Esta etapa é manual e crucial.

1.  **Acesse seu servidor MySQL**:
    ```bash
    mysql -u root -p
    ```

2.  **Crie o banco de dados e um usuário dedicado**:
    *   Substitua `seu_usuario` e `sua_senha_forte` por credenciais seguras.
    ```sql
    CREATE DATABASE paulocarecateam;
    CREATE USER 'seu_usuario'@'localhost' IDENTIFIED BY 'sua_senha_forte';
    GRANT ALL PRIVILEGES ON paulocarecateam.* TO 'seu_usuario'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```

3.  **Importe a estrutura das tabelas**:
    *   O script `deployct.txt` já clonou o repositório. O arquivo `bancodedados.txt` estará dentro do diretório da aplicação.
    *   Execute o comando abaixo para criar todas as tabelas, substituindo `seu_usuario` e `paulocarecateam` conforme necessário:
    ```bash
    mysql -u seu_usuario -p paulocarecateam < /home/abildeveloper-paulocarecateam/htdocs/paulocarecateam.abildeveloper.com.br/bancodedados.txt
    ```

---

## Passo 3: Configuração e Inicialização do Backend

1.  **Navegue até o diretório da aplicação**:
    ```bash
    cd /home/abildeveloper-paulocarecateam/htdocs/paulocarecateam.abildeveloper.com.br
    ```

2.  **Configure as variáveis de ambiente**:
    *   O script de deploy já deve ter renomeado `env.txt` para `.env`. Se não, faça-o manualmente: `cp env.txt .env`.
    *   Abra o arquivo `.env` para edição:
        ```bash
        nano .env
        ```
    *   **É fundamental atualizar as seguintes variáveis**:
        *   `DATABASE_URL`: Insira a string de conexão com o banco de dados que você configurou no Passo 2. Exemplo: `mysql://seu_usuario:sua_senha_forte@localhost:3306/paulocarecateam`.
        *   `JWT_SECRET`: Gere uma chave secreta forte e única. Você pode usar o comando `openssl rand -base64 32` no terminal para criar uma.
        *   `API_KEY`: Se for usar a API do Gemini, insira sua chave aqui.

3.  **Inicie o servidor backend com PM2**:
    *   Assumindo que o arquivo de entrada do seu backend se chame `server.js` (substitua se for outro nome, como `index.js` ou `app.js`).
    *   Use o nome de processo definido no script de deploy (`jiujitsu-hub-backend`).
    ```bash
    pm2 start server.js --name jiujitsu-hub-backend
    ```

4.  **Configure o PM2 para iniciar com o sistema**:
    ```bash
    pm2 startup
    # Siga as instruções que o comando exibir
    pm2 save
    ```

---

## Passo 4: Verificação Final

1.  **Verifique o status do backend**:
    ```bash
    pm2 list
    ```
    *   O processo `jiujitsu-hub-backend` deve estar com o status `online`.

2.  **Verifique o status do Nginx**:
    ```bash
    sudo systemctl status nginx
    ```
    *   O serviço deve estar `active (running)`.

3.  **Acesse as URLs no navegador**:
    *   **Frontend**: `https://paulocarecateam.abildeveloper.com.br` - Você deve ver a página pública ou a tela de login.
    *   **Backend**: `https://paulocarecabk.abildeveloper.com.br` - Você deve receber uma resposta da API (pode ser uma mensagem de "Cannot GET /" ou similar, o que indica que o servidor está respondendo).

---

## Gerenciamento Pós-Instalação

*   **Para ver os logs do backend**:
    ```bash
    pm2 logs jiujitsu-hub-backend
    ```
*   **Para reiniciar o backend após uma alteração**:
    ```bash
    pm2 restart jiujitsu-hub-backend
    ```
*   **Para atualizar a aplicação (frontend e código-fonte)**:
    *   Execute novamente o script `./deploy.sh` e escolha a opção **"6) Atualizar Jiu-Jitsu Hub"**.
    *   Após a atualização, se houver mudanças no backend, reinicie o processo com PM2.
