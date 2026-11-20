import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CurriculumTree } from '@/components/curriculum/CurriculumTree'

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <CurriculumTree track="BE" />
  </QueryClientProvider>,
)
