import { Link } from "react-router-dom";
import "./Legal.css";

export default function Privacy() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <span className="legal-eyebrow">Vysion</span>
        <h1 className="legal-title">Politique de Confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : 29 juillet 2026</p>
      </header>

      <article className="legal-content">
        <section>
          <h2>Protection des données</h2>
          <h3>Données collectées</h3>
          <p>
            Nous collectons uniquement les données nécessaires au fonctionnement
            de Vysion : votre adresse e-mail, votre nom d'utilisateur, votre
            historique de créations et vos données de paiement, traitées de
            manière sécurisée.
          </p>
        </section>

        <section>
          <h3>Conservation</h3>
          <p>
            Vos créations sont conservées sur des serveurs sécurisés tant que
            votre compte est actif, ou jusqu'à ce que vous les supprimiez.
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
            les données de navigation. Ces analyses sont destinées à comprendre
            l'utilisation de la plateforme et à améliorer l'expérience
            utilisateur.
          </p>
        </section>

        <section>
          <h3>Contact</h3>
          <p>
            Pour toute demande relative à vos données, utilisez les coordonnées
            indiquées dans les Mentions légales.
          </p>
          <p><Link to="/conditions-generales-utilisation">Conditions Générales d’Utilisation →</Link></p>
        </section>
      </article>
    </main>
  );
}