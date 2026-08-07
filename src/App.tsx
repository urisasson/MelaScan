import { useState } from 'react'

import Home from "./pages/Home"
import About from './pages/About';


import './App.css'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';


const router = createBrowserRouter([
  {
    path:"/",
    element: <Home />
  },
  {
    path:"/Home",
    element: <Home />
  },
  {
    path: "/about",
    element: <About />,
  },
]);

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

      {/* 3. Provide the router layout to the application */}
      <RouterProvider router={router} />
    </>
  )
}

export default App
