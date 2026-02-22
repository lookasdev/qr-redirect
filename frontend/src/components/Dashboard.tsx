import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import QRGenerator from './QRGenerator';
import { Link } from 'react-router-dom';
import { Plus, Edit2, BarChart2, LogOut, Check, X, Link as LinkIcon, ExternalLink, QrCode, Trash2, Download, Lock } from 'lucide-react';

interface QRLink {
    id: string;
    slug: string;
    title: string;
    destination_url: string;
    created_at: string;
    is_paused: boolean;
    is_protected: boolean;
    qr_customization?: { fgColor: string, bgColor: string, logoUrl?: string };
}

const Dashboard: React.FC = () => {
    const { logout } = useAuth();
    const [links, setLinks] = useState<QRLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // New link form
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newSlug, setNewSlug] = useState('');

    // UTM Builder
    const [showUtmBuilder, setShowUtmBuilder] = useState(false);
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [isProtected, setIsProtected] = useState(false);

    const fetchLinks = async () => {
        try {
            const res = await api.get('/api/links');
            setLinks(res.data);
        } catch (error) {
            console.error("Failed to fetch links", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let finalUrl = newUrl;
            if (showUtmBuilder && (utmSource || utmMedium || utmCampaign)) {
                try {
                    const urlObj = new URL(finalUrl);
                    if (utmSource) urlObj.searchParams.set('utm_source', utmSource);
                    if (utmMedium) urlObj.searchParams.set('utm_medium', utmMedium);
                    if (utmCampaign) urlObj.searchParams.set('utm_campaign', utmCampaign);
                    finalUrl = urlObj.toString();
                } catch (err) {
                    console.warn("Invalid URL for UTM injection");
                }
            }

            await api.post('/api/links', {
                title: newTitle,
                destination_url: finalUrl,
                slug: newSlug || undefined
            });
            setIsCreating(false);
            setNewTitle('');
            setNewUrl('');
            setNewSlug('');
            setUtmSource('');
            setUtmMedium('');
            setUtmCampaign('');
            setShowUtmBuilder(false);
            fetchLinks();
        } catch (error: any) {
            if (error.response?.data?.detail) {
                alert(error.response.data.detail);
            }
            console.error("Failed to create link", error);
        }
    };

    const togglePause = async (link: QRLink) => {
        try {
            await api.patch(`/api/links/${link.slug}`, { is_paused: !link.is_paused });
            fetchLinks();
        } catch (error) {
            console.error("Failed to toggle pause loop", error);
        }
    };

    const startEdit = (link: QRLink) => {
        setEditingId(link.id);
        setEditTitle(link.title);
        setEditUrl(link.destination_url);
        setIsProtected(link.is_protected);
        setEditPassword('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
        setEditUrl('');
        setEditPassword('');
    };

    const saveEdit = async (slug: string) => {
        try {
            const payload: any = { title: editTitle, destination_url: editUrl };
            if (editPassword) {
                payload.password_hash = editPassword;
                payload.is_protected = true;
            } else if (!isProtected) {
                payload.password_hash = null;
                payload.is_protected = false;
            }

            await api.patch(`/api/links/${slug}`, payload);
            setEditingId(null);
            fetchLinks();
        } catch (error) {
            console.error("Failed to update link", error);
        }
    };

    const handleDelete = async (slug: string) => {
        if (!confirm("Are you sure you want to delete this link? This will also delete all associated scan analytics.")) return;
        try {
            await api.delete(`/api/links/${slug}`);
            fetchLinks();
        } catch (error) {
            console.error("Failed to delete link", error);
        }
    };

    const downloadAllQRs = () => {
        links.forEach(link => {
            const svgElement = document.getElementById(`qr-svg-${link.slug}`);
            if (svgElement) {
                const serializer = new XMLSerializer();
                let source = serializer.serializeToString(svgElement);
                if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
                }
                source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
                const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
                const downloadLink = document.createElement("a");
                downloadLink.href = url;
                downloadLink.download = `qr-${link.slug}.svg`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Your Links</h1>
                <div className="flex items-center gap-4">
                    {links.length > 0 && (
                        <button
                            onClick={downloadAllQRs}
                            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Download All QRs
                        </button>
                    )}
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Link
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-primary-100 dark:border-primary-900/50 mb-8 animate-in fade-in slide-in-from-top-4 transition-colors">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary-900 dark:text-primary-400">
                        <LinkIcon className="w-5 h-5" />
                        Create a Dynamic QR Link
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (internal use)</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="e.g. Summer Campaign '26"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination URL</label>
                                <input
                                    type="url"
                                    required
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    placeholder="https://example.com/promo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Slug (optional)</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm transition-colors">/r/</span>
                                    <input
                                        type="text"
                                        value={newSlug}
                                        onChange={e => setNewSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                                        className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        placeholder="summer-sale"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUtmBuilder(!showUtmBuilder)}
                                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    {showUtmBuilder ? "Hide UTM Builder" : "Add UTM Tracking Parameters"}
                                </button>

                                {showUtmBuilder && (
                                    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">UTM Source</label>
                                            <input type="text" value={utmSource} onChange={e => setUtmSource(e.target.value)} placeholder="e.g. newsletter" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">UTM Medium</label>
                                            <input type="text" value={utmMedium} onChange={e => setUtmMedium(e.target.value)} placeholder="e.g. email" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">UTM Campaign</label>
                                            <input type="text" value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} placeholder="e.g. spring_promo" className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 transition-colors" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
                            >
                                Save Link
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading links...</p>
                </div>
            ) : links.length === 0 && !isCreating ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                    <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2 transition-colors">No links created yet</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 transition-colors">Create your first dynamic QR code to start routing and tracking your audience.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create First Link
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {links.map(link => (
                        <div key={link.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow">
                            {editingId === link.id ? (
                                <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-900/50 transition-colors">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Destination URL</label>
                                        <input
                                            type="url"
                                            value={editUrl}
                                            onChange={e => setEditUrl(e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5" /> Password Protection
                                            </label>
                                            {isProtected && (
                                                <button type="button" onClick={() => { setIsProtected(false); setEditPassword(''); }} className="text-xs text-red-500 hover:text-red-600 font-medium">
                                                    Remove Password
                                                </button>
                                            )}
                                        </div>

                                        {!isProtected && !editPassword ? (
                                            <button type="button" onClick={() => setIsProtected(true)} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                                + Add Password
                                            </button>
                                        ) : (
                                            <input
                                                type="text"
                                                value={editPassword}
                                                onChange={e => setEditPassword(e.target.value)}
                                                placeholder={isProtected ? "Enter new password to change..." : "Enter password..."}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                            />
                                        )}
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => saveEdit(link.slug)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded">
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-5 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-start transition-colors">
                                        <div className="pr-4">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 flex items-center gap-2 transition-colors">
                                                {link.title}
                                                {link.is_paused && (
                                                    <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-full uppercase transition-colors">Paused</span>
                                                )}
                                                {link.is_protected && (
                                                    <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase transition-colors flex items-center gap-1"><Lock className="w-3 h-3" /> Protected</span>
                                                )}
                                            </h3>
                                            <a
                                                href={link.destination_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`text-sm flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 truncate max-w-[200px] block transition-colors ${link.is_paused ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-500 dark:text-gray-400'}`}
                                                title={link.destination_url}
                                            >
                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                {link.destination_url}
                                            </a>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => togglePause(link)}
                                                className={`p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center ${link.is_paused ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                                                title={link.is_paused ? "Resume Link" : "Pause Link"}
                                            >
                                                {link.is_paused ? (
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => startEdit(link)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                title="Edit Link"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link.slug)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Link"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex justify-center transition-colors">
                                        <QRGenerator slug={link.slug} title={link.title} initialCustomization={link.qr_customization} />
                                    </div>

                                    <div className="px-5 py-3 bg-white dark:bg-gray-800 flex justify-between items-center transition-colors">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">Created {new Date(link.created_at).toLocaleDateString()}</span>
                                        <Link
                                            to={`/analytics/${link.slug}`}
                                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                            View Analytics
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
