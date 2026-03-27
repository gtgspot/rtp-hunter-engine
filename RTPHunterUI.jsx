import React, { useState } from 'react';

const RTPHunterUI = () => {
    const [domain, setDomain] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleHunt = async () => {
        if (!domain.trim()) return;
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const res = await fetch(`/hunt?domain=${encodeURIComponent(domain.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>RTP Hunter</h1>
            <div>
                <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Enter domain (e.g. example.com)"
                />
                <button onClick={handleHunt} disabled={loading}>
                    {loading ? 'Hunting...' : 'Hunt'}
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {results && (
                <div>
                    <h2>Results for {domain}</h2>
                    {results.length === 0 ? (
                        <p>No providers detected.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Provider</th>
                                    <th>Game ID</th>
                                    <th>RTP</th>
                                    <th>URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.provider}</td>
                                        <td>{r.gameId || '—'}</td>
                                        <td>{r.rtp != null ? `${r.rtp}%` : 'unknown'}</td>
                                        <td>{r.error || r.url}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default RTPHunterUI;
