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
          <h2>Protection des données</h2>
          <h3>Données collectées</h3>
          <p>
            Nous collectons uniquement les données nécessaires au fonctionnement
            de Vysion : votre adresse e-mail, votre nom d'utilisateur, votre
            historique de créations et les données de paiement traitées de
            manière sécurisée par Stripe.
          </p>
        </section>

        <section>
          <h3>Conservation</h3>
          <p>
            Vos créations sont conservées sur nos serveurs sécurisés tant que
            votre compte est actif, ou jusqu'à ce que vous les supprimiez.
            Certaines données peuvent être conservées plus longtemps lorsque la
            loi l'impose.
          </p>
        </section>

        <section>
          <h3>Sécurité et RGPD</h3>
          <p>
            Conformément au RGPD, vous disposez d'un droit d'accès, de
            rectification, de suppression et d'export de vos données. Pour
            exercer ces droits, contactez-nous via le moyen indiqué sur le site.
          </p>
          <p>
            Nous ne vendons jamais vos données à des tiers. Vos créations et
            informations ne sont pas utilisées pour entraîner des modèles d'IA
            sans votre consentement explicite.
          </p>
        </section>

        <section>
          <h3>Analyse de la navigation</h3>
          <p>
            Afin d'améliorer Vysion, nous pouvons analyser de manière anonyme
            les données de navigation : pages visitées, durée de consultation,
            type d'appareil et source de trafic. Ces analyses sont destinées à
            comprendre l'utilisation de la plateforme et à améliorer
            l'expérience utilisateur.
          </p>
        </section>

        <section>
          <h3>Responsable et contact</h3>
          <p>
            Le responsable du traitement est
            <span className="legal-placeholder"> [Nom de l'entreprise / du responsable]</span>,
            <span className="legal-placeholder"> [Adresse]</span>,
            <span className="legal-placeholder"> [SIRET]</span>. Ces
            informations seront complétées lors de la création du statut
            juridique. Pour toute demande, contactez-nous via le moyen indiqué
            sur le site.
          </p>
          <p><Link to="/conditions-generales-utilisation">Conditions Générales d’Utilisation →</Link></p>
        </section>
      </article>
    </main>
  );
}