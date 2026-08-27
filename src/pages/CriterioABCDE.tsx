import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const SINGLE_IMAGE_CRITERIA = [
  { letter: 'A', title: 'Asimetría', text: 'Una mitad del lunar no coincide con la otra.', image: '/images/abcde/asimetria.jpg' },
  { letter: 'B', title: 'Borde', text: 'Bordes irregulares, desiguales o mal definidos.', image: '/images/abcde/borde.jpg' },
  { letter: 'C', title: 'Color', text: 'Distintos tonos de marrón, negro o rojo en un mismo lunar.', image: '/images/abcde/color.jpg' },
  { letter: 'D', title: 'Diámetro', text: 'Mayor a 6mm, aproximadamente el tamaño de un borrador de lápiz.', image: '/images/abcde/diametro.avif' },
];

export default function CriterioABCDE() {
  const guardSessionRaw = localStorage.getItem('melascan_session');
  if (!guardSessionRaw) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-content">
        <div className="abcde-card-block">
          <h1>Regla Dermatológica ABCDE</h1>
          <p>Los siguientes 5 parámetros son utilizados por dermatólogos para identificar melanomas sospechosos:</p>

          <div className="abcde-grid">
            {SINGLE_IMAGE_CRITERIA.map((c) => (
              <div className="abcde-card" key={c.letter}>
                <img src={c.image} alt={c.title} className="abcde-image" />
                <span className="abcde-letter">{c.letter}</span>
                <h4>{c.title}</h4>
                <p>{c.text}</p>
              </div>
            ))}

            <div className="abcde-card">
              <div className="abcde-compare">
                <div className="abcde-compare-item">
                  <img src="/images/abcde/evolucion-antes.png" alt="Lunar - foto anterior" className="abcde-image" />
                  <span className="abcde-compare-label">2012</span>
                </div>
                <div className="abcde-compare-item">
                  <img src="/images/abcde/evolucion-despues.png" alt="Lunar - foto posterior" className="abcde-image" />
                  <span className="abcde-compare-label">2017</span>
                </div>
              </div>
              <span className="abcde-letter">E</span>
              <h4>Evolución</h4>
              <p>Cambios en tamaño, forma, color o síntomas con el tiempo.</p>
            </div>
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