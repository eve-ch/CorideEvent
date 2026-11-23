import { useState } from 'react'
import type { FormEvent } from 'react';

function AdminLoginPage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submitHandler(e: FormEvent<HTMLFormElement>){
        e.preventDefault();
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            if (!response.ok) {
                setError(
                    response.status === 401
                        ? 'Fel mejladress eller lösenord.'
                        : 'Kunde inte logga in. Försök igen.'
                );
                return;
            }

            window.location.assign('/admin');
        } catch {
            setError('Kunde inte kontakta servern.');
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className={"app"}>
            <header>
                <div className="logo">
                    CO<span>R</span>IDE
                </div>

                <span className="organizer-label">
                    Arrangör
                </span>
            </header>

            <div className="page-title">
                <h1>Logga in</h1>
            </div>

            <main>
                <article className={"event-card"}>
                    <form className="event-form" onSubmit={submitHandler}>
                        <label htmlFor="email">Email</label>
                        <input id="email" required type="email" value={email} onChange={e => setEmail(e.target.value)}/>
                        <label htmlFor="password">Lösenord</label>
                        <input id="password" required type="password" value={password} onChange={e => setPassword(e.target.value)}/>
                        {error && (<p className="error" role="alert">{error}</p>)}
                        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Loggar in...' : 'Logga in'}</button>
                    </form>
                </article>
            </main>
        </div>
    );
}

export default AdminLoginPage;