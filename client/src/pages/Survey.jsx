import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserData } from "../hooks/useUserData.js";
import "./Survey.css";

const INITIAL_ANSWERS = () => ({
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q10: "",
  q11: "", q12: "", q13: "", q14: "", q15: "",
});

export default function Survey() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { plan, loading: userDataLoading, refetch } = useUserData();
  const isSubscriber = ["basic", "pro", "expert"].includes(plan);
  const [questions, setQuestions] = useState([]);
  const answersRef = useRef(INITIAL_ANSWERS());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [completed, setCompleted] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);

  useEffect(() => {
    if (!user || userDataLoading || !isSubscriber) {
      if (!userDataLoading) setLoading(false);
      return undefined;
    }

    fetch(`/api/survey/status/${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((status) => {
        if (status.completed) {
          setCompleted(true);
          setLoading(false);
        } else {
          fetch(`/api/survey/questions/${encodeURIComponent(user.id)}`)
            .then((r) => r.json())
            .then((data) => setQuestions(data))
            .finally(() => setLoading(false));
        }
      })
      .catch(() => setLoading(false));
    return undefined;
  }, [isSubscriber, user?.id, userDataLoading]);

  const handleAnswer = (id, value) => {
    answersRef.current[id] = value;
    if (errors[id]) setErrors((e) => ({ ...e, [id]: null }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: user.id, answers: answersRef.current }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.invalid) {
          setErrors(data.invalid);
          setSubmitting(false);
          return;
        }
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      setCreditsEarned(data.creditsEarned ?? 400);
      setCompleted(true);
      refetch();
      window.dispatchEvent(new Event("survey-completed"));
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="survey-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page fade-up">
          <p className="survey-message">Connectez-vous pour accéder au questionnaire.</p>
        </div>
      </main>
    );
  }

  if (userDataLoading || loading) {
    return (
      <main className="survey-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page fade-up">
          <div className="survey-loading">Vérification de ton abonnement…</div>
        </div>
      </main>
    );
  }

  if (!isSubscriber) {
    return (
      <main className="survey-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page survey-access-block fade-up">
          <div className="badge">Réservé aux abonnés</div>
          <h1 className="page-title">Le questionnaire est réservé aux membres abonnés</h1>
          <p className="survey-subtitle">
            Active un abonnement pour accéder au questionnaire et gagner 400 crédits.
          </p>
          <Link className="btn btn-primary" to="/pricing">
            Voir les abonnements
          </Link>
        </div>
      </main>
    );
  }

  if (completed) {
    return (
      <main className="survey-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page survey-confirmation fade-up">
          <div className="survey-success-icon">🎉</div>
          <h1 className="page-title">Merci pour ta participation !</h1>
          <p className="survey-subtitle">
            Tu as gagné <span className="accent">+{creditsEarned} crédits</span>.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/account")}>
            Retour au compte
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="survey-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page survey-content">
        <div className="survey-header fade-up">
          <div className="badge">Questionnaire</div>
          <h1 className="page-title">Aide-nous à <span className="accent">mieux comprendre</span> ton expérience</h1>
          <p className="page-subtitle">15 questions ouvertes · +400 crédits offerts à la fin</p>
        </div>

        <div className="survey-form">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`survey-question card fade-up delay-${Math.min(idx % 5 + 1, 5)}`}
            >
              <div className="survey-question-number">Question {idx + 1}</div>
              <div className="survey-question-text">{q.text}</div>

              <div className="open-answer">
                <textarea
                  className="survey-textarea"
                  rows={4}
                  defaultValue={answersRef.current[q.id]}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Détaille ta réponse ici…"
                />
                {errors[q.id] && (
                  <div className="survey-error">{errors[q.id]}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors.global && (
          <div className="survey-global-error fade-up">⚠️ {errors.global}</div>
        )}

        <div className="survey-submit fade-up delay-5">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Envoi…" : "Valider et recevoir +400 crédits"}
          </button>
        </div>
      </div>
    </main>
  );
}
