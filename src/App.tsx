import { createBrowserRouter, RouterProvider} from 'react-router-dom';

import Home from "./pages/Home"
import Inicio from './pages/Inicio';
import Historial from './pages/Historial';
import CriterioABCDE from './pages/CriterioABCDE';
import Chat from './pages/Chat';
import './App.css'


const router = createBrowserRouter([
  {
    path:"/",
    element: <Inicio />
  },
  {
    path:"/home",
    element: <Home />
  },
  {
    path: "/Inicio",
    element: <Inicio />,
  },
  ,
  {
    path: "/historial",
    element: <Historial />,
  },
  ,
  {
    path: "/abcde",
    element: <CriterioABCDE />,
  },
  ,
  {
    path: "/chats",
    element: <Chat />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
