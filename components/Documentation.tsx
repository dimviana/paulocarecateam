
import React from 'react';

const Documentation: React.FC = () => {
    const sectionTitle = "text-xl font-bold text-[var(--theme-accent)] mt-6 mb-2 border-b border-[var(--theme-text-primary)]/10 pb-2";
    const subTitle = "text-lg font-semibold text-[var(--theme-text-primary)] mt-4 mb-1";
    const paragraph = "text-[var(--theme-text-primary)]/80 leading-relaxed";
    const listItem = "ml-5 list-disc text-[var(--theme-text-primary)]/80";

    return (
        <div className="max-h-[70vh] overflow-y-auto pr-4 text-left">
            <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-4">Bem-vindo ao Jiu-Jitsu Hub!</h1>
            <p className={paragraph}>
                Esta documentação oferece um guia completo sobre como utilizar todas as funcionalidades do sistema para gerenciar sua academia de forma eficiente.
            </p>

            <h2 className={sectionTitle}>Dashboard</h2>
            <p className={paragraph}>
                Sua central de informações. Aqui você tem uma visão geral da academia com estatísticas rápidas, gráficos de frequência, divisão de alunos e um calendário de aulas.
            </p>
            <ul className="mt-2 space-y-1">
                <li className={listItem}><strong>Cards de Estatísticas:</strong> Números chave como total de alunos, professores e turmas.</li>
                <li className={listItem}><strong>Gráficos:</strong> Visualizações sobre frequência, pagamentos e demografia dos alunos.</li>
                <li className={listItem}><strong>Calendário e Aulas do Dia:</strong> Organize-se com uma visão clara das aulas agendadas.</li>
            </ul>

            <h2 className={sectionTitle}>Alunos</h2>
            <p className={paragraph}>
                Gerencie o cadastro completo dos seus alunos, acompanhe o progresso e a situação financeira de cada um.
            </p>
             <ul className="mt-2 space-y-1">
                <li className={listItem}><strong>Cadastro:</strong> Adicione novos alunos com informações detalhadas, incluindo dados pessoais, de contato e graduação inicial.</li>
                <li className={listItem}><strong>Promoção de Faixa:</strong> O sistema indica quando um aluno está elegível para a próxima faixa com base no tempo de permanência, frequência e idade (para crianças). A promoção pode ser feita com um clique.</li>
                <li className={listItem}><strong>Dashboard do Aluno:</strong> Visualize um painel individual para cada aluno com seu progresso, frequência e informações financeiras.</li>
            </ul>

            <h2 className={sectionTitle}>Professores</h2>
             <p className={paragraph}>
                Mantenha um registro dos seus instrutores. Ao promover um aluno à faixa preta, o sistema automaticamente o cadastra como um professor, simplificando o processo.
            </p>

            <h2 className={sectionTitle}>Graduações</h2>
            <p className={paragraph}>
                Personalize o sistema de faixas da sua academia. Você pode definir a ordem, cores, tempo mínimo de permanência e requisitos de idade para as faixas infantis. Arraste e solte para reordenar a hierarquia das faixas.
            </p>

            <h2 className={sectionTitle}>Horários e Frequência</h2>
             <p className={paragraph}>
                Organize a grade de aulas e registre a presença dos alunos de forma simples.
            </p>
            <ul className="mt-2 space-y-1">
                <li className={listItem}><strong>Grade de Horários:</strong> Crie turmas, defina dias, horários, professores e a graduação mínima necessária.</li>
                <li className={listItem}><strong>Registro de Frequência:</strong> Na visão de calendário, clique em um dia com aulas agendadas para abrir a lista de chamada. Marque a presença ou ausência dos alunos elegíveis para cada turma.</li>
            </ul>

            <h2 className={sectionTitle}>Financeiro</h2>
            <p className={paragraph}>
                Controle as mensalidades e a saúde financeira da academia.
            </p>
             <ul className="mt-2 space-y-1">
                <li className={listItem}><strong>Visão Geral:</strong> Gráficos e estatísticas mostram a quantidade de alunos em dia e pendentes.</li>
                <li className={listItem}><strong>Lembretes e Cobranças:</strong> O sistema identifica alunos com mensalidades próximas do vencimento ou em atraso, permitindo o envio de lembretes via WhatsApp com um clique.</li>
                <li className={listItem}><strong>Registro de Pagamento:</strong> Administradores podem registrar pagamentos. Alunos podem pagar via PIX (se configurado) e enviar o comprovante em PDF para confirmação.</li>
            </ul>

            <h2 className={sectionTitle}>Configurações</h2>
            <p className={paragraph}>
                Personalize o sistema para que ele tenha a cara da sua equipe.
            </p>
             <ul className="mt-2 space-y-1">
                <li className={listItem}><strong>Sistema:</strong> Altere o nome, logo, cores, e configure regras de cobrança.</li>
                <li className={listItem}><strong>Pagamentos:</strong> Configure sua chave PIX para permitir que alunos paguem diretamente pelo sistema.</li>
                <li className={listItem}><strong>Página Web:</strong> Ative e personalize uma página pública com informações sobre sua academia.</li>
                <li className={listItem}><strong>Atividades:</strong> Visualize um log completo de todas as ações importantes realizadas no sistema.</li>
            </ul>

            <h2 className={sectionTitle}>Área do Aluno</h2>
            <p className={paragraph}>
                Os alunos têm seu próprio acesso para acompanhar seu desenvolvimento.
            </p>
             <ul className="mt-2 space-y-1">
                <li className={listItem}><strong>Dashboard Pessoal:</strong> O aluno vê sua graduação atual, progresso para a próxima faixa, frequência e status financeiro.</li>
                <li className={listItem}><strong>Pagamento:</strong> Se a mensalidade estiver pendente e próxima do vencimento, o aluno pode iniciar o pagamento via PIX.</li>
                <li className={listItem}><strong>Horários:</strong> Acesso à grade de aulas da sua academia.</li>
            </ul>
        </div>
    );
};

export default Documentation;
