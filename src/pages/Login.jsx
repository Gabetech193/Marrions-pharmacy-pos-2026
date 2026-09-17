import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name: name || email, role: 'staff' })
    }
    setLoading(false)
  }

  return (
    <div className="content">
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <img src="/logo.jpg" alt="Marrions Pharmacy" style={{ width: 140, height: 140, objectFit: 'contain' }} />
      </div>
      <h2>{mode === 'signin' ? 'Staff Sign In' : 'Create Staff Account'}</h2>
      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
        {mode === 'signup' && (
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
        {mode === 'signin' ? (
          <>No account? <a href="#" onClick={() => setMode('signup')}>Create one</a></>
        ) : (
          <>Already have an account? <a href="#" onClick={() => setMode('signin')}>Sign in</a></>
        )}
      </p>
    </div>
  )
}
