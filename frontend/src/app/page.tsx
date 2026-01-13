import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 16px" }}>
      {/* Header simple */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          paddingBottom: 24,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          marginBottom: 40,
        }}
      >
        <div style={{ fontWeight: 700 }}>Garance</div>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="#services">Services</Link>
          <Link href="#realisations">Réalisations</Link>
          <Link href="#approche">Approche</Link>
          <Link
            href="/contact"
            style={{
              padding: "10px 14px",
              border: "1px solid rgba(0,0,0,0.18)",
              borderRadius: 999,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Contact
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ paddingBottom: 56 }}>
        <p style={{ margin: 0, opacity: 0.75 }}>Coach Lean/Agile</p>
        <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: "14px 0 14px" }}>
          Challenger les équipes, bâtir la résilience, transformer les organisations
        </h1>
        <p style={{ fontSize: 18, maxWidth: 820, margin: "0 0 22px", opacity: 0.9 }}>
          J’accompagne équipes et organisations à trouver leur flow, renforcer leur résilience et évoluer de manière
          empirique, dans le respect de leur histoire, de leur culture et des dynamiques de leur écosystème.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/contact"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.18)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Me contacter
          </Link>
          <Link
            href="#approche"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.10)",
              fontWeight: 600,
              textDecoration: "none",
              opacity: 0.9,
            }}
          >
            Découvrir mon approche
          </Link>
        </div>
      </section>

      {/* Preuves rapides */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          paddingBottom: 56,
        }}
      >
        <div style={cardStyle}>
          <div style={cardKicker}>Ce que vous gagnez</div>
          <div style={cardTitle}>Plus de clarté</div>
          <div style={cardText}>Une direction partagée et un pilotage plus lisible.</div>
        </div>
        <div style={cardStyle}>
          <div style={cardKicker}>Ce que vous gagnez</div>
          <div style={cardTitle}>Plus de flow</div>
          <div style={cardText}>Moins de frictions, une livraison plus régulière.</div>
        </div>
        <div style={cardStyle}>
          <div style={cardKicker}>Ce que vous gagnez</div>
          <div style={cardTitle}>Plus de résilience</div>
          <div style={cardText}>Des équipes capables de s’adapter durablement.</div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ paddingBottom: 56 }}>
        <h2 style={h2}>Services</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div style={cardStyle}>
            <div style={cardTitle}>Diagnostic & plan d’action</div>
            <div style={cardText}>
              Cadrer le contexte, révéler les dynamiques, prioriser les leviers, et poser un plan réaliste.
            </div>
          </div>
          <div style={cardStyle}>
            <div style={cardTitle}>Coaching équipes & leaders</div>
            <div style={cardText}>
              Renforcer la collaboration, la responsabilisation, et la qualité des décisions au quotidien.
            </div>
          </div>
          <div style={cardStyle}>
            <div style={cardTitle}>Pilotage empirique</div>
            <div style={cardText}>
              Installer des boucles de feedback, des indicateurs utiles et une amélioration continue soutenable.
            </div>
          </div>
        </div>
      </section>

      {/* Réalisations */}
      <section id="realisations" style={{ paddingBottom: 56 }}>
        <h2 style={h2}>Réalisations</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div style={cardStyle}>
            <div style={cardKicker}>Cas</div>
            <div style={cardTitle}>Stabiliser le delivery</div>
            <div style={cardText}>Réduction des frictions, clarification des priorités, cadence plus régulière.</div>
          </div>
          <div style={cardStyle}>
            <div style={cardKicker}>Cas</div>
            <div style={cardTitle}>Réduire le time-to-value</div>
            <div style={cardText}>Amélioration du flux, focus sur le travail “terminé”, feedback plus court.</div>
          </div>
          <div style={cardStyle}>
            <div style={cardKicker}>Cas</div>
            <div style={cardTitle}>Installer un pilotage durable</div>
            <div style={cardText}>Indicateurs utiles, rituels de décision, gouvernance plus légère.</div>
          </div>
        </div>
      </section>

      {/* Approche / Pourquoi */}
      <section id="approche" style={{ paddingBottom: 56 }}>
        <h2 style={h2}>Approche</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
          <div style={{ padding: 18, border: "1px solid rgba(0,0,0,0.10)", borderRadius: 16 }}>
            <div style={cardKicker}>Pourquoi</div>
            <p style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
              Je rêve d’organisations qui se transforment durablement, portées par des équipes ayant trouvé leur flow et
              construit leur résilience. Des organisations qui évoluent de manière empirique, en respectant leur
              histoire, leur culture et les dynamiques de leur écosystème.
            </p>

            <div style={{ height: 14 }} />

            <div style={cardKicker}>Ce que j’y fais</div>
            <p style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
              J’accompagne les équipes et les organisations dans leur cheminement, en révélant leur potentiel
              collaboratif et en les aidant à s’adapter.
            </p>
          </div>

          <div style={{ padding: 18, border: "1px solid rgba(0,0,0,0.10)", borderRadius: 16 }}>
            <div style={cardKicker}>Principes</div>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Empirisme et feedback</li>
              <li>Respect du contexte et de l’histoire</li>
              <li>Clarté, focus, flux</li>
              <li>Exigence et bienveillance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ paddingBottom: 24 }}>
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Vous avez un contexte à clarifier ?</div>
            <div style={{ opacity: 0.85 }}>Un premier échange suffit souvent à poser le bon diagnostic.</div>
          </div>
          <Link
            href="/contact"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.18)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Prendre contact
          </Link>
        </div>
      </section>

      <footer style={{ paddingTop: 28, borderTop: "1px solid rgba(0,0,0,0.08)", opacity: 0.85 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>© {new Date().getFullYear()} Garance</div>
          <div style={{ display: "flex", gap: 14 }}>
            <a href="/contact">Contact</a>
            <a href="#">Mentions légales</a>
            <a href="#">Confidentialité</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const h2: React.CSSProperties = {
  fontSize: 26,
  margin: "0 0 16px",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 16,
  padding: 18,
};

const cardKicker: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.7,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginTop: 8,
};

const cardText: React.CSSProperties = {
  marginTop: 8,
  opacity: 0.9,
  lineHeight: 1.6,
};
