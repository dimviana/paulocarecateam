# Guia de Instalação e Deploy (Unificado) - Jiu-Jitsu Hub SAAS

Este documento fornece um guia passo a passo para instalar e configurar a aplicação Jiu-Jitsu Hub SAAS em um servidor VPS Linux (Debian/Ubuntu recomendado), utilizando uma arquitetura unificada de domínio único.

## Arquitetura do Sistema

O sistema agora funciona de forma unificada e mais simples:
1.  **Domínio Único**: Tanto o frontend quanto o backend operam sob o mesmo domínio (ex: `paulocarecateam.abildeveloper.com.br`).
2.  **Frontend**: Uma aplicação React (Vite) servida como arquivos estáticos na raiz do domínio (`/`).
3.  **Backend**: Uma API Node.js (em um repositório separado) que responde em um caminho específico, como `/api`.
4.  **Servidor Web (Nginx)**: Atua como servidor para o frontend e como **proxy reverso**. Ele direciona as chamadas `/api/...` para a aplicação backend, que roda internamente em uma porta específica.
5.  **Gerenciador de Processos (PM2)**: Mantém a aplicação backend rodando continuamente.
6.  **Banco de Dados**: MySQL.

---

## Pré-requisitos

1.  **Acesso à VPS**: Acesso root ou sudo a um servidor Linux.
2.  **Repositório do Backend**: A URL do repositório Git para sua aplicação backend Node.js.
3.  **Domínio Configurado**: Apenas **um** domínio para a aplicação (ex: `paulocarecateam.abildeveloper.com.br`), com um registro DNS do tipo 'A' apontando para o IP da sua VPS.
4.  **Acesso ao Banco de Dados**: Credenciais de acesso a um servidor MySQL.

---

## Passo 1: Preparação do Ambiente e Dependências

O script `deployct.txt` pode automatizar parte desta configuração. Primeiro, vamos garantir que todas as dependências estejam instaladas.

1.  **Acesse sua VPS via SSH.**

2.  **Instale as dependências (Nginx, Node.js, PM2, Certbot, Git)**:
    ```bash
    # Atualizar pacotes
    sudo apt-get update -y
    sudo apt-get install -y curl git software-properties-common nginx certbot python3-certbot-nginx

    # Instalar Node.js (versão LTS)
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Instalar PM2 globalmente
    sudo npm install -g pm2
    ```

---

## Passo 2: Configuração do Banco de Dados

1.  **Acesse seu servidor MySQL**, crie um banco de dados e um usuário para a aplicação.
2.  **Importe a estrutura das tabelas**: Use o arquivo `bancodedados.txt` do repositório do frontend para criar as tabelas.
    ```bash
    # Exemplo
    mysql -u seu_usuario -p seu_banco < /caminho/para/o/repo/bancodedados.txt
    ```

---

## Passo 3: Deploy e Configuração do Backend

O backend deve ser clonado e configurado em seu próprio diretório.

1.  **Clone o repositório do seu backend**:
    ```bash
    # Substitua a URL pelo repositório do SEU backend
    git clone https://github.com/seu-usuario/seu-backend.git /home/abildeveloper-paulocarecateam/backend
    ```

2.  **Instale as dependências e configure o ambiente**:
    ```bash
    cd /home/abildeveloper-paulocarecateam/backend
    npm install
    # Crie e configure seu arquivo .env com DATABASE_URL, JWT_SECRET, e PORT=3001
    nano .env
    ```

3.  **Prepare o arquivo de configuração do PM2 (`ecosystem.config.cjs`)**:
    *   Este repositório (o do frontend) contém um arquivo-guia chamado `ecosystem.config.txt`.
    *   **Abra o arquivo `ecosystem.config.txt`** e siga as instruções contidas nele. O processo é:
        1.  Copiar o bloco de código JavaScript fornecido no arquivo.
        2.  Criar um novo arquivo chamado `ecosystem.config.cjs` na raiz do seu diretório do **backend**.
        3.  Colar o código no novo arquivo.
        4.  Verificar se o caminho do `script` de inicialização (ex: `./server.cjs`) está correto.

4.  **Inicie o servidor backend com PM2**:
    *   Ainda no diretório do backend, execute o comando:
    ```bash
    pm2 start ecosystem.config.cjs
    ```
    *   PM2 irá ler o arquivo de configuração e iniciar sua aplicação com as configurações definidas.

5.  **Verifique se o backend está rodando (`pm2 list`) e configure para iniciar com o sistema**:
    ```bash
    pm2 startup
    # Siga as instruções na tela
    pm2 save
    ```

---

## Passo 4: Deploy do Frontend e Configuração do Nginx (Unificado)

Agora, use o script `deployct.txt` (que foi atualizado para a nova arquitetura) para automatizar a configuração.

1.  **Crie e execute o script de deploy**:
    *   Crie o arquivo `deploy.sh` na sua VPS com o conteúdo de `deployct.txt`.
        ```bash
        nano deploy.sh
        chmod +x deploy.sh
        ./deploy.sh
        ```

2.  **Instale o Jiu-Jitsu Hub**:
    *   No menu interativo, selecione a opção **"2) Instalar Jiu-Jitsu Hub"**.
    *   O script irá:
        1.  Clonar o repositório do frontend.
        2.  Construir a aplicação (`npm run build`).
        3.  Configurar o Nginx para:
            *   Servir os arquivos estáticos na raiz do seu domínio.
            *   Criar um **proxy reverso**: qualquer requisição para `https://seu-dominio.com/api/...` será encaminhada para o backend rodando na porta interna (ex: 3001).
        4.  Tentar gerar um único certificado SSL para o seu domínio.

---

## Passo 5: Verificação Final

1.  **Verifique o status do Nginx e do PM2**:
    ```bash
    sudo systemctl status nginx
    pm2 list
    ```
2.  **Acesse a URL no navegador**:
    *   `https://paulocarecateam.abildeveloper.com.br` - Você deve ver a página pública ou a tela de login. O sistema deve estar totalmente funcional, pois as chamadas de API (`/api/students`, etc.) serão corretamente redirecionadas pelo Nginx.

---

## Troubleshooting (Solução de Problemas)

### Erro: 502 Bad Gateway

Este é o erro mais comum e significa que o Nginx não conseguiu se comunicar com sua aplicação backend (o processo PM2). Siga estes passos para diagnosticar:

1.  **Verifique o Status do PM2**:
    *   Execute o comando `pm2 list`.
    *   Procure pelo processo `jiujitsu-hub-backend`.
    *   **Se o status for `errored` ou `stopped`**, o problema está no backend. Prossiga para o próximo passo.
    *   **Se o status for `online`**, o problema pode ser na configuração do Nginx ou firewall.

2.  **Verifique os Logs do Backend (Passo Mais Importante)**:
    *   Execute `pm2 logs jiujitsu-hub-backend`.
    *   Os logs mostrarão o erro exato que impediu sua aplicação de iniciar. Erros comuns incluem:
        *   **Erro de conexão com o banco de dados**: Verifique se o `DATABASE_URL` no arquivo `.env` do backend está correto (usuário, senha, host, porta, nome do banco).
        *   **`SyntaxError`**: Um erro no código do `server.js`.
        *   **`Cannot find module`**: Uma dependência está faltando. Execute `npm install` no diretório do backend.

3.  **Verifique a Configuração do Nginx**:
    *   Execute `sudo nginx -t`.
    *   Se este comando mostrar algum erro, há um problema de sintaxe no arquivo de configuração do seu site em `/etc/nginx/sites-available/`.
    *   Verifique se a porta no `proxy_pass` corresponde à porta no seu arquivo `ecosystem.config.cjs`.

---

## Gerenciamento Pós-Instalação

*   **Logs do backend**: `pm2 logs jiujitsu-hub-backend`
*   **Reiniciar o backend**: `pm2 restart jiujitsu-hub-backend`
*   **Atualizar o frontend**: Use a opção "5) Atualizar Jiu-Jitsu Hub" no script de deploy.
*   **Atualizar o backend**: Navegue até o diretório do backend, execute `git pull`, `npm install` (se necessário) e `pm2 restart jiujitsu-hub-backend`.