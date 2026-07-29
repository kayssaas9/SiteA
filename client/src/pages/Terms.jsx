import { Link } from "react-router-dom";
import "./Legal.css";

function LegalHeader({ title }) {
  return (
    <header className="legal-header">
      <span className="legal-eyebrow">Vysion</span>
      <h1 className="legal-title">{title}</h1>
      <p className="legal-updated">Dernière mise à jour : 29 juillet 2026</p>
    </header>
  );
}

export default function Terms() {
  return (
    <main className="legal-page">
      <LegalHeader title="Conditions Générales d’Utilisation" />
      <article className="legal-content">
        <section>
          <h2>1. Le service</h2>
          <p>
            Vysion est un SaaS de génération et de transformation d’images par
            intelligence artificielle. L’offre comprend des abonnements, des
            crédits, des recharges et la fonctionnalité SnapRouge. Les
            conditions et tarifs applicables sont ceux affichés au moment de
            la commande.
          </p>
        </section>

        <section>
          <h2>2. Compte et utilisation</h2>
          <p>
            L’utilisateur doit fournir des informations exactes, protéger ses
            identifiants et utiliser un compte personnel. Il garantit disposer
            des droits sur les images et textes transmis. Toute utilisation
            illégale, frauduleuse ou portant atteinte aux droits d’un tiers est
            interdite et peut entraîner la suspension du compte.
          </p>
        </section>

        <section>
          <h2>3. Contenus générés</h2>
          <p>
            L’utilisateur conserve ses droits sur ses contenus. Les abonnés
            actifs bénéficient d’une licence commerciale sur les images générées
            avec leur compte. Les résultats pouvant être générés par une IA,
            l’utilisateur doit les vérifier avant toute publication ou usage
            commercial.
          </p>
        </section>

        <section>
          <h2>4. Paiement et résiliation</h2>
          <p>
            Les paiements et factures sont traités par Stripe. Les abonnements
            sont renouvelés automatiquement jusqu’à leur résiliation depuis
            l’espace client. La résiliation prend effet à la fin de la période
            déjà payée, sauf indication contraire.
          </p>
          <p>
            La garantie « Satisfait ou remboursé » s’applique pendant
            <span className="legal-placeholder"> 48 heures après l’achat</span>,
            uniquement si aucun crédit n’a été consommé et si l’abonnement n’a
            pas été résilié. Les crédits sont personnels, non transférables et
            non remboursables sauf indication contraire.
          </p>
          <p>
            Pour demander un remboursement, écrivez à{" "}
            l’adresse de contact indiquée dans les Mentions légales, en indiquant
            l’adresse e-mail du compte et le motif de la demande.
            Passé 48 heures, après consommation de crédits ou après résiliation
            de l’abonnement, aucun remboursement ne pourra être effectué.
          </p>
          <p>
            Les produits numériques étant accessibles immédiatement après
            l’achat, le droit de rétractation de 14 jours ne s’applique pas,
            conformément à l’article L221-28 du Code de la consommation.
          </p>
        </section>

        <section>
          <h2>5. Responsabilité</h2>
          <p>
            Vysion met en œuvre des moyens raisonnables pour assurer le service,
            sans garantir une disponibilité permanente ni l’absence d’erreur.
            Vysion ne peut être tenu responsable des contenus fournis par
            l’utilisateur, des décisions prises à partir d’une image générée ou
            des dommages indirects, dans les limites prévues par la loi.
          </p>
        </section>

        <section>
          <h2>6. Droit applicable et contact</h2>
          <p>
            Les présentes CGU sont soumises au droit français. Pour toute
            question, contactez-nous via les coordonnées indiquées dans les
            Mentions légales.
          </p>
          <p><Link to="/politique-confidentialite">Politique de Confidentialité →</Link></p>
        </section>
      </article>
    </main>
  );
}