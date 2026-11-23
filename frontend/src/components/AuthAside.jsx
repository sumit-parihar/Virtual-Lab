// The brand panel beside the sign-in, forgot/reset password and change-password forms (hidden on phones).
export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside__brand">
        <span className="auth-aside__mark" aria-hidden="true">ML</span>
        <span>ML Virtual Lab</span>
      </div>
      <div className="auth-aside__body">
        <svg className="auth-aside__art" viewBox="0 0 420 200" aria-hidden="true">
          <g fill="#5eead4" opacity="0.9">
            <circle cx="30" cy="170" r="5" />
            <circle cx="70" cy="150" r="5" />
            <circle cx="105" cy="158" r="5" />
            <circle cx="140" cy="128" r="5" />
            <circle cx="180" cy="120" r="5" />
            <circle cx="215" cy="96" r="5" />
            <circle cx="255" cy="92" r="5" />
            <circle cx="290" cy="66" r="5" />
            <circle cx="330" cy="58" r="5" />
            <circle cx="370" cy="36" r="5" />
          </g>
          <line x1="10" y1="180" x2="400" y2="28" stroke="#f1b56a" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="auth-aside__title">Learn machine learning by doing it.</p>
        <p className="auth-aside__text">Ten experiments with theory, interactive labs and Python that runs in your browser.</p>
      </div>
      <p className="auth-aside__foot">ADCET · Department lab</p>
    </aside>
  );
}
