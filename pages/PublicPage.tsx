import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Link as RouterLink } from 'react-router-dom';
import Button from '../components/ui/Button';

const PublicPage: React.FC = () => {
    const { themeSettings } = useContext(AppContext);

    useEffect(() => {
        if (themeSettings.customJs) {
            try {
                const script = document.createElement('script');
                script.innerHTML = themeSettings.customJs;
                document.body.appendChild(script);

                return () => {
                    if(document.body.contains(script)){
                        document.body.removeChild(script);
                    }
                };
            } catch (e) {
                console.error("Error executing custom JS:", e);
            }
        }
    }, [themeSettings.customJs]);

    return (
        <>
            <style>{themeSettings.customCss || ''}</style>
            <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white antialiased">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/50">
                    <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                        <a href="#inicio" className="flex items-center">
                            <img src={themeSettings.logoUrl} alt="Logo" className="h-10 w-auto" />
                            <span className="text-gray-800 dark:text-white text-lg font-bold ml-2 hidden sm:block">{themeSettings.systemName}</span>
                        </a>
                        <div className="space-x-8 hidden md:flex text-gray-700 dark:text-gray-300">
                            <a href="#inicio" className="hover:text-red-500 transition-colors">Início</a>
                            <a href="#quem-somos" className="hover:text-red-500 transition-colors">Quem Somos</a>
                            <a href="#filiais" className="hover:text-red-500 transition-colors">Filiais</a>
                        </div>
                        <RouterLink to="/login">
                           <Button>Login</Button>
                        </RouterLink>
                    </nav>
                </header>

                <main>
                    {/* Hero */}
                    <section id="inicio" dangerouslySetInnerHTML={{ __html: themeSettings.heroHtml || '' }} />

                    {/* About Us */}
                    <section id="quem-somos" dangerouslySetInnerHTML={{ __html: themeSettings.aboutHtml || '' }} />

                    {/* Branches */}
                    <section id="filiais" dangerouslySetInnerHTML={{ __html: themeSettings.branchesHtml || '' }} />
                </main>
                
                {/* Footer */}
                <footer dangerouslySetInnerHTML={{ __html: themeSettings.footerHtml || '' }} />
            </div>
        </>
    );
};

export default PublicPage;