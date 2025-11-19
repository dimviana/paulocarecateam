# ==============================================================================
#           Guia de Configuração do PM2 (ecosystem.config.js)
# ==============================================================================
#
# Para iniciar seu backend com PM2 de forma robusta, siga os passos abaixo.
# Este método evita o erro "File not found" e é a prática recomendada.
#
# 1. COPIE TODO O CONTEÚDO do bloco de código JavaScript abaixo (entre as linhas pontilhadas).
#
# 2. No diretório raiz do seu PROJETO BACKEND, crie um novo arquivo chamado:
#    ecosystem.config.js
#
# 3. COLE o conteúdo copiado nesse novo arquivo.
#
# 4. DESCOMENTE o bloco de configuração correspondente à sua aplicação
#    (Gerencia Boleto ou Jiu-Jitsu Hub).
#
# 5. IMPORTANTE: Altere a linha 'script' para apontar para o arquivo de
#    entrada do seu servidor (ex: './server.js', './index.js', './app.js').
#
# 6. Salve o arquivo `ecosystem.config.js`.
#
# 7. No terminal, dentro do diretório do backend, inicie a aplicação com:
#    pm2 start ecosystem.config.js
#
# ==============================================================================

# ----------------- INÍCIO DO CÓDIGO PARA COPIAR -----------------

module.exports = {
  apps: [
    /**
     * --- Bloco de Configuração para: Gerencia Boleto ---
     * Descomente as linhas abaixo se estiver configurando este sistema.
     */
    // {
    //   name: 'gerencia-boleto-backend',
    //   script: './server.js', // <-- MUITO IMPORTANTE: Altere para o seu arquivo de entrada!
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '1G',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: 3000 // Porta interna do backend (Nginx irá redirecionar para ela)
    //   }
    // },

    /**
     * --- Bloco de Configuração para: Jiu-Jitsu Hub ---
     * Descomente as linhas abaixo se estiver configurando este sistema.
     */
    // {
    //   name: 'jiujitsu-hub-backend',
    //   script: './server.js', // <-- MUITO IMPORTANTE: Altere para o seu arquivo de entrada!
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '1G',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: 3001 // Porta interna do backend (Nginx irá redirecionar para ela)
    //   }
    // }
  ]
};

# ------------------ FIM DO CÓDIGO PARA COPIAR ------------------
