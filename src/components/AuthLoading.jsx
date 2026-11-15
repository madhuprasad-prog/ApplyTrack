import { Activity, LoaderCircle, RefreshCw } from 'lucide-react'

export default function AuthLoading({ error }) {
  return (
    <main className="auth-state-page">
      <div className="auth-state-card">
        <div className="auth-brand-mark"><Activity size={21} strokeWidth={2.6} /></div>
        {error
          ? <>
              <h1>We couldn’t verify your session</h1>
              <p>Authentication could not be initialized. Check your connection and try again.</p>
              <button className="button button-primary auth-submit" onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> Try again
              </button>
            </>
          : <>
              <LoaderCircle className="auth-loading-spinner" size={22} />
              <h1>Checking your session</h1>
              <p>Preparing your ApplyTrack workspace…</p>
            </>}
      </div>
    </main>
  )
}
