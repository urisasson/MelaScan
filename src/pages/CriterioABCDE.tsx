import Sidebar from '../components/Sidebar';

const CRITERIA = [
  { letter: 'A', title: 'Asimetría', text: 'Una mitad del lunar no coincide con la otra.' },
  { letter: 'B', title: 'Borde', text: 'Bordes irregulares, desiguales o mal definidos.' },
  { letter: 'C', title: 'Color', text: 'Distintos tonos de marrón, negro o rojo en un mismo lunar.' },
  { letter: 'D', title: 'Diámetro', text: 'Mayor a 6mm, aproximadamente el tamaño de un borrador de lápiz.' },
  { letter: 'E', title: 'Evolución', text: 'Cambios en tamaño, forma, color o síntomas con el tiempo.' },
];

export default function CriterioABCDE() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="abcde-card-block">
          <h1>Regla Dermatológica ABCDE</h1>
          <p>Los siguientes 5 parámetros son utilizados por dermatólogos para identificar melanomas sospechosos:</p>

          <div className="abcde-grid">
            {CRITERIA.map((c) => (
              <div className="abcde-card" key={c.letter}>
                {/* TODO: reemplazar por una imagen real de referencia de este criterio */}
                <div className="abcde-image-placeholder" />
                <span className="abcde-letter">{c.letter}</span>
                <h4>{c.title}</h4>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="abcde-card-block">
          <h2>Ejemplos de lunares</h2>
          <div className="mole-examples-grid">
            <div className="mole-example">
              <h3>Lunares benignos</h3>
              {/* TODO: reemplazar por imágenes reales del dataset (HAM10000 / ISIC) */}
              <div className="mole-image-placeholder" />
            </div>
            <div className="mole-example">
              <h3>Lunares melanoma</h3>
              <div className="mole-image-placeholder" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}