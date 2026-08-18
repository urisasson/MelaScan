import Sidebar from '../components/Sidebar';

const CRITERIA = [
  { letter: 'A', title: 'Asimetría', text: 'Una mitad del lunar no coincide con la otra.', image: '/images/abcde/asimetria.jpg' },
  { letter: 'B', title: 'Borde', text: 'Bordes irregulares, desiguales o mal definidos.', image: '/images/abcde/borde.jpg' },
  { letter: 'C', title: 'Color', text: 'Distintos tonos de marrón, negro o rojo en un mismo lunar.', image: '/images/abcde/color.jpg' },
  { letter: 'D', title: 'Diámetro', text: 'Mayor a 6mm, aproximadamente el tamaño de un borrador de lápiz.', image: '/images/abcde/diametro.jpg' },
  { letter: 'E', title: 'Evolución', text: 'Cambios en tamaño, forma, color o síntomas con el tiempo.', image: '/images/abcde/evolucion.jpg' },
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
                <img src={c.image} alt={c.title} className="abcde-image" />
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
              <img src="/images/moles/benigno.jpg" alt="Ejemplo de lunar benigno" className="mole-image" />
            </div>
            <div className="mole-example">
              <h3>Lunares melanoma</h3>
              <img src="/images/moles/melanoma.jpg" alt="Ejemplo de lunar melanoma" className="mole-image" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}