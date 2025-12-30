import { Suspense } from "react"
import ExpensesContent from "./expenses-content"
import Loading from "./loading"

export default function ExpensesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExpensesContent />
    </Suspense>
  )
}
