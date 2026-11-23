import { useState } from 'react'
import type { FormEvent } from 'react';

function AdminLoginPage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function submitHandler(e: FormEvent<HTMLFormElement>){
        e.preventDefault();
        //Anrop till backend
        window.location.assign('/admin');
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
                        <input id="email" required type="text" value={email} onChange={e => setEmail(e.target.value)}/>
                        <label htmlFor="password">Lösenord</label>
                        <input id="password" required type="password" value={password} onChange={e => setPassword(e.target.value)}/>
                        <button className="primary-button" type="submit">Logga in</button>
                    </form>
                </article>
            </main>
        </div>
    );
}

export default AdminLoginPage;