import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, BarChart2, MousePointerClick, Smartphone, Globe, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyScanCount {
    date: string;
    count: number;
}

interface AnalyticsData {
    slug: string;
    total_scans: number;
    daily_scans: DailyScanCount[];
    top_user_agents: Record<string, number>;
    locations: Record<string, number>;
    devices: Record<string, number>;
    os_breakdown: Record<string, number>;
}

const AnalyticsBoard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get(`/api/analytics/${slug}`);
                setData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchAnalytics();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400 p-6 rounded-xl text-center transition-colors">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <Link to="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    // Format chart data
    const chartData = data.daily_scans.map(item => ({
        name: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        scans: item.count
    }));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Links
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg transition-colors">
                        <BarChart2 className="w-6 h-6 text-primary-700 dark:text-primary-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400 transition-colors">Performance for /r/{slug}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Top Row: Left Column Metrics */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 dark:text-gray-400 font-medium transition-colors">Total Lifetime Scans</h3>
                            <MousePointerClick className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white transition-colors">
                            {data.total_scans.toLocaleString()}
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2 flex items-center gap-1 transition-colors">
                            +{(data.daily_scans[data.daily_scans.length - 1]?.count || 0)} today
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 transition-colors">
                            <Smartphone className="w-5 h-5 text-primary-500" />
                            Top Platforms / Browsers
                        </h3>
                        {Object.keys(data.top_user_agents).length > 0 ? (
                            <ul className="space-y-4">
                                {Object.entries(data.top_user_agents).map(([ua, count], idx) => {
                                    let browser = "Unknown Browser";
                                    if (ua.includes("Chrome")) browser = "Chrome";
                                    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
                                    else if (ua.includes("Firefox")) browser = "Firefox";
                                    else if (ua.includes("Edg")) browser = "Edge";

                                    let os = "Mobile / Desktop";
                                    if (ua.includes("Android")) os = "Android";
                                    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
                                    else if (ua.includes("Windows")) os = "Windows";
                                    else if (ua.includes("Mac OS")) os = "macOS";

                                    // Calculate percentage width for visual bar
                                    const maxCount = Math.max(...Object.values(data.top_user_agents));
                                    const pct = Math.max((count / maxCount) * 100, 5);

                                    return (
                                        <li key={idx} className="relative">
                                            <div className="flex justify-between text-sm mb-1 z-10 relative">
                                                <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{browser} <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">on {os}</span></span>
                                                <span className="font-bold text-gray-900 dark:text-white transition-colors">{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 transition-colors">
                                                <div className="bg-primary-400 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Not enough data to analyze user agents yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Time Series Chart */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-[500px] flex flex-col transition-colors">
                        <h3 className="text-gray-900 dark:text-white font-bold mb-6 flex items-center gap-2 transition-colors">
                            <Globe className="w-5 h-5 text-primary-500" />
                            Scans over last 30 days
                        </h3>
                        <div className="flex-grow w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                                            itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="scans" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <p>No scan data available for this timeframe.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Additional Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 transition-colors">
                        <MapPin className="w-5 h-5 text-primary-500" />
                        Top Locations
                    </h3>
                    {data.locations && Object.keys(data.locations).length > 0 ? (
                        <ul className="space-y-4">
                            {Object.entries(data.locations).map(([loc, count], idx) => {
                                const locName = loc || "Unknown Location";
                                const maxCount = Math.max(...Object.values(data.locations));
                                const pct = Math.max((count / maxCount) * 100, 5);
                                return (
                                    <li key={idx} className="relative">
                                        <div className="flex justify-between text-sm mb-1 z-10 relative">
                                            <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{locName}</span>
                                            <span className="font-bold text-gray-900 dark:text-white transition-colors">{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 transition-colors">
                                            <div className="bg-primary-400 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Not enough location data to map yet.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 transition-colors">
                    <Smartphone className="w-5 h-5 text-primary-500" />
                    Device Distribution
                </h3>
                {data.devices && Object.keys(data.devices).length > 0 ? (
                    <ul className="space-y-4">
                        {Object.entries(data.devices).map(([device, count], idx) => {
                            const deviceName = device || "Unknown Device";
                            const maxCount = Math.max(...Object.values(data.devices));
                            const pct = Math.max((count / maxCount) * 100, 5);
                            return (
                                <li key={idx} className="relative">
                                    <div className="flex justify-between text-sm mb-1 z-10 relative">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{deviceName}</span>
                                        <span className="font-bold text-gray-900 dark:text-white transition-colors">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 transition-colors">
                                        <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Not enough device data yet.</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2 transition-colors">
                    <Smartphone className="w-5 h-5 text-primary-500" />
                    Operating Systems
                </h3>
                {data.os_breakdown && Object.keys(data.os_breakdown).length > 0 ? (
                    <ul className="space-y-4">
                        {Object.entries(data.os_breakdown).map(([os, count], idx) => {
                            const osName = os || "Unknown OS";
                            const maxCount = Math.max(...Object.values(data.os_breakdown));
                            const pct = Math.max((count / maxCount) * 100, 5);
                            return (
                                <li key={idx} className="relative">
                                    <div className="flex justify-between text-sm mb-1 z-10 relative">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 transition-colors">{osName}</span>
                                        <span className="font-bold text-gray-900 dark:text-white transition-colors">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 transition-colors">
                                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Not enough OS data yet.</p>
                )}
            </div>

        </div>
    );
};

export default AnalyticsBoard;
