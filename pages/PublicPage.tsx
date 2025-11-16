import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Link as RouterLink } from 'react-router-dom';
import Button from '../components/ui/Button';

const PublicPage: React.FC = () => {
    const { themeSettings } = useContext(AppContext);

    const processedFooterHtml = (themeSettings.footerHtml || '').replace(
        '{{{copyright_line}}}',
        `&copy; ${new Date().getFullYear()} ${themeSettings.copyrightText} - Versão ${themeSettings.systemVersion}`
    );

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
            <div className="bg-white text-slate-800 antialiased">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                    <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                        <a href="#inicio" className="flex items-center">
                            <img src={themeSettings.logoUrl} alt="Logo" className="h-10 w-auto" />
                            <span className="text-slate-800 text-lg font-bold ml-2 hidden sm:block">{themeSettings.systemName}</span>
                        </a>
                        <div className="space-x-8 hidden md:flex text-slate-700">
                            <a href="#inicio" className="hover:text-amber-600 transition-colors">Início</a>
                            <a href="#quem-somos" className="hover:text-amber-600 transition-colors">Quem Somos</a>
                            <a href="#filiais" className="hover:text-amber-600 transition-colors">Filiais</a>
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
                <footer dangerouslySetInnerHTML={{ __html: processedFooterHtml }} />
            </div>
        </>
    );
};

export default PublicPage;