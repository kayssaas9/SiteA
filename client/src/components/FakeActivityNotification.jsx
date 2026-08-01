import { useEffect, useMemo, useState } from "react";
import "./FakeActivityNotification.css";

const FIRST_NAMES = [
  "Léo", "Maya", "Nolan", "Inès", "Eli", "Lina", "Sacha", "Noa",
  "Yanis", "Zoé", "Milo", "Chloé", "Enzo", "Jade", "Aaron", "Lou",
];

const SUFFIXES = [
  "cars", "v8", "gt", "rs", "drift", "auto", "garage", "racing",
  "motors", "crew", "tuning", "speed",
];

const EVENTS = [
  { type: "subscription", plan: "Basique", time: "À l'instant" },
  { type: "subscription", plan: "Pro", time: "Il y a 1 min" },
  { type: "subscription", plan: "Expert", time: "Il y a 2 min" },
  { type: "recharge", credits: 900, time: "À l'instant" },
  { type: "recharge", credits: 2000, time: "Il y a 1 min" },
  { type: "recharge", credits: 4000, time: "Il y a 3 min" },
  { type: "recharge", credits: 10000, time: "Il y a 4 min" },
  { type: "recharge", credits: 20000, time: "Il y a 5 min" },
];

function createNotification(previous) {
  let firstName;
  let suffix;
  let pseudo;

  do {
    firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    pseudo = `${firstName}${suffix}`;
  } while (pseudo === previous?.pseudo);

  let event;
  do {
    event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  } while (event.type === previous?.type && event.type === "subscription"
    && event.plan === previous?.plan);

  return { ...event, pseudo, id: `${pseudo}-${Date.now()}` };
}

export default function FakeActivityNotification({ visible }) {
  const [notification, setNotification] = useState(() => createNotification());
  const [isVisible, setIsVisible] = useState(true);
  const notificationKey = useMemo(() => notification.id, [notification.id]);

  useEffect(() => {
    if (!visible) return undefined;

    const interval = window.setInterval(() => {
      setIsVisible(false);
      window.setTimeout(() => {
        setNotification((previous) => createNotification(previous));
        setIsVisible(true);
      }, 420);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const isSubscription = notification.type === "subscription";
  const accent = isSubscription ? "#8EC5E8" : "#E8B455";
  const message = isSubscription
    ? <><strong>{notification.pseudo}</strong> s'est abonné — <em>{notification.plan}</em></>
    : <><strong>{notification.pseudo}</strong> a rechargé — <em>{notification.credits.toLocaleString("fr-FR")} crédits</em></>;

  return (
    <aside
      key={notificationKey}
      className={`fake-activity-notification ${isVisible ? "is-visible" : "is-leaving"}`}
      style={{ "--notification-accent": accent }}
      role="status"
      aria-live="polite"
    >
      <span className="fake-activity-dot" aria-hidden="true" />
      <div className="fake-activity-copy">
        <p>{message}</p>
        <span>{notification.time}</span>
      </div>
    </aside>
  );
}