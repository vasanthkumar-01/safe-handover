import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import HandoverAnalysis from './pages/HandoverAnalysis'
import ShiftChange from './pages/ShiftChange'
import SubsequentEvents from './pages/SubsequentEvents'
import FailureCases from './pages/FailureCases'
import Metrics from './pages/Metrics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analysis" element={<HandoverAnalysis />} />
          <Route path="shift-change" element={<ShiftChange />} />
          <Route path="subsequent-events" element={<SubsequentEvents />} />
          <Route path="failure-cases" element={<FailureCases />} />
          <Route path="metrics" element={<Metrics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
