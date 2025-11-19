/**
 * ==============================================================================
 *           Arquivo de Configuração do PM2 para Jiu-Jitsu Hub
 * ==============================================================================
 *
 * Este arquivo é usado pelo PM2 para gerenciar o processo do servidor backend.
 * Ele garante que a aplicação rode de forma contínua em ambiente de produção.
 *
 * Como usar:
 * 1. Copie este arquivo para a pasta raiz do seu projeto BACKEND.
 * 2. Se o arquivo de entrada do seu servidor não for 'server.cjs',
 *    altere a linha 'script' abaixo.
 * 3. No terminal, dentro da pasta do backend, execute:
 *    pm2 start ecosystem.config.cjs
 *
 * ==============================================================================
 */

module.exports = {
  apps: [
    /**
     * --- Configuração para: Jiu-Jitsu Hub ---
     * Esta é a configuração padrão. Altere a linha 'script' se o seu
     * arquivo de entrada do servidor for diferente de 'server.cjs'.
     */
    {
      name: 'jiujitsu-hub-backend',
      script: './server.cjs', // <-- MUITO IMPORTANTE: Aponta para o arquivo .cjs!
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001 // Porta interna do backend (Nginx irá redirecionar para ela)
      }
    },

    /**
     * --- Bloco de Configuração Opcional para: Gerencia Boleto ---
     * Mantenha comentado a menos que esteja configurando este sistema.
     */
    // {
    //   name: 'gerencia-boleto-backend',
    //   script: './server.cjs',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '1G',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: 3000
    //   }
    // },
  ]
};