import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Settings, Save, X } from 'lucide-react';
import api from '../api';

interface QRCustomization {
    fgColor: string;
    bgColor: string;
    logoUrl?: string;
}

interface QRGeneratorProps {
    slug: string;
    title: string;
    initialCustomization?: QRCustomization;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ slug, title, initialCustomization }) => {
    const qrRef = useRef<SVGSVGElement>(null);

    const [fgColor, setFgColor] = useState(initialCustomization?.fgColor || '#000000');
    const [bgColor, setBgColor] = useState(initialCustomization?.bgColor || '#ffffff');
    const [logoUrl, setLogoUrl] = useState(initialCustomization?.logoUrl || '');
    const [showSettings, setShowSettings] = useState(false);
    const [logoDims, setLogoDims] = useState<{ width: number, height: number } | null>(null);

    useEffect(() => {
        if (!logoUrl) {
            setLogoDims(null);
            return;
        }
        const img = new Image();
        img.onload = () => {
            const maxSize = 48; // slightly larger for better visibility
            const ratio = img.width / img.height;
            let width, height;
            if (ratio > 1) {
                width = maxSize;
                height = maxSize / ratio;
            } else {
                height = maxSize;
                width = maxSize * ratio;
            }
            setLogoDims({ width, height });
        };
        img.onerror = () => {
            setLogoDims({ width: 40, height: 40 }); // fallback
        };
        img.src = logoUrl;
    }, [logoUrl]);

    // The redirect URL is locked to the frontend (Netlify).
    // Bypasses the backend Ngrok entirely to avoid "Visit Site" warning screens for physical scanners.
    const redirectUrl = `${window.location.origin}/r/${slug}`;

    const downloadQR = () => {
        if (!qrRef.current) return;

        // Create an XML serializer
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(qrRef.current);

        // Add namespace string
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Add XML declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        // Convert svg source to URI data scheme.
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        // Create download link
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = `qr-${slug}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    const handleSaveCustomization = async () => {
        try {
            await api.patch(`/api/links/${slug}`, {
                qr_customization: { fgColor, bgColor, logoUrl }
            });
            setShowSettings(false);
        } catch (error) {
            console.error("Failed to save QR customization", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2 transition-colors">
                    <QrCode className="w-5 h-5 text-primary-500" />
                    {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px] transition-colors" title={redirectUrl}>
                    /r/{slug}
                </p>
            </div>

            <div className={`bg-white dark:bg-gray-900 p-3 rounded-lg border flex justify-center items-center ${showSettings ? 'border-primary-500 dark:border-primary-400' : 'border-gray-200 dark:border-gray-700'} transition-colors`}>
                <QRCodeSVG
                    id={`qr-svg-${slug}`}
                    value={redirectUrl}
                    size={200}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level={"H"}
                    includeMargin={false}
                    imageSettings={logoUrl ? { src: logoUrl, height: logoDims?.height || 40, width: logoDims?.width || 40, excavate: true } : undefined}
                    style={{ width: "100%", height: "auto", maxWidth: "200px" }}
                    ref={qrRef}
                />
            </div>

            {showSettings && (
                <div className="mt-4 w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase transition-colors">Appearance</span>
                        <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1 transition-colors">QR Color</label>
                            <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded overflow-hidden transition-colors">
                                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-8 h-8 cursor-pointer border-0 p-0 m-0 bg-transparent flex-shrink-0" />
                                <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-full px-2 py-1 text-xs border-0 focus:ring-0 dark:bg-gray-800 dark:text-white transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1 transition-colors">Background Color</label>
                            <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded overflow-hidden transition-colors">
                                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 cursor-pointer border-0 p-0 m-0 bg-transparent flex-shrink-0" />
                                <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full px-2 py-1 text-xs border-0 focus:ring-0 dark:bg-gray-800 dark:text-white transition-colors" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1 transition-colors">Center Logo URL (optional)</label>
                        <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 focus:border-primary-500 transition-colors" />
                    </div>
                    <button onClick={handleSaveCustomization} className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 px-3 bg-primary-100 hover:bg-primary-200 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded-md text-xs font-semibold transition-colors">
                        <Save className="w-3.5 h-3.5" /> Save Style
                    </button>
                </div>
            )}

            <div className="mt-6 w-full flex gap-2">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 ${showSettings ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                >
                    <Settings className="w-4 h-4" />
                    Style
                </button>
                <button
                    onClick={downloadQR}
                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                    <Download className="w-4 h-4" />
                    Download Vector QR
                </button>
            </div>
        </div>
    );
};

export default QRGenerator;
