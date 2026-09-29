export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">Sankhuu</div>
        {children}
      </div>
    </div>
  );
}
