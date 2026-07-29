import { Link } from "react-router-dom";
import "./Legal.css";

function LegalHeader({ title, eyebrow }) {
  return (
    <header className="legal-header">
      <span className="legal-eyebrow">{eyebrow}</span>
      <h1 className="legal-title">{title}</h1>
      <p className="legal-updated">Dernière mise à jour : 29 juillet 2026</p>
      <div className="legal-company-placeholder">
        <strong>Informations légales à compléter</strong>
        [Nom de l'entreprise / du responsable] — [Adresse] — [SIRET]
      </div>
    </header>
  );
}

export default function Terms() {
  return (
    <main className="legal-page">
      <LegalHeader eyebrow="Vysion" title="Conditions Générales d’Utilisation" />
      <article className="legal-content">
        <section>
          <h2>1. Objet du service</h2>
          <p>
            Les présentes Conditions Générales d’Utilisation encadrent l’accès et
            l’utilisation de Vysion, un service de génération et de
            transformation d’images assistées par intelligence artificielle.
            En créant un compte ou en utilisant le service, l’utilisateur
            reconnaît avoir pris connaissance des présentes conditions et les
            accepter.
          </p>
        </section>

        <section>
          <h2>2. Description de l’offre</h2>
          <p>
            Vysion permet notamment de transformer une image, de visualiser des
            modifications sur un véhicule et de générer des créations à partir
            d’instructions fournies par l’utilisateur. Le service peut évoluer,
            notamment pour améliorer ses modèles, ses fonctionnalités et sa
            sécurité.
          </p>
          <p>
            L’accès peut être proposé sous différentes formes :
          </p>
          <ul>
            <li>des abonnements donnant droit à un volume de crédits mensuel ;</li>
            <li>des recharges de crédits utilisables selon les conditions affichées au moment de l’achat ;</li>
            <li>la fonctionnalité SnapRouge, lorsqu’elle est incluse dans l’offre de l’utilisateur.</li>
          </ul>
          <p>
            Les crédits sont personnels, non transférables et ne constituent
            pas une monnaie ayant cours légal. Les conditions, prix et volumes
            applicables sont ceux présentés sur la page Tarifs au moment de la
            commande.
          </p>
        </section>

        <section>
          <h2>3. Inscription et compte</h2>
          <p>
            L’utilisateur doit fournir des informations exactes et maintenir
            ses données de compte à jour. Il est responsable de la
            confidentialité de ses identifiants et de toute activité réalisée
            depuis son compte. Un compte est personnel et ne peut être vendu,
            prêté ou partagé.
          </p>
          <p>
            L’utilisateur doit être légalement autorisé à utiliser le service.
            Vysion peut suspendre ou fermer un compte en cas de fraude, de
            contournement des limites, d’utilisation illicite ou de violation
            des présentes conditions.
          </p>
        </section>

        <section>
          <h2>4. Contenus fournis et générés</h2>
          <p>
            L’utilisateur conserve ses droits sur les images, textes et autres
            éléments qu’il fournit à Vysion. Il garantit disposer des droits
            nécessaires pour les utiliser et ne pas porter atteinte aux droits
            de tiers.
          </p>
          <p>
            Sous réserve du paiement de l’offre applicable et pendant la durée
            d’un abonnement actif, Vysion accorde à l’utilisateur une licence
            commerciale sur les images générées avec son compte. Cette licence
            n’autorise pas l’utilisation du service pour produire des contenus
            illicites, trompeurs, diffamatoires, haineux ou portant atteinte à
            la vie privée d’autrui.
          </p>
          <p>
            Les résultats générés par une IA peuvent être imprécis, similaires
            à des contenus existants ou ne pas correspondre exactement à la
            demande. L’utilisateur doit vérifier les résultats avant toute
            publication ou utilisation commerciale.
          </p>
        </section>

        <section>
          <h2>5. Paiement et facturation</h2>
          <p>
            Les abonnements et recharges sont facturés selon le prix affiché au
            moment de la commande. Les paiements sont traités de manière
            sécurisée par Stripe. Vysion ne stocke pas les coordonnées
            complètes de carte bancaire.
          </p>
          <p>
            Un abonnement est renouvelé automatiquement à chaque échéance
            jusqu’à sa résiliation. Toute taxe applicable est incluse ou
            indiquée selon les mentions affichées lors du paiement.
          </p>
        </section>

        <section>
          <h2>6. Annulation et remboursement</h2>
          <p>
            L’utilisateur peut résilier son abonnement depuis son espace client
            ou selon les modalités indiquées par le service. La résiliation
            prend effet à la fin de la période déjà facturée, sauf indication
            contraire.
          </p>
          <p>
            Vysion applique une politique « Satisfait ou remboursé » pendant
            une période de <span className="legal-placeholder">[DÉLAI À DÉFINIR]</span>{" "}
            à compter de l’achat, sous réserve des conditions qui seront
            précisées par l’entreprise. Toute demande doit être adressée via le
            moyen de contact indiqué sur le site.
          </p>
        </section>

        <section>
          <h2>7. Responsabilité</h2>
          <p>
            Vysion met en œuvre des moyens raisonnables pour assurer la
            disponibilité et la sécurité du service, sans garantir un accès
            continu ni l’absence d’erreur. Le service peut être interrompu
            pour maintenance, mise à jour ou cause indépendante de la volonté
            de Vysion.
          </p>
          <p>
            Vysion ne saurait être responsable des décisions prises sur la base
            d’une image générée, de l’utilisation de contenus fournis sans
            autorisation, ni des dommages indirects résultant de l’utilisation
            du service, dans les limites autorisées par la loi.
          </p>
        </section>

        <section>
          <h2>8. Droit applicable</h2>
          <p>
            Les présentes conditions sont soumises au droit français. Tout
            litige sera, à défaut de résolution amiable, soumis aux juridictions
            compétentes dans les conditions prévues par la réglementation
            applicable.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            Pour toute question concernant ces conditions, l’utilisateur peut
            contacter Vysion via le moyen de contact publié sur le site. Les
            informations d’identification de l’entreprise seront ajoutées dès
            la création du statut juridique.
          </p>
          <p><Link to="/politique-confidentialite">Consulter la Politique de Confidentialité →</Link></p>
        </section>
      </article>
    </main>
  );
}