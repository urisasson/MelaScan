import { createBrowserRouter, RouterProvider} from 'react-router-dom';

import Home from "./pages/Home"
import About from './pages/About';
import Inicio from './pages/Inicio';
import './App.css'


const router = createBrowserRouter([
  {
    path:"/",
    element: <Inicio />
  },
  {
    path:"/Home",
    element: <Home />
  },
  {
    path: "/about",
    element: <About />,
    },
    
  {
    path: "/Inicio",
    element: <Inicio />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
