import { Link } from "react-router-dom";
import "./Legal.css";

export default function LegalNotices() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <span className="legal-eyebrow">Vysion</span>
        <h1 className="legal-title">Mentions légales</h1>
        <p className="legal-updated">Dernière mise à jour : 29 juillet 2026</p>
      </header>

      <article className="legal-content">
        <section>
          <h2>Éditeur du site</h2>
          <h3>Dénomination sociale</h3>
          <p>[Nom de l'entreprise / du responsable]</p>
          <h3>Forme juridique</h3>
          <p>[Forme juridique à compléter]</p>
          <h3>Immatriculation</h3>
          <p>SIRET : [SIRET à compléter]</p>
          <h3>Siège social</h3>
          <p>[Adresse à compléter]</p>
          <h3>Contact</h3>
          <p>[Adresse e-mail de contact à compléter]</p>
        </section>

        <section>
          <h2>Hébergement</h2>
          <p>
            [Hébergeur à compléter]<br />
            [Adresse de l'hébergeur à compléter]
          </p>
        </section>

        <section>
          <h2>Politique de remboursement</h2>
          <p>
            Une demande de remboursement peut être effectuée dans un délai
            maximum de <strong>48 heures</strong> suivant l’achat d’un
            abonnement, d’un pack de crédits ou de tout autre produit numérique.
          </p>
          <ol>
            <li>Aucun crédit ne doit avoir été consommé depuis l’achat.</li>
            <li>L’abonnement ne doit pas avoir été résilié ou annulé.</li>
            <li>
              La demande doit être envoyée à{" "}
              <span className="legal-placeholder">[Adresse e-mail de contact]</span>{" "}
              avec l’adresse e-mail du compte et le motif de la demande.
            </li>
          </ol>
          <p>
            Passé ce délai, en cas de consommation de crédits ou de résiliation
            de l’abonnement, aucun remboursement ne pourra être effectué. Les
            produits numériques étant accessibles immédiatement après l’achat,
            le droit de rétractation de 14 jours ne s’applique pas, conformément
            à l’article L221-28 du Code de la consommation.
          </p>
        </section>

        <section>
          <p><Link to="/conditions-generales-utilisation">Conditions Générales d’Utilisation →</Link></p>
          <p><Link to="/politique-confidentialite">Politique de Confidentialité →</Link></p>
        </section>
      </article>
    </main>
  );
}