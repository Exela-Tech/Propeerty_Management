import { Suspense } from "react"
import { Building2 } from "lucide-react"
import { TeamMemberSignupForm } from "./team-member-signup-form"
import { Card, CardContent } from "@/components/ui/card"

export default function TeamMemberSignupPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8" />
          <h1 className="text-2xl font-bold">PropertyPro</h1>
        </div>
        <Suspense
          fallback={
            <Card>
              <CardContent className="flex justify-center py-6">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </CardContent>
            </Card>
          }
        >
          <TeamMemberSignupForm />
        </Suspense>
      </div>
    </div>
  )
}
