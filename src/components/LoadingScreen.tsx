interface LoadingScreenProps {
  title?: string
  message?: string
}

export function LoadingScreen({
  title = 'RepLog',
  message = 'Loading your workout data...',
}: LoadingScreenProps) {
  return (
    <div className="sign-in-page">
      <section className="sign-in-card brutal-card">
        <p className="eyebrow">Initializing Session</p>
        <h1 className="sign-in-title">{title}</h1>
        <p className="sign-in-copy">{message}</p>
      </section>
    </div>
  )
}
