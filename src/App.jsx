import './App.css'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <>
      <h1>Count:{count}</h1>
      <button 
      onClick={ () => {
        setCount(prev => prev + 1)
      } }
      >
        증가
      </button>
    </>
  )
}

export default App
