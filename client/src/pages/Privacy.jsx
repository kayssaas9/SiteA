import { Link } from "react-router-dom";
import "./Legal.css";

function LegalHeader() {
  return (
    <header className="legal-header">
      <span className="legal-eyebrow">Vysion</span>
      <h1 className="legal-title">Politique de Confidentialité</h1>
      <p className="legal-updated">Dernière mise à jour : 29 juillet 2026</p>
      <div className="legal-company-placeholder">
        <strong>Informations légales à compléter</strong>
        [Nom de l'entreprise / du responsable] — [Adresse] — [SIRET]
      </div>
    </header>
  );
}

export default function Privacy() {
  return (
    <main className="legal-page">
      <LegalHeader />
      <article className="legal-content">
        <section>
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement est actuellement identifié par le
            placeholder suivant : <span className="legal-placeholder">[Nom de l'entreprise / du responsable]</span>,
            <span className="legal-placeholder"> [Adresse]</span>,
            <span className="legal-placeholder"> [SIRET]</span>. Ces
            informations seront complétées lors de la création du statut
            juridique.
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <p>
            Selon votre utilisation de Vysion, nous pouvons collecter les
            catégories de données suivantes :
          </p>
          <ul>
            <li>votre adresse e-mail et les informations nécessaires à la création de votre compte ;</li>
            <li>les données de compte et d’authentification gérées avec Clerk ;</li>
            <li>les informations liées à votre abonnement, vos crédits et vos achats ;</li>
            <li>l’historique de vos générations, ainsi que les images et instructions nécessaires au fonctionnement du service ;</li>
            <li>les informations techniques nécessaires à la sécurité et au diagnostic du service.</li>
          </ul>
          <p>
            Les données de paiement sont traitées par Stripe. Vysion n’a pas
            accès aux coordonnées complètes de votre carte bancaire.
          </p>
        </section>

        <section>
          <h2>3. Utilisation des données</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>créer et gérer votre compte ;</li>
            <li>fournir le service de génération et afficher votre historique ;</li>
            <li>gérer les abonnements, crédits, recharges et remboursements ;</li>
            <li>sécuriser le service, prévenir les abus et répondre à vos demandes ;</li>
            <li>améliorer l’expérience et la fiabilité du service lorsque cela est nécessaire.</li>
          </ul>
          <p>
            Vos images et instructions ne sont pas utilisées pour entraîner des
            modèles d’IA sans votre consentement explicite.
          </p>
        </section>

        <section>
          <h2>4. Sous-traitants et services utilisés</h2>
          <p>
            Pour fournir Vysion, certaines données peuvent être traitées par
            des prestataires techniques :
          </p>
          <ul>
            <li><strong>Clerk</strong> : authentification et gestion des comptes ;</li>
            <li><strong>Stripe</strong> : paiements, abonnements et facturation ;</li>
            <li><strong>Supabase</strong> : stockage des données de service ;</li>
            <li><strong>OneShot API</strong> : génération et traitement des images.</li>
          </ul>
          <p>
            Ces prestataires n’utilisent les données que pour fournir leurs
            services selon leurs propres engagements contractuels et de
            sécurité.
          </p>
        </section>

        <section>
          <h2>5. Vos droits</h2>
          <p>
            Conformément au RGPD et à la réglementation applicable, vous pouvez
            demander l’accès à vos données, leur rectification, leur
            suppression, leur limitation, ainsi que l’export de vos données
            dans un format portable. Vous pouvez également vous opposer à
            certains traitements lorsque les conditions légales sont réunies.
          </p>
          <p>
            Pour exercer vos droits, adressez votre demande au contact indiqué
            sur le site en précisant l’adresse e-mail associée à votre compte.
            Une vérification d’identité pourra être demandée avant traitement
            de la demande.
          </p>
        </section>

        <section>
          <h2>6. Durée de conservation</h2>
          <p>
            Les données de compte sont conservées pendant la durée d’utilisation
            du service, puis supprimées ou anonymisées dans un délai raisonnable
            après la fermeture du compte, sous réserve des obligations légales
            de conservation. Les données nécessaires à la facturation et à la
            preuve des transactions peuvent être conservées pendant la durée
            imposée par la loi.
          </p>
          <p>
            L’historique de génération est conservé tant que le compte est
            actif, sauf demande de suppression ou durée différente indiquée
            dans le service.
          </p>
        </section>

        <section>
          <h2>7. Sécurité et cookies</h2>
          <p>
            Nous mettons en place des mesures techniques et organisationnelles
            raisonnables pour protéger les données contre l’accès non autorisé,
            la perte ou la divulgation. Des cookies ou technologies similaires
            peuvent être utilisés pour maintenir la session, sécuriser le
            compte et mesurer le fonctionnement du site.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Pour toute question ou demande relative à vos données personnelles,
            utilisez le moyen de contact publié sur le site. L’adresse de
            contact définitive sera ajoutée avec les informations légales de
            l’entreprise.
          </p>
          <p><Link to="/conditions-generales-utilisation">Consulter les Conditions Générales d’Utilisation →</Link></p>
        </section>
      </article>
    </main>
  );
}