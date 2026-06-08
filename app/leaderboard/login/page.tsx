import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="screen">
      <div className="cup">
        <i className="ti ti-trophy" />
      </div>
      <h1>Creator Leaderboard</h1>
      <p>See where you rank across your campaigns. Sign in with your email — no password.</p>
      <LoginForm />
    </div>
  );
}
