import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { ProtocolLabPane } from '@/components/editor/ProtocolLabPane'
import { LessonVisual } from '@/components/visuals/LessonVisual'

declare const window: Window & { LESSON: any; VISUALS: string[] }
function App() {
  const lesson = window.LESSON
  const [code, setCode] = useState<string>(lesson.starterCode)
  const [check, setCheck] = useState<any>(null)
  return (
    <div>
      <div style={{ height: 760 }}>
        <ProtocolLabPane lesson={lesson} code={code} onChange={setCode} onReset={() => setCode(lesson.starterCode)} isChecking={false} checkResult={check}
          onCheck={() => setCheck({ passed: 1, failed: 0, total: 1, allPassed: true, results: [{ name: 'demo check', passed: true }] })} />
      </div>
      <div style={{ padding: 16, maxWidth: 760 }}>{window.VISUALS.map((v, i) => <LessonVisual key={i} source={v} />)}</div>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
