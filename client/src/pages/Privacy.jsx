import { Link } from "react-router-dom";
import "./Legal.css";

export default function Privacy() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <span className="legal-eyebrow">Vysion</span>
        <h1 className="legal-title">Politique de Confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : 29 juillet 2026</p>
        <div className="legal-company-placeholder">
          <strong>Informations légales à compléter</strong>
          [Nom de l'entreprise / du responsable] — [Adresse] — [SIRET]
        </div>
      </header>

      <article className="legal-content">
        <section>
          <h2>1. Données collectées</h2>
          <p>
            Nous collectons votre adresse e-mail, les données de votre compte
            gérées avec Clerk, les informations liées à votre abonnement et
            crédits, ainsi que votre historique de génération, incluant les
            images et instructions nécessaires au service.
          </p>
        </section>

        <section>
          <h2>2. Utilisation</h2>
          <p>
            Ces données servent à créer votre compte, fournir les générations,
            gérer les paiements et abonnements, conserver votre historique,
            sécuriser le service et répondre à vos demandes. Vos contenus ne
            sont pas utilisés pour entraîner des modèles sans votre
            consentement explicite.
          </p>
        </section>

        <section>
          <h2>3. Sous-traitants</h2>
          <p>
            Vysion utilise <strong>Clerk</strong> pour l’authentification,
            <strong> Stripe</strong> pour les paiements,
            <strong> Supabase</strong> pour le stockage et
            <strong> OneShot API</strong> pour la génération d’images. Les
            données de carte bancaire sont traitées par Stripe.
          </p>
        </section>

        <section>
          <h2>4. Vos droits</h2>
          <p>
            Vous pouvez demander l’accès, la rectification, la suppression,
            l’export ou la limitation du traitement de vos données. Pour exercer
            vos droits, contactez-nous via le moyen indiqué sur le site en
            précisant l’e-mail associé à votre compte.
          </p>
        </section>

        <section>
          <h2>5. Conservation et sécurité</h2>
          <p>
            Les données sont conservées pendant l’utilisation du service, puis
            supprimées ou anonymisées dans un délai raisonnable après la
            fermeture du compte, sous réserve des obligations légales. Les
            données de facturation sont conservées pendant la durée imposée par
            la loi. Des mesures raisonnables protègent les données contre les
            accès non autorisés.
          </p>
        </section>

        <section>
          <h2>6. Responsable et contact</h2>
          <p>
            Le responsable du traitement est
            <span className="legal-placeholder"> [Nom de l'entreprise / du responsable]</span>,
            <span className="legal-placeholder"> [Adresse]</span>,
            <span className="legal-placeholder"> [SIRET]</span>. Ces
            informations et le contact définitif seront complétés lors de la
            création du statut juridique.
          </p>
          <p><Link to="/conditions-generales-utilisation">Conditions Générales d’Utilisation →</Link></p>
        </section>
      </article>
    </main>
  );
}